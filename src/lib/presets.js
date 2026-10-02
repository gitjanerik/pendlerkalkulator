// Voksenpriser hentet fra Vys billettkjøp 2. oktober 2026, alle til Oslo S.
// Enkeltpris er bare med der den er lest av; resten fyller brukeren selv.
// Vy hever prisene 1. februar, så tallene er et utgangspunkt og ingen fasit.
export const PRESET_DATO = '2026-10-02'

export const PRESETS = [
  { id: 'gulskogen', navn: 'Gulskogen–Oslo S', enkelt: 156, perioder: [[7, 827], [30, 2038], [365, 20380]] },
  { id: 'drammen', navn: 'Drammen–Oslo S', enkelt: null, perioder: [[7, 796], [30, 1922], [365, 19220]] },
  { id: 'brakeroya', navn: 'Brakerøya–Oslo S', enkelt: null, perioder: [[7, 774], [30, 1902], [365, 19020]] },
  { id: 'lier', navn: 'Lier–Oslo S', enkelt: null, perioder: [[7, 737], [30, 1774], [365, 17740]] },
  { id: 'asker', navn: 'Asker–Oslo S', enkelt: 75, perioder: [[7, 662], [30, 1556], [365, 17560]] },
]

// Skjemafeltene er tekst-tolerante, så tomme felt er '' og ikke null.
export function strekningFraPreset(preset, id) {
  return {
    id,
    navn: preset.navn,
    bil: false,
    enkelt: preset.enkelt ?? '',
    perioder: preset.perioder.map(([dager, pris]) => ({ dager, pris })),
  }
}
