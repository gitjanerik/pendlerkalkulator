// Sammenlikner våre utregnede helligdager med date.nager.at. Krever nett; kjøres i CI.
import { norskeHelligdager } from '../src/lib/helligdager.js'

const aar = new Date().getFullYear()
let avvik = 0

for (const a of [aar, aar + 1]) {
  const svar = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${a}/NO`)
  if (!svar.ok) throw new Error(`Nager svarte ${svar.status} for ${a}`)
  // Nager tar også med merkedager som ikke er fridager (Julaften, Nyttårsaften, Palmesøndag …).
  const ekstern = new Set((await svar.json()).filter((d) => d.global && d.types?.includes('Public')).map((d) => d.date))
  const var_ = new Set(Object.keys(norskeHelligdager(a)))
  for (const d of var_) if (!ekstern.has(d)) (avvik++, console.log(`${a}: ${d} finnes hos oss, ikke hos Nager`))
  for (const d of ekstern) if (!var_.has(d)) (avvik++, console.log(`${a}: ${d} finnes hos Nager, ikke hos oss`))
  console.log(`${a}: ${var_.size} dager sjekket`)
}
process.exit(avvik ? 1 : 0)
