## 2026-10-02 — v0.12.0: Installer som app

Pendlerkalkulator kan nå installeres som app (PWA). Siste steg i veiviseren har en avkrysning «Installer som app» som må huskes før den store knappen trykkes; på iOS vises en veiledning om Del → «Legg til på Hjem-skjerm». Valget ligger også nederst i innstillingene, og skjules når appen allerede er installert. Ny manifest, ikoner og service worker som lagrer appskallet for rask oppstart og oppstart uten dekning.

---

## 2026-10-02 — v0.11.4: Årskort uten klokkeskifte-varsel

Varselet om overgang til sommer- og vintertid vises ikke lenger for årskort, som gjelder i hele dager. Steder som sa «365 dager» sier nå «365 dager (årskort)». Hjemmekontor-setningen i veiviseren er fjernet. Statusen på «Neste tog» (i rute, forsinket, innstilt) vises som en farget pille. «Neste tog» bytter til hjemreisen ved klokka 12, også om appen står åpen.

---

## 2026-10-02 — v0.11.3: Infotekst om ny billett som sammenleggbar blokk

Infoteksten om når den nye billetten starter ligger nå i en lukket details-blokk, og nevner at valgte arbeidsdager tas med i beregningen. Tidsfeltene (og datofeltene) står i to kolonner, men stables på to linjer når tekstzoom gjør dem for trange.

---

## 2026-10-02 — v0.11.2: Fjernet hjemmekontor-teksten

Setningen «Resten regnes som hjemmekontor.» under «Dager på jobb i uka» er fjernet.

---

## 2026-10-02 — v0.11.1: Strekning i headeren

Valgt strekning, for eksempel «Gulskogen – Oslo S», står nå under appnavnet i headeren. I «Neste tog» ligger tittelen på egen linje over linje, avgangstid og status, så teksten ikke kuttes.

---

## 2026-10-02 — v0.11.0: Neste tog som sammenleggbart kort

Veiviseren sveipes nå riktig vei: mot venstre (fra høyre) er neste steg, mot høyre er tilbake. «Reiser til Oslo S fra» er flyttet inn i Innstillinger (og bytte av stasjon oppdaterer reisetid og avreise). «Neste tog» står øverst og er minimert som standard; overskriften viser linje, avgangstid og status, for eksempel «R12 07:12 i rute», med annen farge ved forsinkelse eller innstilling, og en oppdaterknapp med bare ikon. Retningsvalg og de neste togene åpnes med et trykk på overskriften.

---

## 2026-10-02 — v0.10.1: Finpuss av veiviseren

Tilbake og Neste er nå piler uten tekst (og passer i boksen på smale skjermer). Avreisetid har egen overskrift med «Fra <stasjon>» og «Fra Oslo S». Steget om eksisterende billett forklarer at ny billett starter ved neste arbeidsreise, ikke rett etter utløp. Beløpsfelt har prefikset «kr» og tusenskille i veiviseren og i menyen. Veiviseren fyller skjermen med lik høyde i alle steg, og resten av siden skjules til den er ferdig. Avreisetidene regnes ut fra kjernetid når veiviseren åpnes.

---

## 2026-10-02 — v0.10.0: Kjernetid, reisetid og påske/romjul i veiviseren

Veiviseren har fått to nye steg. «Når må du være på jobb?» spør etter kjernetid (standard 09–15) og kjenner omtrentlig reisetid fra valgt stasjon (Gulskogen ca. 40 min, Drammen ca. 35, Lier ca. 30; Brakerøya og Asker er anslag). Avreise om morgenen regnes ut fra kjernetidens start minus reisetid, rundet ned til 5 minutter, og avreise hjem er kjernetidens slutt; begge kan finjusteres. «Påske og romjul» spør om du jobber i påskeuka mandag–onsdag og i romjul. Veiviseren har nå 8 steg. Logikken ligger i `src/lib/kjernetid.js` med tester.

---

## 2026-10-02 — v0.9.0: Førstegangsveiviser

Første besøk starter en veiviser med sju steg: fra-stasjon, jobbdager, reisetider, eksisterende periodebillett (med utløpsdato, klokkeslett og type), ferie (registrer eller importer), prissjekk og en stor «Sett i gang»-knapp. Sveip høyre for neste og venstre for tilbake; prikker nederst og «Steg N av 7» i toppen. Resten av siden og menyen er utilgjengelig til veiviseren er ferdig. Innstillinger: én periodevelger (fra og til) i en egen kalender, «Fri og ferie» øverst og «Utseende» nederst, skriftstørrelsen settes når du slipper slideren, og Nullstill spør «Er du sikker?» og sier at ferie og andre registrerte opplysninger fjernes. Enkeltprisene til Oslo S er oppdatert (Gulskogen 156, Drammen 151, Brakerøya 143, Lier 132, Asker 75). Eksisterende periodebillett starter beregningen ved utløp. Teksten om at priser oppdateres jevnlig er bare tekst; det finnes ingen automatisk prishenting.

---

## 2026-10-02 — v0.8.0: Live avganger og helligdagsjekk

