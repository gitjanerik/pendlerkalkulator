## 2026-10-04 — v1.9.4: Ryddigere fritidstekster

Fjernet de selvforklarende tekstene om at jobbstedet ikke ligger på veien til flyplassen (i skjemaet for egen strekning). Fritidsreisene viser nå «<hjemstasjon> til Oslo lufthavn» i stedet for «Opp til Oslo lufthavn».

---

## 2026-10-04 — v1.9.3: Egne stasjoner kan velges, endres og slettes igjen

Feil rettet: et trykk på en lagret egen strekning (som Stokke) ga en feil, så den kunne ikke velges. Dermed kom heller ikke Rediger og Slett frem, hverken i veiviseren eller i Innstillinger.

---

## 2026-10-04 — v1.9.2: Fritidsreiser i introduksjonen

Nytt punkt under «Her gjør appen størst forskjell»: mange turer til flyplassen gir fordel, og fritidsreisene påvirker når billettene starter.

---

## 2026-10-04 — v1.9.1: Versjonsnummer i veiviseren

Versjonsnummeret står nederst i veiviseren, med samme skriftstørrelse og farge som i Innstillinger.

---

## 2026-10-04 — v1.9.0: Flyplassen for alle jobbsteder

Sjekken mot Entur gjelder nå alle jobbsteder, ikke bare Oslo S. Appen finner ut om jobbstedet ligger på veien til Oslo lufthavn:

- **På veien (bak):** periodebilletten dekker til jobbstedet, og du kjøper bare tillegget videre. Tillegget fylles inn for egne strekninger (Oslo S har fast 134 kr).
- **Flyplassen før jobbstedet:** billetten dekker hele veien.
- **Ikke på veien:** periodebilletten hjelper ikke, og flyplassreisen regnes som enkeltbillett (pris må fylles inn).

Fritidsreiser vises nå for alle strekninger, og tekstene bruker navnet på jobbstedet. Inkluderer v1.8.1 (info om priseksempler).

---

## 2026-10-04 — v1.8.1: Info om priseksempler

Oslo S er fortsatt standardmålet. Veiviseren og Innstillinger sier nå at appen har priseksempler for åtte stasjoner til Oslo S, og at andre strekninger legges til og prises av brukeren.

---

## 2026-10-04 — v1.8.0: Fritt valgt jobbsted

Strekningen har nå et valgfritt mål. «+ Egen strekning» i veiviseren og Innstillinger har to stedsøk mot Entur, «Fra stasjon» og «Til stasjon». Til er Oslo S som standard, og alle forhåndsvalgene og tidligere lagrede stasjoner er fortsatt strekninger til Oslo S. Begge stasjonene må velges fra Enturs liste (Oslo S som mål trenger ikke valg), fra og til kan ikke være samme stasjon, og samme strekning kan ikke legges inn to ganger. Valg som ikke går til Oslo S vises som «Fra–Til». Avreisetidene, «Foreslå fra Entur», prissteget og tekstene bruker målet i stedet for Oslo S. Fritidsreiser til Oslo lufthavn finnes bare for strekninger til Oslo S: for andre mål forsvinner steget i veiviseren («Steg N av M» teller riktig) og seksjonen i Innstillinger, og lagrede fritidsreiser ignoreres. Flyplasssjekken mot Entur kjøres bare når målet er Oslo S. Prisgrensene i skjemaet (enkeltbillett 999 kr, uke- og månedskort 9 999 kr) gjelder uendret også for lange strekninger.

---

## 2026-10-04 — v1.7.1: Tekster i veiviseren

Teksten under «Her gjør appen størst forskjell» nevner ikke lenger Gulskogen–Oslo S: «Tallene er regnet ut av appen for Vys priser høsten 2026.» Forklaringen i steget «Fritidsreiser» (og under fritidslisten i Innstillinger) tilpasser seg hjemstasjonen: ligger flyplassen bak Oslo S, nevnes tillegget Oslo S–Oslo lufthavn, og ligger den på veien til Oslo S, sies det at periodebilletten dekker hele reisen.

