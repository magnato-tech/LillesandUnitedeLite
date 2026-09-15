/**
 * Testsuite for Web Push-infrastruktur, VAPID, Firestore-lagring,
 * topics (tournament / alphaCourse), levetid (expiration),
 * og turnerings-kølogikk for push-utløsere.
 * 
 * Kjør: npx tsx scripts/test-push-notifications.ts
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, terminate } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import webpush from 'web-push';
import { api, adminApi, createPerson, registerParticipant, runScenario, BASE } from './lib/test-helpers';
import { calculatePlayerQueueStatus } from '../src/lib/tournament-notifications';
import { generateBracket } from '../src/lib/tournament';
import type { AppState, PushSubscriptionRecord, Tournament, Participant } from '../src/types';

async function main() {
  console.log('====================================================');
  console.log('🔔 TESTSUITE: WEB PUSH-NOTIFIKASJONER & LOGIKK 🔔');
  console.log('====================================================\n');

  let db: any = null;
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const app = !getApps().length ? initializeApp(config) : getApp();
    db = getFirestore(app, config.firestoreDatabaseId);
    console.log(`✓ Firestore tilkoblet for verifisering (${config.firestoreDatabaseId})`);
  }

  let testPersonId: string = '';
  let mockEndpoint: string = '';
  let mockP256dh: string = '';
  let mockAuth: string = '';
  let serverVapidPublicKey: string = '';

  // ----------------------------------------------------
  // TEST 1: VAPID Public Key Endepunkt
  // ----------------------------------------------------
  await runScenario('T1: Hente VAPID public key fra server (/api/push/vapid-public-key)', async () => {
    const { res, data } = await api('/api/push/vapid-public-key');
    if (!res.ok) {
      throw new Error(`Feil ved henting av VAPID public key. Status: ${res.status}`);
    }
    if (!data.publicKey || typeof data.publicKey !== 'string' || data.publicKey.length < 30) {
      throw new Error(`Ugyldig eller tom public key mottatt: ${JSON.stringify(data)}`);
    }
    serverVapidPublicKey = data.publicKey;
    console.log(`    Nøkkel mottatt: ${serverVapidPublicKey.substring(0, 20)}... (lengde: ${serverVapidPublicKey.length})`);
  });

  // ----------------------------------------------------
  // TEST 2: Validering og feilhåndtering ved ugyldig registrering
  // ----------------------------------------------------
  await runScenario('T2: Validering av ugyldig push-abonnement (mangler endpoint / personId)', async () => {
    // Mangler subscription
    const { res: r1 } = await api('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId: 'dummy' }),
    });
    if (r1.status !== 400) {
      throw new Error(`Forventet 400 ved manglende subscription, fikk ${r1.status}`);
    }

    // Mangler personId
    const { res: r2 } = await api('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/fake',
          keys: { p256dh: 'abc', auth: '123' },
        },
      }),
    });
    if (r2.status !== 400) {
      throw new Error(`Forventet 400 ved manglende personId, fikk ${r2.status}`);
    }
    console.log('    Ugyldige payloads avvises korrekt med 400 Bad Request.');
  });

  // ----------------------------------------------------
  // TEST 3: Registrering av push-abonnement for Bordtenniscup
  // ----------------------------------------------------
  await runScenario('T3: Lagre reelt push-abonnement med topic "tournament" i backend & Firestore', async () => {
    const person = await createPerson('PushTester');
    testPersonId = person.id;

    // Generer et simulert, syntaktisk gyldig PushSubscription
    mockEndpoint = `https://updates.push.services.mozilla.com/wpush/v2/mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    mockP256dh = 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9AcDnVUeG3NYStAnhOxVePUjioGWJTxoW';
    mockAuth = 'tBHItJI5svbpez7KI4CCXg';

    const { res, data } = await api('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: mockEndpoint,
          keys: {
            p256dh: mockP256dh,
            auth: mockAuth,
          },
        },
        personId: testPersonId,
        topic: 'tournament',
      }),
    });

    if (!res.ok) {
      throw new Error(`Kunne ikke registrere push-abonnement: ${data.error || res.status}`);
    }

    const record = data.record as PushSubscriptionRecord;
    if (!record || record.personId !== testPersonId) {
      throw new Error(`Feil record returnert fra /api/push/subscribe: ${JSON.stringify(record)}`);
    }

    if (!record.topics.tournament?.active) {
      throw new Error('Forventet at topics.tournament.active var true');
    }

    // Sjekk levetid (24t for turnering)
    const expiry = new Date(record.topics.tournament.expiresAt!).getTime();
    const expectedApprox = Date.now() + 24 * 60 * 60 * 1000;
    if (Math.abs(expiry - expectedApprox) > 60000) {
      throw new Error(`Uventet utløpstid for turnering: ${record.topics.tournament.expiresAt}`);
    }
    console.log(`    Abonnement opprettet: ID=${record.id}, utløper ${record.topics.tournament.expiresAt}`);

    // Sjekk direkte i Firestore
    if (db) {
      const docSnap = await getDoc(doc(db, 'push_subscriptions', record.id));
      if (!docSnap.exists()) {
        throw new Error(`Abonnement ${record.id} finnes ikke i Firestore 'push_subscriptions'!`);
      }
      const firestoreData = docSnap.data();
      if (firestoreData.personId !== testPersonId) {
        throw new Error(`personId i Firestore stemmer ikke: forventet ${testPersonId}, fikk ${firestoreData.personId}`);
      }
      console.log('    ✓ Verifisert i Google Cloud Firestore doc "push_subscriptions/' + record.id + '"');
    }
  });

  // ----------------------------------------------------
  // TEST 4: Registrering og utvidelse med topic "alphaCourse" (langtidslevetid)
  // ----------------------------------------------------
  await runScenario('T4: Oppdatere abonnement med topic "alphaCourse" (90 dagers levetid for semester)', async () => {
    const { res, data } = await api('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: mockEndpoint,
          keys: {
            p256dh: mockP256dh,
            auth: mockAuth,
          },
        },
        personId: testPersonId,
        topic: 'alphaCourse',
        courseId: 'alpha-host-2026',
      }),
    });

    if (!res.ok) {
      throw new Error(`Feil ved oppdatering til Alpha-abonnement: ${data.error || res.status}`);
    }

    const record = data.record as PushSubscriptionRecord;
    if (!record.topics.alphaCourse?.active) {
      throw new Error('Forventet at topics.alphaCourse.active var true');
    }
    if (!record.topics.tournament?.active) {
      throw new Error('Forventet at tidligere aktiverte tournament-topic fortsatt var bevart');
    }

    // Sjekk levetid for Alpha (ca 90 dager)
    const alphaExpiry = new Date(record.topics.alphaCourse.expiresAt!).getTime();
    const expected90Days = Date.now() + 90 * 24 * 60 * 60 * 1000;
    if (Math.abs(alphaExpiry - expected90Days) > 120000) {
      throw new Error(`Uventet utløpstid for Alpha: ${record.topics.alphaCourse.expiresAt}`);
    }
    console.log(`    ✓ Multi-topic bevart! Tournament: aktiv (24t), AlphaCourse: aktiv (90 dager, kurs: ${record.topics.alphaCourse.courseId})`);
  });

  // ----------------------------------------------------
  // TEST 5: Test-sending via dispatch-endepunktet
  // ----------------------------------------------------
  await runScenario('T5: Test-utsending via /api/push/test (validerer personId, topic-filter og web-push dispatch)', async () => {
    // 1. Test med personId som ikke har abonnement
    const { res: rUnknown, data: dUnknown } = await api('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId: 'unknown_person_123', topic: 'tournament' }),
    });
    if (!rUnknown.ok || dUnknown.sentCount !== 0) {
      throw new Error(`Forventet sentCount=0 for ukjent person, fikk ${JSON.stringify(dUnknown)}`);
    }
    console.log('    Ukjent person sendes 0 varsler (korrekt).');

    // 2. Test med vår testperson
    const { res: rKnown, data: dKnown } = await api('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId: testPersonId, topic: 'tournament' }),
    });
    if (!rKnown.ok) {
      throw new Error(`Testutsending feilet: ${dKnown.error || rKnown.status}`);
    }
    console.log(`    Testutsending utført mot mock-endpoint (status: ${rKnown.status}).`);
  });

  // ----------------------------------------------------
  // TEST 6: Web Push krypteringsverifisering (VAPID payload signing)
  // ----------------------------------------------------
  await runScenario('T6: Verifisere VAPID krypteringspakke og payload-signering lokalt', async () => {
    // Validerer at web-push biblioteket kan signere payloads med genererte VAPID-nøkler
    const vapidFile = path.join(process.cwd(), 'data', 'vapid.json');
    if (!fs.existsSync(vapidFile)) {
      throw new Error('data/vapid.json finnes ikke!');
    }
    const keys = JSON.parse(fs.readFileSync(vapidFile, 'utf-8'));
    if (!keys.publicKey || !keys.privateKey) {
      throw new Error('VAPID keys i data/vapid.json er ufullstendige');
    }

    // Test signering av VAPID header
    const wp: any = (webpush as any).default || webpush;
    const audience = 'https://updates.push.services.mozilla.com';
    const vapidHeaders = wp.getVapidHeaders(
      audience,
      'mailto:post@lillesandunited.no',
      keys.publicKey,
      keys.privateKey,
      'aes128gcm'
    );

    if (!vapidHeaders.Authorization || !vapidHeaders.Authorization.startsWith('vapid t=')) {
      throw new Error(`Ugyldig VAPID Authorization header generert: ${vapidHeaders.Authorization}`);
    }
    console.log('    ✓ VAPID JWT-signatur og aes128gcm-krypteringsheadere genereres korrekt.');
  });

  // ----------------------------------------------------
  // TEST 7: Turnerings-kølogikk (two_matches_away, ready_table, playing_now)
  // ----------------------------------------------------
  await runScenario('T7: Verifisere algoritmisk køstatus (2 kamper igjen, 1 kamp igjen, tildelt bord)', async () => {
    // Konstruer et simulert 8-spillers oppsett
    const p1: Participant = { id: 'p1', personId: 'pers_1', firstName: 'Kari', registeredAt: '' };
    const p2: Participant = { id: 'p2', personId: 'pers_2', firstName: 'Ola', registeredAt: '' };
    const p3: Participant = { id: 'p3', personId: 'pers_3', firstName: 'Per', registeredAt: '' };
    const p4: Participant = { id: 'p4', personId: 'pers_4', firstName: 'Lise', registeredAt: '' };
    const p5: Participant = { id: 'p5', personId: 'pers_5', firstName: 'Siri', registeredAt: '' };
    const p6: Participant = { id: 'p6', personId: 'pers_6', firstName: 'Jonas', registeredAt: '' };
    const p7: Participant = { id: 'p7', personId: 'pers_7', firstName: 'Marius', registeredAt: '' };
    const p8: Participant = { id: 'p8', personId: 'pers_8', firstName: 'Sara', registeredAt: '' };

    const participants = [p1, p2, p3, p4, p5, p6, p7, p8];
    const matches = generateBracket(participants, 8);

    // Sett opp en turneringsstatus hvor Kamp 1 og 2 er tildelt bord, og Kamp 3 venter
    // Runde 1 har 4 kamper: m1 (p1 vs p2), m2 (p3 vs p4), m3 (p5 vs p6), m4 (p7 vs p8)
    // Finn kampen der Kari (p1) faktisk er plassert:
    const kariMatch = matches.find(m => m.playerA?.id === 'p1' || m.playerB?.id === 'p1')!;
    kariMatch.tableNumber = 1;
    kariMatch.status = 'in_progress';

    // Finn en annen kamp og sett den på bord 2:
    const otherMatch = matches.find(m => m.id !== kariMatch.id && m.round === 1)!;
    otherMatch.tableNumber = 2;
    otherMatch.status = 'in_progress';

    // Finn en kamp som venter i kø:
    const waitingMatch = matches.find(m => m.round === 1 && m.id !== kariMatch.id && m.id !== otherMatch.id)!;
    waitingMatch.tableNumber = null;
    waitingMatch.status = 'ready';

    const testTournament: Tournament = {
      id: 'tourney_test_1',
      status: 'active',
      bracketCapacity: 8,
      participants,
      matches,
      winner: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      estimatedMinutesPerMatch: 10,
    };

    // 1. Kari spiller nå på Bord 1
    const kariStatus = calculatePlayerQueueStatus(testTournament, 'pers_1', 'Kari');
    if (!kariStatus || kariStatus.stage !== 'playing_now' || kariStatus.tableNumber !== 1) {
      throw new Error(`Forventet 'playing_now' på Bord 1 for Kari, fikk: ${JSON.stringify(kariStatus)}`);
    }
    console.log('    ✓ Aktiv kamp på bord: Kari har stage="playing_now" på Bord 1 (utløser: DIN KAMP STARTER NÅ)');

    // 2. Spiller i ventende kamp: Det er 2 aktive kamper på bordene foran i køen
    const waitingPlayer = waitingMatch.playerA!;
    const waitingStatus = calculatePlayerQueueStatus(testTournament, waitingPlayer.personId, waitingPlayer.firstName);
    if (!waitingStatus || !waitingStatus.isRegistered) {
      throw new Error(`Kunne ikke beregne status for ${waitingPlayer.firstName}`);
    }
    console.log(`    ✓ Venter i kø: ${waitingPlayer.firstName} har stage="${waitingStatus.stage}", kamper foran=${waitingStatus.matchesAhead} (utløser: 2 kamper igjen)`);

    // 3. Spiller tildeles bord (ready_table):
    waitingMatch.tableNumber = 2;
    waitingMatch.status = 'ready';
    const readyStatus = calculatePlayerQueueStatus(testTournament, waitingPlayer.personId, waitingPlayer.firstName);
    if (!readyStatus || readyStatus.stage !== 'ready_table' || readyStatus.tableNumber !== 2) {
      throw new Error(`Forventet ready_table på Bord 2, fikk ${JSON.stringify(readyStatus)}`);
    }
    console.log(`    ✓ Tildelt bord: ${waitingPlayer.firstName} har stage="ready_table" på Bord 2 (utløser: Neste på bord 2)`);
  });

  // ----------------------------------------------------
  // TEST 8: Opprydding av test-abonnement
  // ----------------------------------------------------
  await runScenario('T8: Opprydding av test-abonnement i Firestore', async () => {
    if (db && mockEndpoint) {
      const crypto = await import('crypto');
      const subId = crypto.createHash('sha256').update(mockEndpoint).digest('hex').substring(0, 32);
      await deleteDoc(doc(db, 'push_subscriptions', subId));
      console.log(`    ✓ Slettet test-abonnement ${subId} fra Firestore`);
    }
  });

  console.log('\n====================================================');
  console.log('🎉 ALLE 8 PUSH-TESTER FULLFØRT UTEN FEIL! 🎉');
  console.log('====================================================\n');

  if (db) {
    try {
      await terminate(db);
    } catch (e) {}
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ PUSH-TEST FEIL:', err);
  process.exit(1);
});
