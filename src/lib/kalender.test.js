import { describe, it, expect } from 'vitest'
import { byggKalender, reisedager } from './kalender.js'
import { byggTurer } from './turer.js'

const typer = (kal) => Object.fromEntries(kal.map((d) => [d.dato, d.type]))

describe('byggKalender', () => {
  it('mandag–fredag er arbeid, helg er helg', () => {
    const t = typer(byggKalender({ fra: '2026-10-02', til: '2026-10-05' }))
    expect(t).toEqual({
      '2026-10-02': 'arbeid',
      '2026-10-03': 'helg',
      '2026-10-04': 'helg',
      '2026-10-05': 'arbeid',
    })
  })

  it('påskeuka: man–ons er arbeid når bryteren er på, skjærtorsdag og langfredag er fri', () => {
    const t = typer(byggKalender({ fra: '2026-03-30', til: '2026-04-06', innstillinger: { jobberPaaskeMandagOnsdag: true } }))
    expect(t['2026-03-30']).toBe('arbeid')
    expect(t['2026-04-01']).toBe('arbeid')
    expect(t['2026-04-02']).toBe('helligdag')
    expect(t['2026-04-03']).toBe('helligdag')
    expect(t['2026-04-06']).toBe('helligdag')
  })

  it('påske og romjul er fri som standard', () => {
    expect(Object.values(typer(byggKalender({ fra: '2026-03-30', til: '2026-04-01' })))).toEqual(['fri', 'fri', 'fri'])
    expect(Object.values(typer(byggKalender({ fra: '2026-12-28', til: '2026-12-30' })))).toEqual(['fri', 'fri', 'fri'])
  })

  it('påskebryteren av gjør man–ons fri', () => {
    const t = typer(
      byggKalender({
        fra: '2026-03-30',
        til: '2026-04-01',
        innstillinger: { jobberPaaskeMandagOnsdag: false },
      }),
    )
    expect(Object.values(t)).toEqual(['fri', 'fri', 'fri'])
  })

  it('romjul 27.–30.12 følger bryteren, julaften og nyttårsaften er alltid fri', () => {
    const paa = typer(byggKalender({ fra: '2026-12-24', til: '2026-12-31', innstillinger: { jobberRomjul: true } }))
    expect(paa['2026-12-24']).toBe('fri')
    expect(paa['2026-12-25']).toBe('helligdag')
    expect(paa['2026-12-28']).toBe('arbeid')
    expect(paa['2026-12-30']).toBe('arbeid')
    expect(paa['2026-12-31']).toBe('helligdag')

    const av = typer(
      byggKalender({ fra: '2026-12-28', til: '2026-12-30', innstillinger: { jobberRomjul: false } }),
    )
    expect(Object.values(av)).toEqual(['fri', 'fri', 'fri'])
  })

  it('ferie, hjemmekontor og ekstra arbeidsdag overstyrer', () => {
    const t = typer(
      byggKalender({
        fra: '2026-10-05',
        til: '2026-10-11',
        ferie: [{ fra: '2026-10-05', til: '2026-10-06' }],
        hjemmekontor: ['2026-10-07'],
        ekstraArbeidsdager: ['2026-10-10'],
      }),
    )
    expect(t['2026-10-05']).toBe('ferie')
    expect(t['2026-10-07']).toBe('hjemmekontor')
    expect(t['2026-10-08']).toBe('arbeid')
    expect(t['2026-10-10']).toBe('arbeid')
    expect(t['2026-10-11']).toBe('helg')
  })

  it('reisedager er bare arbeidsdager', () => {
    const dager = reisedager(byggKalender({ fra: '2026-10-02', til: '2026-10-05' }))
    expect(dager.map((d) => d.dato)).toEqual(['2026-10-02', '2026-10-05'])
  })
})

describe('byggTurer', () => {
  const dager = [{ dato: '2026-10-02' }, { dato: '2026-10-05' }]

  it('lager morgen- og ettermiddagstur sortert i tid', () => {
    const turer = byggTurer(dager)
    expect(turer.map((t) => `${t.dato} ${t.retning}`)).toEqual([
      '2026-10-02 morgen',
      '2026-10-02 ettermiddag',
      '2026-10-05 morgen',
      '2026-10-05 ettermiddag',
    ])
  })

  it('bil er bare tilgjengelig på angitte dager', () => {
    const turer = byggTurer(dager, { bilDager: new Set(['2026-10-05']) })
    expect(turer.map((t) => t.bil)).toEqual([false, false, true, true])
  })
})