---

## 2026-10-04 — v1.7.0: Flyplassen før eller bak Oslo S

Fritidsreiser til Oslo lufthavn regnes nå riktig for pendlere fra nord (Hamar, Eidsvoll). Når du velger en egen stasjon, spør appen Enturs reiseplanlegger om reisen til Oslo lufthavn går via Oslo S. Fra sør (alle forhåndsvalgene) er det som før: periodebilletten dekker til Oslo S, og du kjøper bare tillegget Oslo S–Oslo lufthavn. Fra nord ligger flyplassen før Oslo S, så periodebilletten dekker hele veien og reisen koster ingenting ekstra. Uten gyldig billett kjøpes hele billetten til flyplassen. Fra nord er flyplassprisen påkrevd i skjemaet, siden den ikke kan regnes ut fra enkeltbilletten til Oslo S. Fra sør er den fortsatt valgfri, og skjemaet forklarer anslaget. Får appen ikke svar fra Entur, regnes flyplassen som bak Oslo S. Fikser også statusteksten under søkefeltet, som viste feil melding siden v1.6.1.

---

## 2026-10-04 — v1.6.1: Strengere valg av egen stasjon

Egne stasjoner må velges fra Enturs søk, så navnet alltid er offisielt. Skriver du videre etter at du har valgt, må du velge på nytt. Prisfeltene er vanlige tallfelt med `min` og `max`: enkeltbillett og flyplassbillett høyst 999 kr, uke- og månedskort høyst 9 999 kr, årskort høyst 99 999 kr. I veiviseren kan du legge til én egen stasjon; Innstillinger har fortsatt «+ Egen stasjon» uten grense. Egne stasjoner lagret før denne versjonen må velges på nytt fra listen ved neste redigering.

---

## 2026-10-04 — v1.6.0: Stedsøk for egne stasjoner

Når du legger til en egen hjemstasjon, foreslår Entur jernbanestasjoner mens du skriver (med kommune eller fylke), og et trykk fyller inn navnet og flytter fokus til prisene. Navnet kan fortsatt skrives fritt, så appen virker uten nett. Prisene fylles fortsatt ut selv, siden Entur ikke åpner for dem uten partneravtale.

---

## 2026-10-04 — v1.5.0: Egne hjemstasjoner

Veiviseren og Innstillinger har «+ Egen stasjon». Du oppgir navn og priser (enkeltbillett, ukeskort og månedskort er påkrevd; årskort og flyplassbillett er valgfrie), og kan redigere og slette stasjonen etterpå. Skjemaet validerer innholdet: navnet må være gyldig og unikt, prisene hele beløp, og lengre billetter må koste mer enn kortere. Feil står ved feltet, og fokus går til det første feltet med feil. «Nullstill» beholder egne stasjoner, med en bryter i bekreftelsen (av som standard) for å slette dem også.

---

## 2026-10-04 — v1.4.0: Flyplasspris per strekning

Prisen for enkeltbillett til Oslo lufthavn er et eget felt på hver strekning, forhåndsutfylt for de åtte stasjonene (Gulskogen 308, Drammen 298, Brakerøya 295, Lier 283, Asker, Heggedal, Røyken og Spikkestad 162 kr). Egne strekninger kan fylle det ut i veiviseren og i innstillingene. Står feltet tomt, brukes enkeltbillett til Oslo S pluss tillegget som anslag. Lagrede strekninger fra før henter prisen fra forhåndsvalget med samme id.

---

## 2026-10-04 — v1.3.1: Fritidsreiser dekket av periodebillett

Fritidsreiser til Oslo lufthavn koster bare tillegget Oslo S–Oslo lufthavn (134 kr) når en periodebillett eller den eksisterende billetten dekker reisen. Uten dekning kjøpes én enkeltbillett hele veien fra hjemstasjonen (Gulskogen 308 kr osv.). Kortet viser igjen om hver reise er dekket, og prisene følger prisøkningen med asterisk.

---

## 2026-10-04 — v1.3.0: Widget-justeringer

