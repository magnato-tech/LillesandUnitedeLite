# Arkitektur

## Overordnet

Lillesand United er en **single-page app** med **Express-backend** i samme prosess. I utvikling kjører Vite som middleware; i produksjon serveres bygget fra `dist/`.

```
┌─────────────────────────────────────────────────────────┐
│  React (src/)                                           │
│  App.tsx → faner, polling, lokal Person-sesjon          │
│  api.ts  → fetch mot /api/*                             │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (JSON)
┌────────────────────────▼────────────────────────────────┐
│  Express (server.ts)                                    │
│  • in-memory AppState                                   │
│  • turneringslogikk (src/lib/tournament.ts)             │
│  • web-push (web-push + VAPID)                          │
│  • valgfri Firestore-synk                               │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
    data/db.json                  Firestore
    (alltid)                      (valgfritt)
```

## Oppstart (`server.ts`)

1. Les miljøvariabler: `PORT`, `ADMIN_PIN`, `RESET_PIN`
2. Registrer `express.json()` (256 KB grense)
3. Init Firebase/Firestore fra `firebase-applet-config.json` (graceful fallback)
4. `loadState()` fra `data/db.json` (eller `INITIAL_STATE`)
5. Last/generer VAPID-nøkler i `data/vapid.json`
6. `initFirestoreAndMigrate()` — synk med Firestore ved oppstart
7. `loadPushSubscriptionsFromFirestore()` — push-abonnementer
8. Vite middleware (dev) eller `express.static(dist)` (prod)
9. `listen(0.0.0.0, PORT)`

## Persistens

### Lokal fil (`data/db.json`)

- **Lesing:** ved oppstart; migrerer legacy-personer (`nameNumber`, `displayId`)
- **Skriving:** atomisk via `db.json.tmp` → rename ved hver `saveState()`
- Alltid skrevet, uavhengig av Firestore

### Firestore (valgfritt)

Aktiveres når `firebase-applet-config.json` finnes.

| Sti | Innhold |
| --- | --- |
| `appState/current` | Full `AppState` (primær remote) |
| `persons/{id}` | Person-dokumenter (full sync) |
| `activities/{id}` | Aktivitetskort |
| `alphaInterests/{id}` | Alpha-påmeldinger |
| `push_subscriptions/{id}` | Web push (ikke i AppState) |
| `test/connection` | Tilkoblingstest |

**Oppstart:** Hvis Firestore har data → last remote og skriv lokal. Ellers → migrer `db.json` opp.

**Skriving:** Debounced 50 ms til `appState/current`. Admin kan tvinge med `/api/firestore/flush` eller full sync.

### Klient-cache

| Nøkkel | Lagring | Formål |
| --- | --- | --- |
| `lillesand_state_cache` | localStorage | Offline-fallback for state |
| `lillesand_active_person_*` | localStorage | Aktiv Person-sesjon |
| `lillesand_admin_pin` | sessionStorage | Admin-PIN |
| `lillesand_current_tab` | sessionStorage | Gjenopprett fane |

State-polling bruker **ETag** (`updatedAt`) → `304 Not Modified` når uendret.

## Autentisering

Ingen JWT eller sesjon. To PIN-nivåer:

| PIN | Header / body | Bruk |
| --- | --- | --- |
| Admin | `x-admin-pin`, `?adminPin=`, `body.adminPin` | Arrangør-API |
| Reset | `x-reset-pin`, `body.resetPin` | Kun `/api/admin/reset-all` |

PIN-verifisering (`/api/admin/verify-pin`) har rate limiting: 5 feil → 60 s lockout per IP.

Deltakere identifiseres med `Person.id` + `anonymousToken` (localStorage). Noen endepunkter krever token-match (f.eks. trekk fra cup).

## Sanntid

Ingen WebSocket. Synk via polling:

- **4 s** når fanen er synlig
- **60 s** i bakgrunnen
- Ekstra poll ved `visibilitychange` / fokus

Web push supplerer for turneringskø (to kamper unna, klar på bord, spiller nå).

## Web Push

```
Klient (webpush-client.ts) → GET /api/push/vapid-public-key
                          → registrer public/sw.js
                          → POST /api/push/subscribe

Server → dispatchPushToPerson ved match-score / bordtildeling
       → web-push (VAPID) → service worker → showNotification
```

Emner: `tournament` (24 t), `alphaCourse` (90 dager).

## Firebase på klient

`src/lib/firebase.ts` initialiserer Firestore for **tilkoblingstest** ved oppstart (`main.tsx`). Mutasjoner går via Express API, ikke direkte Firestore fra frontend.

## Gemini

`@google/genai` er i `package.json`, men **ingen kode kaller Gemini**. `GEMINI_API_KEY` i `.env.example` er forberedt infrastruktur.

## Bygg og deploy

| Kommando | Resultat |
| --- | --- |
| `npm run dev` | `tsx server.ts` + Vite HMR |
| `npm run build` | `vite build` + `esbuild` → `dist/server.cjs` |
| `npm start` | `node dist/server.cjs` |

Vite ignorerer `data/**` i file watching (unngår reload ved API-skriving).
