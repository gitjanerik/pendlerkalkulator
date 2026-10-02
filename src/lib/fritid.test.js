import { describe, it, expect } from 'vitest'
import { OSL_TILLEGG, byggFritidsturer } from './fritid.js'
import { optimaliser } from './optimerer.js'
import { beregn, standardModell } from './modell.js'

const ramme = { fra: '2026-10-02', til: '2026-12-18', fraKlokke: '16:00', morgen: '07:00', ettermiddag: '16:00' }
const handoff = () => ({ ...standardModell('2026-10-02'), fraKlokke: '16:00', til: '2026-12-18', inkluderAarskort: false })

describe('byggFritidsturer', () => {
  it('lager en tur ned og en hjem, og dropper det som er før start eller etter slutt', () => {
    const t = byggFritidsturer([{ fra: '2026-10-10', til: '2026-10-11' }], ramme)
    expect(t.map((x) => `${x.dato} ${x.retning}`)).toEqual(['2026-10-10 ned', '2026-10-11 hjem'])
    expect(t.every((x) => x.fritid)).toBe(true)
    expect(byggFritidsturer([{ fra: '2026-09-01', til: '2026-09-02' }], ramme)).toEqual([])
    expect(byggFritidsturer([{ fra: '2027-01-10', til: '2027-01-11' }], ramme)).toEqual([])
  })
})

describe('optimaliser med fritidsreiser', () => {
  it('uten periodebillett blir en enkelt fritidstur enkeltbillett pluss tillegg', () => {
    const turer = byggFritidsturer([{ fra: '2026-10-10', til: '2026-10-10' }], ramme)
    const s = [{ id: 'a', navn: 'A', bil: false, ruter: false, enkelt: 156, perioder: [{ dager: 30, pris: 1500 }] }]
    const r = optimaliser(turer.slice(0, 1), s, { fritidTillegg: OSL_TILLEGG })
    expect(r.kostnad).toBe(156 + OSL_TILLEGG)
    expect(r.fritid[0].dekning).toBe('enkelt')
  })
})

describe('beregn med fritidsreiser', () => {
  it('legger til tillegget per tur, og periodebilletten dekker reisen', () => {
    const base = beregn(handoff())
    const r = beregn({ ...handoff(), fritidsreiser: [{ fra: '2026-10-10', til: '2026-10-11' }] })
    expect(r.resultat.kostnad - base.resultat.kostnad).toBe(2 * OSL_TILLEGG)
    expect(r.fritid.sum).toBe(2 * OSL_TILLEGG)
    expect(r.fritid.reiser.map((x) => x.dekning)).toEqual(['periode', 'periode'])
  })

  it('reiser utenfor perioden gir ingen fritidsdel', () => {
    const r = beregn({ ...handoff(), fritidsreiser: [{ fra: '2027-03-01', til: '2027-03-02' }] })
    expect(r.fritid).toBeNull()
    expect(r.resultat.kostnad).toBe(beregn(handoff()).resultat.kostnad)
  })

  it('tur dekket av eksisterende billett regnes bare med tillegget', () => {
    const r = beregn({
      ...handoff(),
      eksisterende: { paa: true, type: 'maaned', til: '2026-10-20', klokke: '07:00' },
      fritidsreiser: [{ fra: '2026-10-10', til: '2026-10-11' }],
    })
    expect(r.fritid.reiser.map((x) => x.dekning)).toEqual(['eksisterende', 'eksisterende'])
  })
})