**Billettene dine.** Den klebrige venstrekolonnen i tabellen ligger ikke lenger oppå tannhjulet i toppen.

**Fritidsreiser til Oslo lufthavn.** Hver reise er én enkeltbillett fra hjemstasjonen til Oslo lufthavn (Gulskogen 308, Drammen 298, Brakerøya 295, Lier 283, Asker, Heggedal, Røyken og Spikkestad 162 kr), uavhengig av periodebilletten. To billetter lønner seg aldri. Prisen følger den årlige prisøkningen, og reiser etter første økning får asterisk. Listen sier «Opp til» og «Hjem fra» og viser årstall.

**Spart med hjemmekontor.** Grafen teller dager med hjemmekontor (0–4) i stedet for dager på jobb. 0 er full pendleruke.

**Fjernet.** Varselet om sommer- og vintertid og kortet «Neste tog».

**Årskort.** «Vurder årskort» er en bryter i veiviserens første steg, og er av som standard.

---

## 2026-10-03 — v1.2.0: Universell utforming og bedre brukeropplevelse

Gjennomgang med fokus på universell utforming (WCAG 2.2 AA) og brukeropplevelse. En designagent målte kontrast, berøringsmål og layout i nettleser i lyst og mørkt tema.

**Tastatur og skjermleser.** Kalenderen er et rutenett: piltaster flytter mellom dager, Page Up og Page Down bytter måned (med Shift et år), Home og End går til ukens start og slutt, Esc lukker, og bare én dato står i tabrekkefølgen. Billettkalenderen er en tabell med uker og ukedager, og dager uten billett (ferie, helligdag, hjemmekontor) leses opp. Import fra kalenderfil er en ekte dialog med fokusfelle og Esc. Fokus havner et fornuftig sted når noe forsvinner: lukket tips, fjernet ferie eller fritidsreise, lukket kalender, første og siste steg i veiviseren, etter veiviseren og etter nullstilling. Veiviseren melder «Steg N av 10» med tittel ved hvert steg, tittelen er en ekte overskrift, og «Tilbake» og «Neste» har tekst og skjules (ikke deaktiveres) i endene. Piltastene bytter steg bare med fokus på disse knappene. Det nye resultatet leses opp stille når det endrer seg, og grafen og «dager i uka» leser ikke lenger opp hver gang du peker. «Minst én dag må være valgt» vises når siste jobbdag forsøkes fjernet. «Neste tog» har en ekte overskrift, og knapper som laster bruker `aria-disabled`, så fokus blir stående. Brytere har tittelen som navn og forklaringen som beskrivelse. Datoer leses med hele navn («mandag 12. oktober 2026»).

**Kontrast og utseende.** Kanten på felt, knapper og brytere holder 3:1 mot alle flater (ny `--color-edge`), og plassholderen («Ukjent») holder 4,5:1. Advarselsfargen er mørkere i lyst tema (4,5:1 også mot bakgrunnen), bryterne er tydelige i av-stilling, billettsegmentene har full kant uansett fyll, og stolpene i «Spart med hjemmekontor» er mørkere, med valgt antall dager i fet, understreket skrift. Dagene i billettkalenderen har full tekstfarge på farget flate og en aksentlinje nederst, også i mørkt tema. «Billigste løsning» ligger rett under «Neste tog», så tallet er synlig uten å rulle. Seksjonstitler er 16 px fet tekst i stedet for små versaler, og forklaringer og tabelltekst som var 12 px er nå 14 px. Valg av visning (Tidslinje, Kalender, Tabell) er en segmentert kontroll med tekst og 44 px høyde. I tabellen er prisen festet til høyre kant, med en forklaring på hvorfor summen kan avvike fra hovedtallet, og dager med enkeltbillett er listet med dato og pris. «Neste tog» sier til eller fra Oslo S i tittelen. Grafen skriver «20,6k» med desimalkomma, og tall og ord i oppsummeringen deles ikke av linjeskift. Menyen viser piler på sammenleggbare avsnitt igjen, og siden bak en åpen dialog ruller ikke. Fokusringen vises på «i dag» i kalenderen og i tipsboblen, og skjules ikke av den klebrige toppen. Windows høykontrast har egne regler for valgte knapper, brytere og kalender, og utskrift i mørkt tema blir lys. Innholdet unngår hakk i liggende retning.

