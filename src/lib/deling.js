import { PRESETS, strekningFraPreset } from './presets.js'
import { normaliserStrekninger } from './modell.js'
import { nyStasjonsId } from './stasjoner.js'

const ISO = /^\d{4}-\d{2}-\d{2}$/
const tall = (v) => (Number(v) > 0 && Number(v) < 1e6 ? Math.round(Number(v)) : '')

const likPreset = (s, p) =>
  s.navn === p.navn &&
  Number(s.enkelt || 0) === p.enkelt &&
  Number(s.lufthavn || 0) === p.lufthavn &&
  JSON.stringify(s.perioder.map((x) => [Number(x.dager), Number(x.pris)])) === JSON.stringify(p.perioder)

// Uendret forhåndsvalg deles som id; alt annet som kompakt JSON med bare det mottakeren trenger.
function nyeKompakt(nye) {
  if (!nye) return undefined
  const k = {
    e: tall(nye.enkelt) || undefined,
    l: tall(nye.lufthavn) || undefined,
    t: tall(nye.tillegg) || undefined,
    p: (nye.perioder ?? []).map((x) => [Number(x.dager), tall(x.pris)]).filter(([, pris]) => pris),
  }
  return k.e || k.l || k.t || k.p.length ? k : undefined
}

function kod(s, medNye = false) {
  const preset = PRESETS.find((p) => p.id === s.id)
  const ny = medNye ? nyeKompakt(s.nye) : undefined
  if (preset && likPreset(s, preset) && !ny) return preset.id
  return JSON.stringify({
    ny,
    i: preset?.id,
    n: s.navn,
    e: tall(s.enkelt) || undefined,
    l: tall(s.lufthavn) || undefined,
    t: tall(s.tillegg) || undefined,
    f: s.flyplass || undefined,
    b: s.bil ? 1 : undefined,
    r: s.ruter ? 1 : undefined,
    fe: s.enturId || undefined,
    te: s.tilEnturId || undefined,
    p: s.perioder.map((x) => [x.dager, x.pris]),
  })
}

export function delingsParametre(modell) {
  const hoved = modell.strekninger[0]
  const params = new URLSearchParams()
  if (!hoved) return params
  const nyDato = modell.nyePriser?.paa && ISO.test(modell.nyePriser.dato ?? '') ? modell.nyePriser.dato : null
  params.set('s', kod(hoved, Boolean(nyDato)))
  const harNye = Boolean(kod(hoved, Boolean(nyDato)).includes('"ny":'))
  if (harNye) params.set('nd', nyDato)
  const egendefinert = kod(hoved)[0] === '{'
  if (egendefinert && ISO.test(modell.prisDato ?? '')) params.set('pd', modell.prisDato)
  return params
}

export function delingsUrl(modell, base) {
  const qs = delingsParametre(modell).toString()
  return qs ? `${base}?${qs}` : null
}

function dekod(verdi) {
  if (!verdi) return null
  const preset = PRESETS.find((p) => p.id === verdi)
  if (preset) return strekningFraPreset(preset, preset.id)
  if (verdi[0] !== '{') return null
  try {
    const j = JSON.parse(verdi)
    if (!Array.isArray(j.p)) return null
    const pre = PRESETS.find((p) => p.id === j.i)
    const [s] = normaliserStrekninger([
      {
        id: pre?.id ?? '',
        navn: String(j.n ?? '').slice(0, 80),
        bil: j.b === 1,
        ruter: j.r === 1,
        enkelt: tall(j.e),
        lufthavn: tall(j.l),
        tillegg: tall(j.t),
        flyplass: j.f,
        enturId: String(j.fe ?? '').slice(0, 60),
        tilEnturId: String(j.te ?? '').slice(0, 60),
        perioder: j.p.slice(0, 6).map(([dager, pris]) => ({ dager: Number(dager), pris: tall(pris) })),
        nye: j.ny && {
          enkelt: tall(j.ny.e),
          lufthavn: tall(j.ny.l),
          tillegg: tall(j.ny.t),
          perioder: (Array.isArray(j.ny.p) ? j.ny.p : []).slice(0, 6).map(([dager, pris]) => ({ dager: Number(dager), pris: tall(pris) })),
        },
      },
    ])
    return s ? { ...s, enturId: String(j.fe ?? '').slice(0, 60) } : null
  } catch {
    return null
  }
}

export function lesDeling(sok) {
  const q = new URLSearchParams(sok)
  const hoved = dekod(q.get('s'))
  if (!hoved) return null
  const pd = q.get('pd')
  const nd = q.get('nd')
  const harNye = Boolean(hoved.nye)
  return { hoved, prisDato: ISO.test(pd ?? '') ? pd : null, nyDato: harNye && ISO.test(nd ?? '') ? nd : null }
}

// Egendefinerte strekninger legges blant mottakerens egne, så de kan velges og endres som andre.
export function brukDeling(modell, deling) {
  let egne = [...(modell.egneStasjoner ?? [])]
  const plasser = (s) => {
    if (PRESETS.some((p) => p.id === s.id)) return s
    const lik = egne.find((e) => JSON.stringify({ ...e, id: '' }) === JSON.stringify({ ...s, id: '' }))
    if (lik) return lik
    const ny = { ...s, id: nyStasjonsId(egne) }
    egne = [...egne, ny]
    return ny
  }
  const hoved = plasser(deling.hoved)
  return {
    ...modell,
    strekninger: [hoved],
    egneStasjoner: egne,
    prisDato: deling.prisDato ?? modell.prisDato,
    nyePriser: deling.nyDato ? { paa: true, dato: deling.nyDato } : { paa: false, dato: '' },
    oppsettFerdig: true,
  }
}
