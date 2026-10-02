## 2026-10-02 — v0.2.0: Kalender og billettoptimerer

Ren logikk i `src/lib`: dato- og helligdagsberegning (påske og alle bevegelige dager lokalt), kalender med innstillingene «jobber man–ons i påskeuka» og «jobber i romjul» (begge PÅ som standard), ferie, hjemmekontor og bil-dager. Optimereren finner billigste kjede av enkelt-, 7-, 30- og 365-dagersbilletter med dynamisk programmering, støtter flere strekninger (også bil-strekninger som Asker), prisøkning hver 1. februar, markering av dager der man må være på toget før utløp, sommertid-varsel, sammenligning mot enkle alternativer og årskort-analyse. Handoff-eksempelet (5 730 kr mot 6 114 kr for tre månedskort) er testfall.

---

## 2026-10-02 — v0.1.0: Prosjektoppsett

Vue 3, Vite og Tailwind 4 med Vitest, GitHub Pages-deploy og CI. Startside uten funksjonalitet; optimerer, kalender og innstillinger kommer i egne leveranser.

---