**Fikser.** Sammenligningsradene sprengte siden ved stor skrift. Den pulserende «Sett i gang»-knappen flimret med redusert bevegelse. «I dag» i kalenderen gikk feil mellom midnatt og kl. 02. Veiviseren rullet 13 px på hvert steg. Ny `<noscript>`-melding.

---

## 2026-10-03 — v1.1.0: Billetter prises forholdsmessig, pris per måned

Perioden har fortsatt start og slutt (standard er nå 12 måneder), men sluttdatoen gir ikke lenger en kunstig tilpasning: hver billett prises forholdsmessig etter hvor mye av den som ligger innenfor perioden. Tidligere kunne 7-dagersbilletter og enkeltbilletter dukke opp mot slutten bare fordi perioden sluttet. Hovedtallet er nå pris per måned, med totalen for perioden under. Årskort sammenlignes mot et helt år. «Sammensetning av billetter» sier nå hva det lønner seg å tilpasse billettene fremfor månedskort hele veien, og at månedskort nesten alltid holder med 4–5 reisedager i uka. Veiviseren har fått et nytt steg 1 som forklarer det samme: hvor mye det er å vinne, og hvem appen gjør størst forskjell for.

---

## 2026-10-02 — v1.0.8: Påske og romjul av som standard

«Jobber i påske mandag–onsdag» og «Jobber i romjul» er nå av som standard (gjelder nye brukere; lagrede innstillinger beholdes).

---

## 2026-10-02 — v1.0.7: «Vurder årskort» i infoboksen

Infoboksen om årskort har fått en bryter «Vurder årskort», som en snarvei til samme innstilling som i menyen (standard er fortsatt på). Bryteren vises når årskort lønner seg, eller når det allerede er slått på. Besparelsen får stjerne og fotnote om prisøkning når årskort- eller sammenligningsprisene er satt etter en økning.

---

## 2026-10-02 — v1.0.6: Prisøkning på som standard og ryddigere varsler

Prisøkning er nå slått på som standard (gjelder nye brukere; lagrede innstillinger beholdes). Klokkeskifter vises som to punktlister, sommertid og vintertid, med datoer. Norsk orddeling (hyphens) er slått på. Visningsknappene i «Billettene dine» bryter til egen linje når det er trangt. «Billettsammenligning» heter nå «Sammensetning av billetter». Teksten «lagres i nettleseren» er fjernet fra menyen.

---

## 2026-10-02 — v1.0.5: Stjerne også på «Spart med hjemmekontor»

Beløpene under søylene (valgt mønster og «Full uke ville kostet …») merkes med stjerne når de er satt etter en prisøkning, med samme fotnote som ellers.

---

## 2026-10-02 — v1.0.4: Stjerne på estimerte priser

Når prisøkning er på, merkes priser satt etter en økning med en liten stjerne: totalen, per måned, sammenligningen og hver billett i tidslinje, kalender og tabell. En fotnote forklarer at det er et estimat med valgt prosent hver 1. februar. Priser før første økning merkes ikke. Prisøkningen regnes som rente på rente (1,04² etter andre februar).

---

## 2026-10-02 — v1.0.3: Fjernet 36 mnd-valget

«36 mnd» ga feilen «Velg en periode på høyst 1095 dager», fordi tre år fra startdato er 1096 dager. Lengdevalgene er nå 1, 3, 6, 12 og 24 måneder.

---

## 2026-10-02 — v1.0.2: Ny introtekst i menyen

Introteksten i menyen er skrevet om og gjort kortere: den sier hvorfor appen finnes og oppfordrer til å legge inn ferie og fravær i god tid. Den utfoldbare overskriften er endret fra «Litt mindre hodebry» til «Lei av månedsbasert billettpsykose?».

