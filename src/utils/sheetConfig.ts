// utils/sheetConfig.ts

export const monthColumns = [
  'B','C','D','E','F','G','H','I','J','K','L','M'
]

export const categoryRows: Record<string, number> = {
  // CASA
  mutuo: 30,
  affitto: 31,
  utenza: 32,
  rate: 33,
  'oggetti casa': 34,
  assicurazioni: 35,
  // TRASPORTI
  'metro/bus': 38,
  benzina: 39,
  // SPESA DAILY
  supermercato: 42,
  'cene/uscite': 43,
  vario: 44,
  'shopping vestiti': 45,
  cosmetica: 46,
  // ENTERTAINMENT
  entertainment: 49,
  // HEALTH
  palestra: 52,
  salute: 53,
  psicologo: 54,
  // HOLIDAYS
  roadtrip: 57,
  vacanze: 58,
  // TASSE
  commercialista: 61,
  'tax autonomo': 62,
  'gastos autonomo': 63,
  'tax varie': 64
}