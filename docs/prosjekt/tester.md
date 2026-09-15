# Tester

Testskript ligger i `scripts/`. De fleste krever kjørende server (`npm run dev`, standard `http://localhost:3000`). Overstyr med `TEST_BASE_URL`.

Delt hjelpebibliotek: `scripts/lib/test-helpers.ts` (`api`, `adminApi`, `assertConsistent`, `resetAll`).

## npm-kommandoer

| Kommando | Skript | Server? |
| --- | --- | --- |
| `npm run test:walkovers` | `test-walkovers.ts` | Nei (unit) |
| `npm run test:duplicate-names` | `test-duplicate-names.ts` | Ja |
| `npm run test:consistency` | `test-db-consistency.ts` | Ja |
| `npm run test:firestore` | `test-firestore-integration.ts` | Ja + Firebase |
| `npm run test:cup-16` | `test-complete-16-cup.ts` | Ja |
| `npm run test:cup-63` | `test-cup-63-players.ts` | Ja |
| `npm run test:resets` | `test-tournament-resets.ts` | Ja |
| `npm run test:populate-reset` | `test-populate-and-reset.ts` | Ja |
| `npm run test:load-500` | `test-load-500.ts` | Ja |
| `npm run test:push` | `test-push-notifications.ts` | Ja + Firebase |
| `npm run validate:db` | `validate-db.ts` | Nei (leser `data/db.json`) |
| `npm run test:all` | Flere i sekvens | Blandet |

**Uten npm-script** (kjør med `npx tsx scripts/...`):

- `critical-retest.ts` — 12-punkts GAIS-retest
- `test-tournament-simulator.ts` — simulator-enhetstester

## Dekning per skript

| Skript | Hva det tester |
| --- | --- |
| `test-walkovers.ts` | Bracket walkovers: antall, fordeling, én kamp per spiller, bye-fremgang |
| `test-duplicate-names.ts` | `Oliver_1`/`Oliver_2`, separate bonger, `AMBIGUOUS_NAME` |
| `test-db-consistency.ts` | 12 API-scenarioer med `validateAppState` etter hvert steg |
| `test-firestore-integration.ts` | Firestore read/write, sync, person→register→popcorn i cloud |
| `test-complete-16-cup.ts` | Full 16-spiller cup fra registrering til vinner |
| `test-cup-63-players.ts` | 63 spillere på 64-bracket, alle runder, mester |
| `test-tournament-resets.ts` | Reset mellom cuper, testdata, 5-spiller draw, keepParticipants |
| `test-populate-and-reset.ts` | Simulate → reset-testdata → reset-all |
| `test-load-500.ts` | 500 parallelle personer, popcorn, cup, polling, ETag under last |
| `test-push-notifications.ts` | VAPID, subscribe, Firestore-persistens, køstatus, dispatch |
| `validate-db.ts` | Offline validering av `data/db.json` |
| `test-tournament-simulator.ts` | Format-normalisering, Bo3, simulator uten API |
| `critical-retest.ts` | Konkurranse popcorn, Oliver-isolasjon, walkovers, 409-konflikt, reset |

## Kjør alt

```bash
npm run dev          # i ett terminalvindu
npm run test:all     # i et annet
```

For offline validering uten server:

```bash
npm run validate:db
npm run test:walkovers
```
