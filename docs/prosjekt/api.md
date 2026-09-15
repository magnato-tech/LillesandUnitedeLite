# API-referanse

Base-URL: `/api` (samme origin som frontend).

## Autentisering

| Type | Hvordan | Miljøvariabel | Standard |
| --- | --- | --- | --- |
| Admin-PIN | `x-admin-pin` header, `?adminPin=`, eller `body.adminPin` | `ADMIN_PIN` | `United2026` |
| Reset-PIN | `x-reset-pin` eller `body.resetPin` | `RESET_PIN` | `ResetUnited2026` |
| Bruker-token | `body.anonymousToken` må matche `Person` | — | — |

Klienten (`src/services/api.ts`) lagrer admin-PIN i `sessionStorage` og sender `x-admin-pin` automatisk.

---

## Helse og state

| Metode | Sti | Auth | Beskrivelse |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Liveness (`status`, `time`) |
| GET | `/api/state` | — | Full `AppState`; støtter ETag / `If-None-Match` → 304 |
| GET | `/api/firestore/status` | — | Firestore-tilkobling og sist sync |

---

## Admin PIN

| Metode | Sti | Auth | Beskrivelse |
| --- | --- | --- | --- |
| POST | `/api/admin/verify-pin` | — | Valider admin-PIN (rate-limited) |
| POST | `/api/admin/verify-reset-pin` | — | Valider reset-PIN (rate-limited) |

---

## Firestore

| Metode | Sti | Auth | Beskrivelse |
| --- | --- | --- | --- |
| POST | `/api/firestore/flush` | Admin | Tving umiddelbar Firestore-skriving |
| POST | `/api/admin/firestore/sync` | Admin | Full sync til alle collections |

---

## Personer

| Metode | Sti | Auth | Beskrivelse |
| --- | --- | --- | --- |
| POST | `/api/persons` | — | Opprett anonym person |
| GET | `/api/persons` | — | List alle |
| GET | `/api/persons/:id` | — | Hent én |
| PATCH | `/api/persons/:id` | Admin | Endre navn (propagerer) |
| DELETE | `/api/persons/:id` | Admin | Slett person |

---

## Turneringsregistrering

| Metode | Sti | Auth | Beskrivelse |
| --- | --- | --- | --- |
| POST | `/api/register` | — | Meld på cup (`personId`) |
| DELETE | `/api/participants/:id` | Admin | Fjern deltaker |
| POST | `/api/tournament/withdraw` | Token eller Admin | Trekk fra cup |
| POST | `/api/user/rename` | — | Endre navn (legacy) |
| GET | `/api/user/status` | — | Samlet status (cup, popcorn, Alpha) |

---

## Turneringsstyring (admin)

| Metode | Sti | Beskrivelse |
| --- | --- | --- |
| POST | `/api/tournament/start` | Tegn bracket, sett `active` |
| POST | `/api/tournament/re-draw` | Ny trekning, samme spillere |
| PATCH | `/api/tournament/format` | Poeng/sets-innstillinger |
| PATCH | `/api/tournament/capacity` | Sett bracket-størrelse (8/16/32/64) |
| POST | `/api/tournament/match/score` | Registrer resultat (+ push) |
| POST | `/api/tournament/match/correct` | Korriger resultat (409 uten `confirmCorrection`) |
| POST | `/api/tournament/match/reset` | Nullstill kamp (409 uten `confirmReset`) |
| POST | `/api/tournament/match/assign-table` | Tildel bord (+ push) |
| POST | `/api/tournament/reset` | Nullstill cup (`securedReset` + reset-PIN) |
| POST | `/api/tournament/simulate` | Fyll med simulerte spillere og start |

---

## Alpha

| Metode | Sti | Auth | Beskrivelse |
| --- | --- | --- | --- |
| POST | `/api/alpha/interest` | — | Registrer interesse |
| POST | `/api/alpha/reset` | Admin | Tøm alle Alpha-påmeldinger |

---

## Popcorn (deaktivert for pilot)

| Metode | Sti | Auth | Beskrivelse |
| --- | --- | --- | --- |
| POST | `/api/popcorn/activate` | — | Aktiver bong |
| GET | `/api/popcorn/my-bong` | — | Hent egen bong |
| POST | `/api/popcorn/redeem` | Admin | Marker som brukt |
| POST | `/api/popcorn/add-capacity` | Admin | Legg til bonger (+10) |
| POST | `/api/popcorn/reset` | Admin | Nullstill til 100 blanke |

---

## Kiosk

| Metode | Sti | Auth | Beskrivelse |
| --- | --- | --- | --- |
| POST | `/api/kiosk/settings` | Admin | Lagre Vipps-innstillinger |
| POST | `/api/kiosk/items` | Admin | Legg til vare |
| PUT | `/api/kiosk/items/:id` | Admin | Oppdater vare |
| DELETE | `/api/kiosk/items/:id` | Admin | Slett vare |
| POST | `/api/kiosk/items/:id/toggle` | Admin | Slå av/på vare |

---

## Event og aktiviteter

| Metode | Sti | Auth | Beskrivelse |
| --- | --- | --- | --- |
| POST | `/api/activity/toggle` | Admin | Slå av/på aktivitet |
| PATCH | `/api/event` | Admin | Oppdater arrangement-metadata |
| PATCH | `/api/activities/:id` | Admin | Oppdater aktivitetsinnhold |

---

## Admin resets

| Metode | Sti | Auth | Beskrivelse |
| --- | --- | --- | --- |
| POST | `/api/admin/reset-testdata` | Admin | Nullstill cup/popcorn/Alpha/simulerte personer |
| POST | `/api/admin/reset-all` | Admin + Reset-PIN | Full wipe + Firestore-tømming |

---

## Web Push

| Metode | Sti | Auth | Beskrivelse |
| --- | --- | --- | --- |
| GET | `/api/push/vapid-public-key` | — | VAPID public key |
| POST | `/api/push/subscribe` | — | Lagre abonnement (`personId` påkrevd) |
| POST | `/api/push/test` | — | Send test-push |

---

## SEO / statisk

| Metode | Sti | Beskrivelse |
| --- | --- | --- |
| GET | `/robots.txt` | Robots med sitemap-lenke |
| GET | `/sitemap.xml` | Enkeltside-sitemap |
| GET | `*` (prod) | SPA fallback → `dist/index.html` |
