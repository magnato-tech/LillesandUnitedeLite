# Testprosedyre: Vanlig navn vs. PIN-kobling

## Formål

Verifisere at:

- **Vanlig navneinntasting** alltid oppretter en **ny** Person
- **PIN-symbolet** er den eneste veien til en **eksisterende** Person
- Appen **ikke** forsøker å gjenkjenne eller koble brukere via fornavn

---

## Forutsetninger

| Krav | Detalj |
|------|--------|
| Server | `npm run dev` på `http://localhost:3000` |
| Admin-PIN | Standard: `United2026` (sjekk `.env`) |
| Reset-PIN | Standard: `ResetUnited2026` |
| Testmiljø | To nettlesere eller én nettleser + inkognito (for «vanlig bruker») |
| Admin-tilgang | Gå til Admin-fanen og logg inn med admin-PIN |

**Tips:** Start med ren testdata via Admin → reset, eller kjør automatisk reset før API-test (se under).

---

## Del 1 — Automatiske tester (kjør først)

### 1.1 Lint

```bash
npm run lint
```

**Forventet:** Exit 0, ingen TypeScript-feil.

### 1.2 Duplikatnavn (API)

```bash
npm run test:duplicate-names
```

**Forventet:**

- `Oliver` + `Oliver` gir `Oliver_1` og `Oliver_2`
- Separate personer isoleres korrekt (popcorn-bong)
- Ambiguous navn uten `personId` avvises

**Merk:** Testen resetter all data via `/api/admin/reset-all`.

---

## Del 2 — Manuell UI-test (hovedscenarier)

Bruk testnavnet **«Per»** gjennom hele prosedyren.

### Test A — Admin oppretter person (forutsetning for PIN-scenario)

| Steg | Handling | Forventet resultat |
|------|----------|-------------------|
| A1 | Åpne Admin → Deltakere | Admin-panel vises |
| A2 | Opprett ny person med fornavn **Per** | Person opprettes, f.eks. `Per_1` |
| A3 | Noter `displayId` og at personen finnes i listen | Admin-opprettet Per er synlig |

---

### Test B — Vanlig bruker skriver samme navn (må opprette NY person)

| Steg | Handling | Forventet resultat |
|------|----------|-------------------|
| B1 | Åpne app i **ny/inkognito** sesjon (ingen aktiv bruker) | Velkomstskjerm vises |
| B2 | Skriv **Per** og trykk Fortsett | Ny Person opprettes |
| B3 | Gå til **Min side** | Viser ny profil, f.eks. `Per_2` (neste ledige nummer) |
| B4 | Sammenlign med admin-Per i Admin → Deltakere | **To separate** personer (`Per_1` og `Per_2`) |
| B5 | Sjekk at vanlig bruker **ikke** har admin-Pers påmeldinger/aktiviteter | Ingen krysskobling |

**Feil hvis:** Vanlig bruker kobles til admin-opprettet `Per_1` (samme `personId`, samme aktiviteter).

---

### Test C — PIN kobler til eksisterende person (må IKKE opprette ny)

| Steg | Handling | Forventet resultat |
|------|----------|-------------------|
| C1 | I Admin: åpne admin-opprettet **Per** → generer PIN | 6-sifret kode vises |
| C2 | Ny/inkognito sesjon → trykk **nøkkelikonet** (PIN) | PIN-modal åpnes |
| C3 | Skriv inn PIN-koden | Profil kobles |
| C4 | Gå til **Min side** | Viser admin-opprettet Per (`Per_1`) |
| C5 | Sjekk Admin → Deltakere | **Ingen** ny `Per_3` opprettet |
| C6 | Sammenlign `personId` med admin-Per | **Samme** ID |

**Feil hvis:** Ny Person opprettes ved PIN-claim, eller feil profil åpnes.

---

### Test D — Flere vanlige registreringer med samme navn

| Steg | Handling | Forventet resultat |
|------|----------|-------------------|
| D1 | Sesjon 1: skriv **Per** → Fortsett | F.eks. `Per_1` |
| D2 | Sesjon 2 (ny/inkognito): skriv **Per** → Fortsett | F.eks. `Per_2` |
| D3 | Sesjon 3: skriv **Per** → Fortsett | F.eks. `Per_3` |
| D4 | Admin → Deltakere | Tre (eller flere) separate Per-profiler |

**Feil hvis:** Senere registrering kobler til tidligere Per i stedet for å opprette ny.

---

### Test E — Session etter refresh (ingen navnegjetting)

| Steg | Handling | Forventet resultat |
|------|----------|-------------------|
| E1 | Fullfør Test C (PIN-koblet til `Per_1`) | Aktiv session |
| E2 | Last siden på nytt (F5) | Samme profil (`Per_1`) |
| E3 | Opprett en **ny** Person `Per` i annen sesjon (`Per_2`) | OK |
| E4 | Gå tilbake til PIN-sesjonen og refresh | Fortsatt `Per_1`, **ikke** `Per_2` |

**Feil hvis:** Refresh bytter profil fordi det finnes flere med samme fornavn.

---

### Test F — Bordtennis-påmelding uten aktiv profil

| Steg | Handling | Forventet resultat |
|------|----------|-------------------|
| F1 | Ny sesjon, **ikke** skriv navn på velkomstskjermen | Ingen aktiv bruker |
| F2 | Gå til Bordtennis → skriv **Per** og meld på | Ny Person + påmelding |
| F3 | Sjekk Admin → Deltakere | Ny Per opprettet, **ikke** koblet til eksisterende Per |

**Feil hvis:** Påmelding kobles til eksisterende Per uten PIN.

---

## Del 3 — Regresjonssjekk (kjapp)

| Sjekk | Forventet |
|-------|-----------|
| PIN-modal fungerer (feilmelding ved ugyldig kode) | Ja |
| Admin kan opprette/slette deltakere | Uendret |
| «Logg ut» / «Bytt navn» / «Bytt spiller» synlig for vanlig bruker | **Nei** |
| Mario Kart-påmelding uten profil | Oppretter ny Person (som før) |

---

## Del 4 — Pass / fail

### Bestått når alle disse er OK:

1. `npm run lint` — grønn
2. `npm run test:duplicate-names` — grønn
3. Test B — vanlig «Per» oppretter ny person, kobler ikke til admin-Per
4. Test C — PIN åpner eksisterende Per, ingen ny Person
5. Test D — flere «Per» gir separate `Per_1`, `Per_2`, `Per_3` …
6. Test E — refresh beholder riktig profil ved duplikatnavn

### Stopp og feilrapport hvis:

- Vanlig navneinntasting kobler til eksisterende Person
- PIN-claim oppretter ny Person
- Refresh/bytte sesjon gir feil profil ved samme fornavn

---

## Anbefalt testrekkefølge før arrangement

```
1. npm run lint
2. npm run test:duplicate-names
3. Test A → B → C (kjernescenario)
4. Test D + E (duplikater + session)
5. Test F (bordtennis-sti)
```

Estimert tid: **15–20 min** manuelt + **2 min** automatisk.

---

## Testrapport (mal)

| Test | Resultat (OK/Feil) | Kommentar |
|------|-------------------|-----------|
| Lint | | |
| test:duplicate-names | | |
| A — Admin oppretter Per | | |
| B — Vanlig navn = ny Person | | |
| C — PIN = eksisterende Person | | |
| D — Flere Per | | |
| E — Session refresh | | |
| F — Bordtennis uten profil | | |
