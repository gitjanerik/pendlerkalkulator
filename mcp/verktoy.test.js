import { describe, it, expect } from 'vitest'
import { beregnBilletter, forslag, helligdager, lesIcs } from './verktoy.js'

describe('MCP-verktøy', () => {
  it('beregn_billetter gir handoff-resultatet', () => {
    const r = beregnBilletter({
      fra: '2026-10-02',
      til: '2026-12-18',
      fraKlokke: '16:00',
      inkluderAarskort: false,
      strekninger: [
        { navn: 'Gulskogen–Oslo S', enkelt: 156, perioder: [{ dager: 7, pris: 827 }, { dager: 30, pris: 2038 }] },
      ],
    })
    expect(r.kostnad).toBe(5027)
    expect(r.billetter.map((b) => b.dager)).toEqual([30, 30, 30])
  })

  it('gir feilmelding for ugyldig periode', () => {
    const r = beregnBilletter({ fra: '2026-12-01', til: '2026-10-01', strekninger: [{ navn: 'x', enkelt: 10, perioder: [] }] })
    expect(r.feil).toMatch(/før startdatoen/)
  })

  it('forslag, helligdager og ICS', () => {
    expect(forslag().strekninger).toHaveLength(8)
    expect(helligdager({ aar: 2026 }).paaskeukeMandagOnsdag).toEqual(['2026-03-30', '2026-03-31', '2026-04-01'])
    const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261221\r\nDTEND;VALUE=DATE:20261224\r\nSUMMARY:Ferie\r\nEND:VEVENT\r\nEND:VCALENDAR'
    expect(lesIcs({ tekst: ics }).ferie).toEqual([{ fra: '2026-12-21', til: '2026-12-23' }])
  })
})
