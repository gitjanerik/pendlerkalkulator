// Faste jobbdager per uke (0 = mandag). Slideren velger et typisk mønster for
// antallet; dagknappene finjusterer. Hjemmekontor er de dagene som ikke er med.
export const MONSTER = {
  1: [2],
  2: [1, 3],
  3: [1, 2, 3],
  4: [0, 1, 2, 3],
  5: [0, 1, 2, 3, 4],
}

export const UKEDAGER_KORT = ['Man', 'Tir', 'Ons', 'Tor', 'Fre']
export const UKEDAGER_LANG = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag']
