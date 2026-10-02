import { describe, it, expect } from 'vitest'
import { parseIcs, slaaSammenFerie } from './ics.js'

const ics = (...events) =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events.flatMap((e) => ['BEGIN:VEVENT', ...e, 'END:VEVENT']), 'END:VCALENDAR'].join('\r\n')

describe('parseIcs', () => {
  it('heldag har eksklusiv slutt', () => {
    const { hendelser } = parseIcs(
      ics(['DTSTART;VALUE=DATE:20261012', 'DTEND;VALUE=DATE:20261017', 'SUMMARY:Høstferie']),
    )
    expect(hendelser).toEqual([{ fra: '2026-10-12', til: '2026-10-16', navn: 'Høstferie', heldag: true }])
  })

  it('enkelt heldag uten DTEND er én dag', () => {
    const { hendelser } = parseIcs(ics(['DTSTART;VALUE=DATE:20261224', 'SUMMARY:Fri']))
    expect(hendelser[0]).toMatchObject({ fra: '2026-12-24', til: '2026-12-24' })
  })

  it('tidsfestet hendelse er ikke heldag, og midnatt-slutt er eksklusiv', () => {
    const { hendelser } = parseIcs(
      ics(
        ['DTSTART:20261005T090000Z', 'DTEND:20261005T100000Z', 'SUMMARY:Møte'],
        ['DTSTART:20261026T000000', 'DTEND:20261028T000000', 'SUMMARY:Kurs'],
      ),
    )
    expect(hendelser[0]).toMatchObject({ fra: '2026-10-05', til: '2026-10-05', heldag: false })
    expect(hendelser[1]).toMatchObject({ fra: '2026-10-26', til: '2026-10-27' })
  })

  it('brettede linjer, escape og gjentakende hendelser', () => {
    const tekst = ics([
      'DTSTART;VALUE=DATE:20270101',
      'SUMMARY:Nyttår\\, fri og',
      ' lang tekst',
      'RRULE:FREQ=YEARLY',
    ])
    const r = parseIcs(tekst)
    expect(r.hendelser[0].navn).toBe('Nyttår, fri oglang tekst')
    expect(r.gjentakende).toBe(1)
  })

  it('ignorerer søppel og tomme filer', () => {
    expect(parseIcs('hei')).toEqual({ hendelser: [], gjentakende: 0 })
  })
})

describe('slaaSammenFerie', () => {
  it('slår sammen overlapp og tilstøtende, og dropper ugyldige', () => {
    expect(
      slaaSammenFerie([
        { fra: '2026-10-12', til: '2026-10-14' },
        { fra: '2026-10-15', til: '2026-10-16' },
        { fra: '2026-10-13', til: '2026-10-13' },
        { fra: '2026-12-01', til: '2026-11-01' },
        { fra: '2026-12-21', til: '2026-12-23' },
      ]),
    ).toEqual([
      { fra: '2026-10-12', til: '2026-10-16' },
      { fra: '2026-12-21', til: '2026-12-23' },
    ])
  })
})
