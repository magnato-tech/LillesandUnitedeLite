# Lillesand United (elite / minimumsversjon)

Webapp for Lillesand United-ungdomskveld: aktiviteter, bordtenniscup, kampoversikt og påmelding til UngdomsAlpha.

Kildekoden er hentet fra [magnato-tech/LillesandUnitedeLite](https://github.com/magnato-tech/LillesandUnitedeLite).

## Krav

- Node.js 22+ (eller Bun)
- Valgfritt: Firebase/Firestore og Gemini API-nøkkel (appen har lokal `data/db.json`-fallback)

## Kom i gang

```bash
cp .env.example .env
npm install
npm run dev
```

Åpne `http://localhost:3000`. Port kan overstyres med `PORT`, for eksempel `PORT=43123 npm run dev`.

Admin-PIN og reset-PIN står i `.env.example` (`ADMIN_PIN`, `RESET_PIN`). Ikke commit `.env`.

## Skript

| Kommando | Beskrivelse |
| --- | --- |
| `npm run dev` | Utviklingsserver (Express + Vite) |
| `npm run build` | Bygg frontend og server |
| `npm start` | Kjør produksjonsbygg |
| `npm run lint` | TypeScript-sjekk |
| `npm run test:all` | Kjør testharnesen |

## Prosjektdokumentasjon

Full indeks over kodebasen: **[docs/prosjekt/](./docs/prosjekt/README.md)**

| Dokument | Innhold |
| --- | --- |
| [Oversikt](./docs/prosjekt/README.md) | Mappestruktur, roller, funksjonsområder |
| [Arkitektur](./docs/prosjekt/arkitektur.md) | Lag, persistens, auth, push |
| [Datamodell](./docs/prosjekt/datamodell.md) | AppState og entiteter |
| [API](./docs/prosjekt/api.md) | Alle REST-endepunkter |
| [Frontend](./docs/prosjekt/frontend.md) | Komponenter og navigasjon |
| [Tester](./docs/prosjekt/tester.md) | Testskript og dekning |

## Mer dokumentasjon

- `PRODUCT_REQUIREMENTS.md` — produktkrav og arkitektur
- `security_spec.md` — sikkerhetsspesifikasjon
- `firestore.rules` — Firestore-regler
