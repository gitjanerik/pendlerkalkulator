import { describe, it, expect } from 'vitest'
import { byggStasjon, nyStasjonsId, skjemaFraStasjon, tomtSkjema, validerStasjon } from './stasjoner.js'
import { beregn, standardModell } from './modell.js'

const gyldig = { navn: 'Lillestrøm', enkelt: 90, lufthavn: 120, uke: 500, maaned: 1200, aar: 12000 }

describe('validerStasjon', () => {
  it('godtar et gyldig skjema, og at årskort og flyplass er valgfrie', () => {
    expect(validerStasjon(gyldig)).toEqual({})
    expect(validerStasjon({ ...gyldig, lufthavn: '', aar: '' })).toEqual({})
  })
  it('krever navn og de påkrevde prisene', () => {
    expect(Object.keys(validerStasjon(tomtSkjema())).sort()).toEqual(['enkelt', 'maaned', 'navn', 'uke'])
  })
  it('avviser ugyldige navn', () => {
    for (const navn of ['  ', 'A–B', '<b>', '-Lier', 'x'.repeat(41), 'Oslo S', 'oslo']) {
      expect(validerStasjon({ ...gyldig, navn }).navn, navn).toBeTruthy()
    }
    expect(validerStasjon({ ...gyldig, navn: "Sørumsand's  st." })).toEqual({})
  })
  it('avviser navn som finnes fra før, uavhengig av store bokstaver', () => {
    expect(validerStasjon({ ...gyldig, navn: 'drammen' }).navn).toMatch(/allerede/)
    const egne = [{ id: 'egen-1', navn: 'Lillestrøm–Oslo S' }]
    expect(validerStasjon(gyldig, egne).navn).toMatch(/allerede/)
    expect(validerStasjon(gyldig, egne, 'egen-1')).toEqual({})
  })
  it('avviser ugyldige og urimelige priser', () => {
    expect(validerStasjon({ ...gyldig, enkelt: 0 }).enkelt).toBeTruthy()
    expect(validerStasjon({ ...gyldig, uke: -5 }).uke).toBeTruthy()
    expect(validerStasjon({ ...gyldig, maaned: 1.5 }).maaned).toBeTruthy()
    expect(validerStasjon({ ...gyldig, aar: 1e9 }).aar).toBeTruthy()
    expect(validerStasjon({ ...gyldig, maaned: 400 }).maaned).toMatch(/ukeskortet/)
    expect(validerStasjon({ ...gyldig, aar: 1000 }).aar).toMatch(/månedskortet/)
    expect(validerStasjon({ ...gyldig, uke: 50 }).uke).toMatch(/enkeltbillett/)
  })
})

describe('byggStasjon', () => {
  it('lager en strekning til Oslo S og hopper over årskort uten pris', () => {
    const s = byggStasjon({ ...gyldig, navn: ' Lillestrøm ', aar: '' }, 'egen-1')
    expect(s).toMatchObject({ id: 'egen-1', navn: 'Lillestrøm–Oslo S', enkelt: 90, lufthavn: 120 })
    expect(s.perioder).toEqual([{ dager: 7, pris: 500 }, { dager: 30, pris: 1200 }])
  })
  it('skjemaet kan leses tilbake', () => {
    expect(skjemaFraStasjon(byggStasjon(gyldig, 'x'))).toEqual(gyldig)
  })
  it('gir ledige id-er', () => {
    expect(nyStasjonsId([])).toBe('egen-1')
    expect(nyStasjonsId([{ id: 'egen-2' }])).toBe('egen-3')
  })
  it('kan brukes i beregningen', () => {
    const r = beregn({ ...standardModell('2026-10-02'), strekninger: [byggStasjon(gyldig, 'egen-1')], til: '2026-12-18' })
    expect(r.feil).toBeNull()
  })
})
