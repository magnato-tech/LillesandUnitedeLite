# Frontend

React SPA uten React Router. Navigasjon skjer via `currentTab` state i `App.tsx`.

## Faner (`AppTab`)

| Fane | Komponent | Beskrivelse |
| --- | --- | --- |
| `home` | WelcomeBanner, EventHero, ActivityGrid, ScheduleSection | Forside |
| `profile` | MyProfileView | Min side |
| `tabletennis` | TableTennisView | Cup, kø, bracket, push |
| `alpha` | AlphaView | UngdomsAlpha-info og påmelding |
| `kiosk` | KioskSection | Meny og Vipps-handlekurv |
| `display` | DisplayScreen | Storskjerm (fullskjerm, egen layout) |
| `admin` | AdminDashboard | Arrangørpanel (PIN) |

Fane lagres i `sessionStorage['lillesand_current_tab']`.

### Navigasjon

| Overflate | Faner |
| --- | --- |
| Header (desktop) | home, profile, tabletennis, alpha, kiosk, admin |
| MobileBottomNav | home, profile, tabletennis, alpha, kiosk |
| ActivityGrid | Hopper til tabletennis, alpha eller kiosk |

`display` åpnes fra admin («Åpne Storskjerm») og har ingen header/footer.

## Komponenttre

```
App.tsx
├── InAppNotificationBanner     # Turneringsvarsler
├── Header                      # Logo, faner, admin-ikon
├── [fanevisning]
│   ├── WelcomeBanner           # Førstegangs onboarding
│   ├── EventHero               # Hero + PopcornBongCard
│   ├── ActivityGrid            # Aktivitetskort
│   ├── ScheduleSection         # Statisk kveldsprogram
│   ├── MyProfileView           # Profil, trekk, påmelding
│   ├── TableTennisView         # Cup-UX
│   │   └── BracketView         # Bracket-visualisering
│   ├── AlphaView               # Alpha-påmelding
│   ├── KioskSection            # Kiosk + PopcornBongCard
│   ├── DisplayScreen           # Storskjerm
│   │   └── BracketView
│   └── AdminDashboard          # 8 admin-underfaner
│       ├── KioskAdminPanel
│       ├── TableTennisAdminPanel
│       └── BracketView
├── footer
└── MobileBottomNav
```

## Admin-underfaner (`AdminDashboard`)

| Fane | Innhold |
| --- | --- |
| `event_participants` | Alle registrerte personer |
| `tabletennis_participants` | Cup-deltakere |
| `matches` | Kampstyring, scoring, bord |
| `activities` | Rediger event/aktiviteter |
| `kiosk` | KioskAdminPanel |
| `kiosk_popcorn` | Bong-grid, innløsning |
| `alpha` | Alpha-liste |
| `test` | Simulering, reset, Firestore-verktøy |

Standard admin-fane: `kiosk_popcorn`. Fra cup settes `matches`.

## Lib-moduler (`src/lib/`)

| Fil | Rolle |
| --- | --- |
| `initial-data.ts` | `INITIAL_STATE`, standardaktiviteter, popcorn, sim-navn |
| `userProfile.ts` | localStorage-sesjon for aktiv Person |
| `tournament.ts` | Bracket, scoring, bord (delt med server) |
| `tournament-notifications.ts` | Køstatus, in-app-varsler, lyd/vibrasjon |
| `tournament-simulator.ts` | Tilfeldige kampresultater (admin-preview) |
| `state-consistency.ts` | Validering av AppState |
| `webpush-client.ts` | Service worker, VAPID, abonnement |
| `firebase.ts` | Klient-Firestore (tilkoblingstest) |

## Hooks

| Hook | Rolle |
| --- | --- |
| `useTournamentSimulator` | Lokal bracket-simulering uten API (admin) |

## State-flyt i App.tsx

1. Start med `INITIAL_STATE`
2. `fetchState()` ved oppstart og polling (4 s / 60 s)
3. `effectiveActivePerson` fra `state.persons` + localStorage
4. Turneringskø-watcher → in-app banner + browser push
5. Mutasjoner → API → `setState(data.state)` fra respons

## Klient ↔ server

All data går via `src/services/api.ts`:

- `GET /api/state` med ETag (304 = ingen re-render)
- Admin-kall sender `x-admin-pin`
- Offline: fallback til `localStorage['lillesand_state_cache']`

Firebase på klienten brukes **kun** til `testConnection()` i `main.tsx`, ikke til appdata.

## Service Worker (`public/sw.js`)

- Håndterer `push` → `showNotification`
- `notificationclick` → fokuser app / naviger til fane
