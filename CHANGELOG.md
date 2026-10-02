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
