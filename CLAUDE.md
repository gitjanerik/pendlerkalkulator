# CLAUDE.md — Pendlerkalkulator

## Hva er dette?

Vue 3-webapp som finner billigste kjede av periodebilletter (7, 30, 365 dager)
for en daglig arbeidsreise med tog. Brukeren legger selv inn priser per
strekning (Vy, Ruter m.fl.), kalender, ferie og forutsetninger. Appen er
generell: Gulskogen–Oslo S er bare standardeksempelet.

## Sync-modell — origin er sannheten

Hver Claude Code-sesjon kjører i en fersk sandkasse. Alt som ikke er pushet er
borte.

```bash
git fetch origin
git checkout -b claude/<navn> origin/main   # ny feature-branch
git push -u origin <branch>                  # ved sesjonsslutt
```

## Kommandoer

```bash
npm run dev     # utviklingsserver
npm test        # Vitest (tester ligger ved siden av kilden)
npm run build   # produksjonsbygg
```

## Arkitektur

- **`src/lib/` er ren logikk uten DOM og uten nett**, testet med Vitest:
  kalender, billettmodell, optimerer (dynamisk programmering over arbeidsdager),
  prisøkning, helligdager. Vue-komponenter kaller dem og eier ingen regler.
- **Priser er brukerinput.** Entur/Vys salgs-API krever partneravtale, så det
  finnes ingen priskilde. Standardverdier er eksempler med «sist oppdatert».
- **Helligdager beregnes lokalt** (påskealgoritme + faste datoer), slik at
  appen virker offline for alle år. Eksterne datasett er valgfritt tillegg.
- **Arbeidsdag-regler er innstillinger:** «Jobber mandag–onsdag i påskeuka»
  (default PÅ), «Jobber i romjul». Palmesøndag, skjærtorsdag, langfredag og
  1./2. påskedag er alltid fri.
- **Live togavganger** (Entur Journey Planner v3, åpent, krever headeren
  `ET-Client-Name`) er valgfritt og aldri en avhengighet for optimereren.

## Konvensjoner

- Norsk UI-tekst (bokmål) med ekte æ/ø/å.
- Tailwind CSS 4 (`@import "tailwindcss"`, ingen config-fil).
- Mobil-først, WCAG AA, `prefers-color-scheme` og `prefers-reduced-motion`.
- Kommentarer bare der koden gjør noe overraskende.

## Versjonshåndtering — én PR per leveranse

Bump versjon i `package.json`, `package-lock.json` og `src/version.js`, og legg
en ny post øverst i `CHANGELOG.md`
(`## <YYYY-MM-DD> — v<versjon>: <tittel>`). Én commit per PR. Aldri gjenbruk en
merget branch.

## Deploy

Push til `main` deployer til GitHub Pages
(`https://gitjanerik.github.io/pendlerkalkulator/`, `base: '/pendlerkalkulator/'`)
via `.github/workflows/deploy.yml`. Pages må ha kilde «GitHub Actions».