Nytt kort «Neste tog» under stasjonsvalget: de neste fire togene mellom valgt stasjon og Oslo S fra Entur Journey Planner, med klokkeslett, linje, bytter og forsinkelse eller innstilling i tekst. Retning velges med to knapper (til Oslo S før kl. 12, ellers fra). Stasjons-id slås opp via Enturs geocoder og huskes i nettleseren; kortet oppdaterer seg hvert minutt mens siden er synlig, og feiler stille med en vennlig melding. Logikken ligger i `src/lib/entur.js` med tester mot fiksturer (Entur er utilgjengelig herfra, så live-oppførsel er ikke prøvd). Ny `scripts/sjekk-helligdager.mjs` sammenlikner våre utregnede helligdager med date.nager.at, kjørt månedlig og på forespørsel i workflowen «Helligdagsjekk».

---

## 2026-10-02 — v0.7.0: Ruter Reis

Ny bryter i menyen: «Ruter Reis på enkeltbilletter». Reglene (5 % fra reise nr. 5, opp til 40 % fra reise nr. 40 de siste 30 dagene) ligger i `src/lib/reis.js` som en tabell og en ren funksjon med tester, så de kan endres uten å røre resten. Optimeringen prøver planer med ulike forutsatte rabattnivåer og priser hver plan eksakt med glidende 30-dagersvindu; bare enkeltbilletter teller og får rabatt, periodebilletter berøres ikke. Hovedtallet viser hva Reis sparer. Den flate rabattprosenten per strekning fra v0.6.0 er erstattet av dette. Vy Smartpris er en egen ordning og er ikke med. Reglene er lagt inn slik de ble oppgitt og er ikke sjekket mot Ruters og Vys sider (utilgjengelige herfra).

---

## 2026-10-02 — v0.6.0: Nytt grensesnitt i Lendes uttrykk

Forsiden er redusert til tre valg: stasjon, periode og «dager på jobb i uka». Sliderne og dagene regner resten som hjemmekontor og tar det med i beregningen. Resultatet vises som hovedtall, søylegraf mot enklere alternativer (differansen i varselfarge), en billett-tidslinje med detaljer ved trykk, og en graf over hva hjemmekontor er verdt. Sjelden brukte valg ligger i en meny øverst til venstre (tannhjul): tema, tekststørrelse, ferie og .ics, reisetider, priser og årskort. Egendefinerte strekninger og perioder er fjernet. Strekningene har et felt for rabatt på enkeltbilletter (`reisRabattProsent`) som forberedelse til Vy Reis og Ruter. MCP-verktøyet støtter `jobbUkedager` og `reisRabattProsent`. Lagret tilstand nullstilles ved oppdatering.

---

## 2026-10-02 — v0.5.0: MCP-server

`npm run mcp` starter en MCP-server (stdio) som er en tynn pakke rundt den rene logikken i `src/lib`: `beregn_billetter` (billigste billettkjede med alternativer og årskort-vurdering), `hent_forslag` (Vys priser), `helligdager` og `les_ics`. Verktøyene ligger i `mcp/verktoy.js` og er testet uten transport; SDK og zod er dev-avhengigheter og havner ikke i nettleserbunten.

---

## 2026-10-02 — v0.4.0: Ferie fra kalenderfil og strekningsforslag

Ferie kan importeres fra en .ics-fil (Outlook, Google, Apple): heldagshendelser er forhåndsvalgt, tidsfestede kan krysses av, og overlappende dager slås sammen. Hver strekning har en «Fyll inn fra forslag»-liste med Vys voksenpriser 2. oktober 2026 for Gulskogen, Drammen, Brakerøya, Lier og Asker (til Oslo S); enkeltpris er bare med der den er lest av.

---

## 2026-10-02 — v0.3.0: Brukergrensesnitt og innstillinger

Første brukbare utgave. Resultatet står øverst: billigste kostnad, billettene som tidslinje med aktivering, utløp og «vær på toget»-merking, sommertid-varsel, årskort-vurdering og dyrere alternativer. Under ligger skjemaene for strekninger med egne priser (også bil-strekninger og bildager), periode og avgangstider, innstillingene «jobber i påske mandag–onsdag» og «jobber i romjul» (begge PÅ), prisøkning 1. februar og ferie. Alt lagres i nettleseren. Ny ren modell (`lib/modell.js`) kobler skjemaet til optimereren, med feilmeldinger for ugyldig input.

---

## 2026-10-02 — v0.2.0: Kalender og billettoptimerer

Ren logikk i `src/lib`: dato- og helligdagsberegning (påske og alle bevegelige dager lokalt), kalender med innstillingene «jobber man–ons i påskeuka» og «jobber i romjul» (begge PÅ som standard), ferie, hjemmekontor og bil-dager. Optimereren finner billigste kjede av enkelt-, 7-, 30- og 365-dagersbilletter med dynamisk programmering, støtter flere strekninger (også bil-strekninger som Asker), prisøkning hver 1. februar, markering av dager der man må være på toget før utløp, sommertid-varsel, sammenligning mot enkle alternativer og årskort-analyse. Handoff-eksempelet (5 730 kr mot 6 114 kr for tre månedskort) er testfall.

---

## 2026-10-02 — v0.1.0: Prosjektoppsett

Vue 3, Vite og Tailwind 4 med Vitest, GitHub Pages-deploy og CI. Startside uten funksjonalitet; optimerer, kalender og innstillinger kommer i egne leveranser.

---
