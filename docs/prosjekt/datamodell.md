# Datamodell

Alle data samles i én `AppState`-struktur (`src/types.ts`), persistert i `data/db.json` og synket til Firestore.

## AppState

```typescript
interface AppState {
  event: {
    name: string;
    date: string;
    time: string;
    location: string;
    organizers: string[];
    freePopcornLimit: number;
    popcornClaimedCount: number;
  };
  popcorn: PopcornData;
  kioskItems?: KioskItem[];
  kioskSettings?: KioskSettings;
  activities: Activity[];
  tournament: Tournament;
  alphaInterests: AlphaInterest[];
  persons: Person[];
  updatedAt?: string;  // ETag for polling
}
```

## Entiteter

### Person (sentral identitet)

| Felt | Beskrivelse |
| --- | --- |
| `id` | UUID |
| `firstName` | Fornavn |
| `nameNumber` | Løpenummer per fornavn (1, 2, 3 …) |
| `displayId` | Visnings-ID, f.eks. `Oliver_2` |
| `anonymousToken` | Hemmelig token for egen-tilgang |
| `isSimulated` | Simulert testperson |

Alle gjester opprettes anonymt via `POST /api/persons`. Ingen innlogging.

### Participant (cup-påmelding)

Kobler `Person` til turneringen. Egen `id`, `personId`, `displayId`, `firstName`, `registeredAt`.

### Tournament

| Felt | Beskrivelse |
| --- | --- |
| `status` | `registration` \| `active` \| `completed` |
| `participants` | Påmeldte spillere |
| `matches` | Alle bracket-kamper |
| `winner` | Vinner (når `completed`) |
| `bracketCapacity` | 4, 8, 16, 32 eller 64 |
| `formatSettings` | Poeng/sets per runde (`regular`, `semifinal`, `final`) |

### Match

| Felt | Beskrivelse |
| --- | --- |
| `round`, `roundName`, `stage` | Plassering i bracket |
| `playerA`, `playerB` | Deltaker-IDer |
| `scoreA`, `scoreB`, `sets` | Resultat |
| `tableNumber` | 1 eller 2 (fysiske bord) |
| `status` | `not_ready` \| `ready` \| `in_progress` \| `completed` \| `walkover` |
| `nextMatchId`, `nextMatchSlot` | Kobling til neste runde (`A`/`B`) |

### PopcornData

100 digitale bonger (`PopcornBong`):

- `status`: `blank` → `activated` → `used`
- Én bong per `personId`
- `popcornClaimedCount` må matche antall aktiverte/brukt

**Pilot:** Funksjonen er deaktivert i produksjon, men datamodellen og API finnes.

### AlphaInterest

Påmelding til UngdomsAlpha: `firstName`, `phone?`, `notes?`, `personId?`, `registeredAt`.

### Activity

Programkort for kvelden: navn, beskrivelse, tid, sted, `enabled`, ikon.

### KioskItem / KioskSettings

Menyvarer (pris, kategori, Vipps) og Vipps-konfig (`vippsNumber`, `vippsName`, `vippsUrl`).

## Seeds

| Konstant | Fil | Innhold |
| --- | --- | --- |
| `INITIAL_STATE` | `src/lib/initial-data.ts` | Demo-state med 6 aktiviteter, 8 spillere, kiosk, 100 bonger |
| `createEmptyAppState()` | Samme fil | Tom runtime-state (beholder event/aktiviteter/kiosk-config) |

## Konsistens (`src/lib/state-consistency.ts`)

`validateAppState()` sjekker:

- Unike `person.id`, `anonymousToken`, `displayId`
- Sekvensielle `nameNumber` per fornavn
- Popcorn: én bong per person, teller stemmer
- Deltakere ≤ `bracketCapacity`, gyldige person-referanser
- Match-graf: `nextMatchId`-kjeder, vinner-propagering, ingen dobbelt på bord
- `tournament.winner` matcher finalekamp

Kjøres av testskript og `validate-db.ts`.

## Turneringslogikk (kort)

Implementert i `src/lib/tournament.ts`, delt mellom server og klient:

| Funksjon | Formål |
| --- | --- |
| `generateBracket` | Single elimination, Fisher-Yates, walkovers ved færre spillere |
| `recordMatchResult` | Registrer score, flytt vinner videre |
| `autoAssignTables` | Tildel Bord 1/2 til klare kamper |
| `invalidateDependencies` | Korriger resultat med nedstrøms-effekt |
| `resolveDrawCapacity` | Minimer unødvendige walkovers |
| `calculateServer` | Serve-visning (5 server, deuce-regler) |

Kapasitet: `TOURNAMENT_DEFAULT_CAPACITY = 16`, maks 64.