---

## 2026-10-02 — v1.0.1: Ny kolonnerekkefølge i tabellvisningen

Utnyttelse er flyttet til kolonne 2, antall turer til kolonne 3, pris står sist, og all tekst er venstrejustert. Uka der et årskort starter har et lite ∞ hevet ved ukenummeret. Utnyttelse under 90 % vises i advarselsfarge.

---

## 2026-10-02 — v1.0.0: Første stabile versjon

«Nullstill» i menyen og «Ja, nullstill» i bekreftelsesdialogen har nå rød bakgrunn og hvit tekst (kontrast 6,5:1, også i mørk modus).

---

## 2026-10-02 — v0.16.9: Dynamisk overskrift for pendledager

Overskriften over ukedagsvalget følger valget: «Full pendleruke» når alle fem dager er på, «4 dager pendling» osv. ved færre, og «1 dag pendling i uka» ved én dag. Tallet til høyre er fjernet.

---

## 2026-10-02 — v0.16.8: «Starter kl.» er alltid synlig

Klokkeslettfeltet under Periode vises nå alltid som et vanlig tidsfelt, også når «Bruk nå» er valgt. «Bruk nå» er en av/på-knapp som viser om starten følger klokka, og teksten under forklarer hva som er valgt. Å endre klokkeslettet velger tiden manuelt.

---

## 2026-10-02 — v0.16.7: Bredere tabell med fast første kolonne

Tabellvisningen av billettene scroller nå sideveis i stedet for å presse kolonnene sammen. Ukekolonnen står fast mens du scroller, og «Fra» og «Til» har egne kolonner (dato med klokkeslett under) uten «kl.» i overskriftene.

---

## 2026-10-02 — v0.16.6: Antall billetter per type

Når du trykker på «Billigst» står det nå hvor mange billetter av hver type løsningen består av (for eksempel «2 × 7 dager, 1 × 30 dager, 3 enkeltbilletter») i stedet for den generelle forklaringen.

---

## 2026-10-02 — v0.16.5: «Billigst» med kjede-ikon

Raden «Billigste kombinasjon» heter nå «Billigst» og har fått et lite kjede-ikon når løsningen kombinerer flere billettyper (inkludert enkeltbilletter). «Best»-pillen er fjernet siden «Billigst» sier det samme.

---

## 2026-10-02 — v0.16.4: Kortere infotekst i Billettsammenligning

Setningen «Øverste rad er løsningen vi anbefaler» er fjernet; igjen står «Trykk på en rad for detaljer.»

---

## 2026-10-02 — v0.16.3: Hjemmekontor mot full uke

Under grafen «Spart med hjemmekontor» står det nå hva full uke (5 dager) ville kostet og hvor mye du sparer med valgt antall dager.

---

## 2026-10-02 — v0.16.2: «Billettsammenligning»

Seksjonen som sammenligner billettvalg heter nå «Billettsammenligning», og «Billigste kjede» er byttet med «Billigste kombinasjon» (kjede var en direkte oversettelse av «chain»).

---

## 2026-10-02 — v0.16.1: «Spart med hjemmekontor»

Overskriften i hjemmekontor-seksjonen er ikke lenger et spørsmål, og teksten bruker entall der det passer («1 dag i uka»).

---

## 2026-10-02 — v0.16.0: Tre visninger av billettene

«Billettene dine» har fått tre små ikonknapper øverst til høyre: tidslinje (som før), kalender (én måned om gangen, fargelagt etter billett, med uke­numre og markering av fri/ferie/hjemmekontor) og tabell (uke, fra–til med ukedag, klokkeslett, pris, turer og utnyttelse). Utnyttelse er reiser billetten dekker delt på reiser en full arbeidsuke (man–fre) ville gitt i gyldighetstiden.

---

## 2026-10-02 — v0.15.10: Tre års periode, «Starter kl.» beholdes

