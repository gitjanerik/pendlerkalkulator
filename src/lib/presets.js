// Voksenpriser hentet fra Vys billettkjøp 2. oktober 2026, alle til Oslo S.
// Enkeltprisene til Oslo S er oppgitt av eieren; Asker er lik hos Vy og Ruter.
// Reisetid er omtrent, i minutter til Oslo S (Gulskogen, Drammen, Lier, Heggedal, Røyken og Spikkestad oppgitt av eieren).
// Lufthavn er enkeltbillett hjemstasjon–Oslo lufthavn, oppgitt av eieren oktober 2026.
// Vy hever prisene normalt en gang i året, så tallene er et utgangspunkt og ingen fasit.
export const PRESET_DATO = '2026-10-02'

export const PRESETS = [
  { id: 'gulskogen', navn: 'Gulskogen–Oslo S', reisetid: 40, enkelt: 156, lufthavn: 308, perioder: [[7, 827], [30, 2038], [365, 20380]] },
  { id: 'drammen', navn: 'Drammen–Oslo S', reisetid: 35, enkelt: 151, lufthavn: 298, perioder: [[7, 796], [30, 1922], [365, 19220]] },
  { id: 'brakeroya', navn: 'Brakerøya–Oslo S', reisetid: 32, enkelt: 143, lufthavn: 295, perioder: [[7, 774], [30, 1902], [365, 19020]] },
  { id: 'lier', navn: 'Lier–Oslo S', reisetid: 30, enkelt: 132, lufthavn: 283, perioder: [[7, 737], [30, 1774], [365, 17740]] },
  { id: 'asker', navn: 'Asker–Oslo S', bil: true, ruter: true, reisetid: 20, enkelt: 75, lufthavn: 162, perioder: [[7, 662], [30, 1556], [365, 17560]] },
  { id: 'heggedal', navn: 'Heggedal–Oslo S', ruter: true, reisetid: 45, enkelt: 75, lufthavn: 162, perioder: [[7, 662], [30, 1556], [365, 17560]] },
  { id: 'royken', navn: 'Røyken–Oslo S', reisetid: 50, enkelt: 105, lufthavn: 162, perioder: [[7, 918], [30, 2198], [365, 24980]] },
  { id: 'spikkestad', navn: 'Spikkestad–Oslo S', reisetid: 53, enkelt: 105, lufthavn: 162, perioder: [[7, 918], [30, 2198], [365, 24980]] },
  { id: 'moss', navn: 'Moss–Oslo S', reisetid: 40, enkelt: 202, lufthavn: 349, perioder: [[7, 1007], [30, 2419], [365, 24190]] },
]

// Skjemafeltene er tekst-tolerante, så tomme felt er '' og ikke null.
export function strekningFraPreset(preset, id) {
  return {
    id,
    navn: preset.navn,
    bil: preset.bil ?? false,
    ruter: preset.ruter ?? false,
    enkelt: preset.enkelt ?? '',
    lufthavn: preset.lufthavn ?? '',
    perioder: preset.perioder.map(([dager, pris]) => ({ dager, pris })),
  }
}
