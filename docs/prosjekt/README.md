# Lillesand United — prosjektdokumentasjon

Indeks over kodebasen i [magnato-tech/LillesandUnitedeLite](https://github.com/magnato-tech/LillesandUnitedeLite).

## Hva er dette?

Webapp for Lillesand United-ungdomskveld: aktiviteter, bordtenniscup, kiosk, popcorn-bong, påmelding til UngdomsAlpha og arrangørpanel.

| Egenskap | Verdi |
| --- | --- |
| Stack | React 19, TypeScript, Vite 6, Tailwind 4, Express |
| Persistens | `data/db.json` (lokal) + valgfri Firestore-synk |
| Auth | Anonym `Person` i localStorage; admin via PIN |
| Kilde | `server.ts` (API), `src/` (frontend), `src/lib/tournament.ts` (cup-logikk) |

## Dokumentasjon

| Dokument | Innhold |
| --- | --- |
| [Arkitektur](./arkitektur.md) | Lag, oppstart, persistens, Firebase, web push |
| [Datamodell](./datamodell.md) | `AppState`, entiteter, konsistensregler |
| [API](./api.md) | Alle REST-endepunkter og autentisering |
| [Frontend](./frontend.md) | Komponenter, navigasjon, klient-til-server |
| [Tester](./tester.md) | Testskript og hva de dekker |

## Mappestruktur

```
/workspace
├── server.ts              # Express API + Vite (dev) / statisk (prod)
├── data/
│   ├── db.json            # Lokal persistens (full AppState)
│   └── vapid.json         # Web Push VAPID-nøkler (genereres ved behov)
├── src/
│   ├── App.tsx            # Rot: faner, polling, global state
│   ├── components/        # UI-komponenter (17 stk)
│   ├── hooks/             # useTournamentSimulator
│   ├── lib/               # Turnering, initial-data, push, Firebase
│   ├── services/api.ts    # Typed fetch-wrapper mot /api/*
│   └── types.ts           # Delte TypeScript-typer
├── scripts/               # Integrasjons- og enhetstester
├── public/                # manifest, service worker (sw.js)
├── firestore.rules        # Firestore-sikkerhetsregler
├── firebase-applet-config.json
├── PRODUCT_REQUIREMENTS.md
└── security_spec.md
```

## Kjerneflyt

```
Browser (React SPA)
    │  fetch /api/*  (polling hvert 4. sek)
    ▼
Express (server.ts)
    │  in-memory AppState
    ├──► data/db.json          (synkron skriving)
    └──► Firestore appState/current  (debounced 50 ms, valgfritt)
```

## Brukerroller

| Rolle | Identifikasjon | Tilgang |
| --- | --- | --- |
| Gjest / deltaker | `Person` (fornavn + `anonymousToken` i localStorage) | Påmelding, popcorn, Alpha, egen profil |
| Arrangør / dommer | Admin-PIN (`x-admin-pin`) | Turneringsstyring, kiosk, resets, Firestore-sync |
| Destruktiv reset | Reset-PIN (kun `/api/admin/reset-all`) | Full wipe av all data |

## Funksjonsområder

| Område | Status | Hovedfiler |
| --- | --- | --- |
| Bordtenniscup | Aktiv | `tournament.ts`, `TableTennisView`, `TableTennisAdminPanel` |
| Aktiviteter / program | Aktiv | `ActivityGrid`, `initial-data.ts` |
| UngdomsAlpha | Aktiv | `AlphaView` |
| Kiosk / Vipps | Informativ meny (ingen handlekurv i appen) | `KioskSection`, `KioskAdminPanel` |
| Popcorn-bong | Deaktivert for pilot | `PopcornBongCard`, `/api/popcorn/*` |
| Storskjerm | Aktiv | `DisplayScreen` |
| Web push | Aktiv | `webpush-client.ts`, `public/sw.js` |
| Gemini AI | Ikke implementert | Avhengighet finnes, ingen kode |

## Kom i gang

```bash
cp .env.example .env
npm install
npm run dev
```

Se [README.md](../../README.md) i rot for miljøvariabler og skript.

## Relaterte dokumenter

- `PRODUCT_REQUIREMENTS.md` — produktkrav og scope (inkl. popcorn-avvik)
- `security_spec.md` — sikkerhetsspesifikasjon
- `firestore.rules` / `DRAFT_firestore.rules` — Firestore-regler
