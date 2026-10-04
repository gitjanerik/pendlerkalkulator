import { describe, it, expect } from 'vitest'
import { gaarTilOsloS, maalnavn, rensStasjonsnavn, stasjonsnavn, strekningsvalg, byggStasjon, nyStasjonsId, skjemaFraStasjon, tomtSkjema, validerStasjon } from './stasjoner.js'
import { beregn, standardModell } from './modell.js'

const gyldig = { navn: 'Lillestrøm', enturId: 'NSR:StopPlace:1', til: 'Oslo S', tilEnturId: '', flyplass: 'bak', enkelt: 90, lufthavn: 120, tillegg: '', uke: 500, maaned: 1200, aar: 12000 }

describe('validerStasjon', () => {
  it('godtar et gyldig skjema, og at årskort og flyplass er valgfrie', () => {
    expect(validerStasjon(gyldig)).toEqual({})
    expect(validerStasjon({ ...gyldig, lufthavn: '', aar: '' })).toEqual({})
  })
  it('krever navn og de påkrevde prisene', () => {
    expect(Object.keys(validerStasjon(tomtSkjema())).sort()).toEqual(['enkelt', 'maaned', 'navn', 'uke'])
  })
  it('godtar bare stasjoner valgt fra Entur', () => {
    expect(validerStasjon({ ...gyldig, enturId: '' }).navn).toMatch(/Entur/)
    expect(validerStasjon({ ...gyldig, navn: '  ', enturId: '' }).navn).toBeTruthy()
    expect(validerStasjon({ ...gyldig, navn: 'x'.repeat(41) }).navn).toBeTruthy()
    expect(validerStasjon({ ...gyldig, navn: 'Oslo S' }).til).toMatch(/samme/)
  })
  it('krever flyplassprisen når flyplassen ligger før Oslo S', () => {
    expect(validerStasjon({ ...gyldig, flyplass: 'foer', lufthavn: '' }).lufthavn).toMatch(/Oslo lufthavn/)
    expect(validerStasjon({ ...gyldig, flyplass: 'foer', lufthavn: 150 })).toEqual({})
    expect(validerStasjon({ ...gyldig, flyplass: 'bak', lufthavn: '' })).toEqual({})
    expect(byggStasjon({ ...gyldig, flyplass: 'foer', lufthavn: 150 }, 'x').flyplass).toBe('foer')
  })
  it('avviser navn som finnes fra før, uavhengig av store bokstaver', () => {
    expect(validerStasjon({ ...gyldig, navn: 'drammen' }).til).toMatch(/allerede/)
    const egne = [{ id: 'egen-1', navn: 'Lillestrøm–Oslo S' }]
    expect(validerStasjon(gyldig, egne).til).toMatch(/allerede/)
    expect(validerStasjon(gyldig, egne, 'egen-1')).toEqual({})
  })
  it('avviser ugyldige og urimelige priser', () => {
    expect(validerStasjon({ ...gyldig, enkelt: 0 }).enkelt).toBeTruthy()
    expect(validerStasjon({ ...gyldig, uke: -5 }).uke).toBeTruthy()
    expect(validerStasjon({ ...gyldig, maaned: 1.5 }).maaned).toBeTruthy()
    expect(validerStasjon({ ...gyldig, enkelt: 999, lufthavn: 999, uke: 1500, maaned: 9999, aar: 99999 })).toEqual({})
    expect(validerStasjon({ ...gyldig, enkelt: 1000 }).enkelt).toMatch(/999/)
    expect(validerStasjon({ ...gyldig, maaned: 10000 }).maaned).toMatch(/9999/)
    expect(validerStasjon({ ...gyldig, aar: 100000 }).aar).toBeTruthy()
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

describe('rensStasjonsnavn', () => {
  it('fjerner «stasjon» på slutten', () => {
    expect(rensStasjonsnavn('Asker stasjon')).toBe('Asker')
    expect(rensStasjonsnavn('Stasjonsveien')).toBe('Stasjonsveien')
    expect(rensStasjonsnavn('Mo–Rana stasjon')).toBe('Mo-Rana')
  })
})

describe('fritt valgt mål', () => {
  const drammenTilAsker = { ...gyldig, navn: 'Drammen', til: 'Asker', tilEnturId: 'NSR:asker', flyplass: 'foer', lufthavn: 150 }
  it('målet må velges fra Entur, unntatt Oslo S', () => {
    expect(validerStasjon(drammenTilAsker)).toEqual({})
    expect(validerStasjon({ ...drammenTilAsker, tilEnturId: '' }).til).toMatch(/Entur/)
    expect(validerStasjon({ ...drammenTilAsker, til: '' }).til).toBeTruthy()
    expect(validerStasjon({ ...drammenTilAsker, til: 'drammen' }).til).toMatch(/samme/)
  })
  it('Drammen–Asker er en annen strekning enn Drammen–Oslo S', () => {
    expect(validerStasjon(drammenTilAsker)).toEqual({})
    expect(validerStasjon({ ...drammenTilAsker, til: 'Oslo S' }).til).toMatch(/allerede/)
  })
  it('flyplassfeltene følger forholdet til flyplassen', () => {
    const bak = { ...drammenTilAsker, flyplass: 'bak', lufthavn: '' }
    expect(validerStasjon(bak).tillegg).toMatch(/tillegget Asker/)
    expect(validerStasjon({ ...bak, tillegg: 80 })).toEqual({})
    const utenfor = { ...drammenTilAsker, flyplass: 'utenfor', lufthavn: '' }
    expect(validerStasjon(utenfor).lufthavn).toBeTruthy()
    expect(validerStasjon({ ...utenfor, lufthavn: 120 })).toEqual({})
    expect(validerStasjon({ ...drammenTilAsker, flyplass: null, lufthavn: '' }).lufthavn).toBeTruthy()
  })
  it('flyplassprisen kreves bare på strekninger til Oslo S', () => {
    expect(validerStasjon({ ...drammenTilAsker, flyplass: 'foer', lufthavn: '' })).toEqual({})
    expect(validerStasjon({ ...gyldig, flyplass: 'foer', lufthavn: '' }).lufthavn).toBeTruthy()
  })
  it('bygger strekning, navn og valg', () => {
    const s = byggStasjon({ ...drammenTilAsker, lufthavn: 150 }, 'egen-1')
    expect(s).toMatchObject({ navn: 'Drammen–Asker', tilEnturId: 'NSR:asker', lufthavn: 150 })
    expect([stasjonsnavn(s), maalnavn(s), gaarTilOsloS(s), strekningsvalg(s)]).toEqual(['Drammen', 'Asker', false, 'Drammen–Asker'])
    expect(skjemaFraStasjon(s)).toMatchObject({ navn: 'Drammen', til: 'Asker', tilEnturId: 'NSR:asker' })
    expect(strekningsvalg({ navn: 'Lier–Oslo S' })).toBe('Lier')
    expect(maalnavn({ navn: 'Lier' })).toBe('Oslo S')
  })
  it('fritidsreiser regnes for alle mål etter forholdet til flyplassen', () => {
    const lag = (skjema) => ({ ...standardModell('2026-10-02'), strekninger: [byggStasjon(skjema, 'egen-1')], til: '2026-12-18', fritidsreiser: [{ fra: '2026-10-10', til: '2026-10-11' }] })
    const foer = beregn(lag(drammenTilAsker))
    expect(foer.feil).toBeNull()
    expect(foer.fritid).toMatchObject({ forhold: 'foer', maal: 'Asker' })
    const utenfor = beregn(lag({ ...drammenTilAsker, flyplass: 'utenfor', lufthavn: 120 }))
    expect(utenfor.fritid).toMatchObject({ forhold: 'utenfor', sum: 240 })
    const bak = beregn(lag({ ...drammenTilAsker, flyplass: 'bak', lufthavn: '', tillegg: 60 }))
    expect(bak.fritid.forhold).toBe('bak')
    expect(bak.fritid.reiser.every((r) => r.dekning === 'enkelt' || r.pris === 60)).toBe(true)
  })
})