Sluttdatoen kan nå ligge inntil 3 år (365 × 3 dager) fram, og periodevalget har fått 24 og 36 mnd, slik at man ser at årskort fornyet hvert år lønner seg. «Starter kl.» med «Bruk nå» er uendret: reiser før klokkeslettet regnes ikke med, og billettene aktiveres ved første reise etter det.

---

## 2026-10-02 — v0.15.8: Hodebry-tekst i Innstillinger

Under infoteksten øverst i Innstillinger ligger nå en sammenleggbar «Litt mindre hodebry» (details) om at utregningen er tung før sommer- og juleferie, og at appen passer best for litt lengre perioder enn måned til måned.

---

## 2026-10-02 — v0.15.7: Nyttårsaften er alltid fri

Nyttårsaften (31. desember) regnes nå som fridag for alle, på lik linje med julaften. «Jobber i romjul» gjelder dermed 27.–30. desember.

---

## 2026-10-02 — v0.15.6: Entur-forslag følger ønsket tid

«Foreslå fra Entur» tar nå utgangspunkt i klokkeslettene du har valgt: første tog hjemmefra fra din morgentid, og første tog fra Oslo S fra din ettermiddagstid (for eksempel 07:12 og 16:12 fra Gulskogen). Den faste 8-timersregelen og kravet om ankomst før 09:00 er fjernet, og forklaringstekstene under knappen og billettinfoen i menyen er tatt bort.

---

## 2026-10-02 — v0.15.5: Infotekst øverst i Innstillinger

Innstillinger åpner med en kort tekst som forklarer hva appen gjør.

---

## 2026-10-02 — v0.15.4: Infoboksen som snakkeboble

Tipset om Innstillinger vises nå som en grønn snakkeboble med en liten trekant som peker opp på tannhjulet, med kortere tekst tilpasset mobil og en myk skygge under.

---

## 2026-10-02 — v0.15.3: Infoboks etter veiviseren

Når veiviseren er fullført vises en infoboks øverst som forteller at ferie, fritidsreiser, hjemstasjon m.m. kan tilpasses i Innstillinger. Boksen lukkes med X og kommer først tilbake etter Nullstill og ny veiviser.

---

## 2026-10-02 — v0.15.2: Veiviserknappene på egen rad

Tilbake og Neste ligger igjen på en rad midtstilt over de ni prikkene i veiviseren.

---

## 2026-10-02 — v0.15.1: Smale piler på kanten i veiviseren

Tilbake- og Neste-pilene i veiviseren er smalere og ligger midt på høyden, sentrert på kortets kantlinje. Prikkene står alene nederst. Hjelpeteksten under «Foreslå fra Entur» er fjernet i steg 3.

---

## 2026-10-02 — v0.15.0: Innstillinger i veiviseren

Innstillinger kan åpnes også under oppsettet, med bare Utseende, App og versjonsnummer. Nullstill er skjult der. Steg 3 har kortere tekst så veiviseren ikke scroller, og steg 8 mistet linjen om «sist sjekket».

---

## 2026-10-02 — v0.14.3: Entur-forslaget tar hensyn til arbeidsdagen

«Foreslå fra Entur» velger nå første hjemtog som går minst 8 timer (inkl. 30 min pause) etter at morgentoget er fremme, i stedet for en fast grense kl. 15. Finnes det ikke noe morgentog, brukes kl. 15 som før.

---

## 2026-10-02 — v0.14.2: Fjernet slider for dager på jobb

«Dager på jobb i uka» har nå bare ukedagsknappene. Slideren var overflødig og ga to kontroller for samme valg.

---

## 2026-10-02 — v0.14.1: Tydeligere tekst om start av ny billett

Veiviseren sier nå at ny billett starter på første avgang etter at den gamle utløper, og at det kan være ettermiddagsturen samme dag.

---

## 2026-10-02 — v0.14.0: Foreslå avganger fra Entur

Ny knapp «Foreslå fra Entur» under avgangstidene (oppsett og meny). Den fyller inn første tog fra hjemstasjonen som er fremme på Oslo S før 09:00, og første tog fra Oslo S hjemover etter 15:00, for neste arbeidsdag. Det er kun et forslag: feltene kan rettes som før, og innstilte avganger hoppes over.

---

## 2026-10-02 — v0.13.2: Avgangstider direkte, uten kjernetid

Kjernetid og reisetid er fjernet. Du skriver inn avgangene du faktisk tar fra stasjonen og fra Oslo S (standard 07:00 og 16:00). Ny billett starter ved første avgang etter at den gamle utløper, så en avgang 15:11 i dag blir med når du velger «Bruk nå» etter 15:00.

---

## 2026-10-02 — v0.13.1: Heggedal, Røyken og Spikkestad

Tre nye stasjoner å velge mellom, med enkelt-, uke-, måneds- og årskortpris og reisetid til Oslo S: Heggedal (45 min), Røyken (50 min) og Spikkestad (53 min). Heggedal har Asker-prisene og får Ruter Reis på enkeltbilletter.

---

## 2026-10-02 — v0.13.0: Fritidsreiser til Oslo lufthavn

Nytt steg i oppsettet og ny seksjon i Innstillinger der du registrerer fritidsreiser til Oslo lufthavn som et par: dagen du reiser ned og dagen du kommer hjem. Reisene tas med når billigste kjede velges. Er periodebilletten gyldig, trenger du bare tilleggsbillett Oslo S–Oslo lufthavn (134 kr); ellers regnes enkeltbillett pluss tillegget. Oversikten viser hva som gjelder for hver reise, og tidslinjen har egne merker. Reiser utenfor beregningsperioden regnes ikke med. Tillegget er ikke Reis-rabattert.

---

## 2026-10-02 — v0.12.6: Starttidspunkt som tekst

Starttidspunktet i «Periode» vises som ren tekst (klokka nå). Trykk på det for å velge et annet. Klokkeslettet står stille til du oppdaterer det selv: en liten oppdater-knapp vises når minuttet er gammelt, og plassen er reservert så seksjonen ikke hopper.

---

## 2026-10-02 — v0.12.5: Tre neste tog og startklokkeslett

«Neste tog» viser nå de tre neste avgangene i den utvidede delen. I «Periode» er det et klokkeslett for når beregningen starter. Standard er klokka nå (første dag), og du kan overstyre den, for eksempel hvis du er på kontoret og først skal fornye billetten i ettermiddag. «Bruk nå» tilbakestiller.

---

## 2026-10-02 — v0.12.4: Hjelpetekst om Vy Smartpris

Når du reiser færre enn fem dager i uka, viser appen nå en kort tekst om at Vy Smartpris kan bli billigere enn månedskort. Smartpris er ikke med i beregningen, fordi Vy ikke oppgir hele rabattstigen, og den er capped på prisen for 30 dager.

---

## 2026-10-02 — v0.12.3: Tåler stor skrift, tydeligere sammenligning

Beløpet i hovedkortet skalerer nå med skjermbredden og brytes i stedet for å sprenge kortet. Innstillingsbrytere, neste tog, periodevalg, søylediagram og sammenligningsrader tåler ekstra stor tekst. Sammenligningen heter «Billigste kjede mot enklere valg», har «Best»-merke og piler som viser at radene kan trykkes. Entall og flertall er rettet («1 periodebillett»), «Årskort binder deg …» er fjernet, og varselet om eksisterende billett forklarer at ny billett aldri starter rett etter utløp.

---

## 2026-10-02 — v0.12.2: Reis bare fra Asker, enklere ikon

Ruter Reis-rabatten regnes nå bare på enkeltreiser innenfor Ruters soner, altså fra Asker, og bryteren i innstillingene vises bare når en slik stasjon er valgt. Andre stasjoner beholder full enkeltpris. Appikonet er forenklet til et ikonogram av et tog forfra.

---

## 2026-10-02 — v0.12.1: Nytt appikon

Appikonet er tegnet om som et enkelt tog sett fra siden, med pantograf, kjøreledning og skinne, hvitt på grønn flate. Samme motiv brukes som favicon.

---

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
