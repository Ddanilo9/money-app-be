// ✅ TUTTI I MESI
const monthColumns = [
  'B','C','D','E','F','G','H','I','J','K','L','M'
]

// ✅ mapping categorie → righe
const categoryRows: Record<string, number> = {
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

// 🔥 CALCOLO
export function calculateUserTotals(expenses: any[], userEmail: string) {
  const result: Record<string, number> = {}

  console.log('📦 ALL EXPENSES:', expenses) // 👈 LOG 1
  console.log('👤 USER EMAIL:', userEmail) // 👈 LOG 2

  expenses.forEach(e => {
    console.log('➡️ EXPENSE RAW:', e) // 👈 LOG 3

    const cat = e.category?.toLowerCase().trim()
    console.log('🏷️ CATEGORY NORMALIZED:', cat) // 👈 LOG 4

    if (!cat) {
      console.warn('⚠️ Categoria vuota, skip')
      return
    }

    const current = result[cat] ?? 0

    let value = 0

    if (e.type === 'personal' && e.paidBy === userEmail) {
      value = e.amount
      console.log('💰 PERSONAL EXPENSE:', value) // 👈 LOG 5
    }

    if (e.type === 'shared') {
      value = e.amount / 2
      console.log('🤝 SHARED EXPENSE (half):', value) // 👈 LOG 6
    }

    if (value === 0) {
      console.warn('⚠️ VALUE = 0 → controlla type o paidBy') // 👈 LOG 7
    }

    result[cat] = current + value

    console.log('➕ UPDATED TOTAL:', cat, result[cat]) // 👈 LOG 8
  })

  console.log('📊 FINAL TOTALS:', result) // 👈 LOG 9

  return result
}

// 🔥 SYNC SHEETS — una richiesta per anno, con tutte le celle dei mesi di quell'anno
export async function syncToSheets(
  expenses: any[],
  userEmail: string,
  scriptUrl: string
) {
  console.log('\n🚀 ===== SYNC CURRENT MONTH =====')

  const ALL_CATEGORIES = Object.keys(categoryRows)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const column = monthColumns[currentMonth]

  console.log('📅 Sync mese:', currentYear, currentMonth)

  // 🔥 FILTRA SOLO MESE CORRENTE
  const monthExpenses = expenses.filter(e => {
    if (!e.created_at) return false

    const d = new Date(e.created_at)

    return (
      d.getFullYear() === currentYear &&
      d.getMonth() === currentMonth
    )
  })

  console.log('📦 EXPENSES MESE:', monthExpenses)

  const totals = calculateUserTotals(monthExpenses, userEmail)

  console.log('📊 TOTALS:', totals)

  const payload: Record<string, any> = {
    _year: currentYear
  }

  // 🔥 SCRIVI TUTTE LE CATEGORIE (anche 0)
  ALL_CATEGORIES.forEach(cat => {
    const row = categoryRows[cat]
    if (!row) return

    const value = totals[cat] ?? 0

    payload[`${cat}_${column}`] = {
      cell: `${column}${row}`,
      value
    }

    if (!totals[cat]) {
      console.log(`🧹 RESET ${cat} → 0`)
    } else {
      console.log(`✅ SET ${cat} → ${value}`)
    }
  })

  console.log('📤 SEND TO SHEETS:', payload)

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    console.log('📡 STATUS:', res.status)
    const text = await res.text()
    console.log('📡 RESPONSE:', text)

  } catch (err) {
    console.error('❌ ERRORE FETCH:', err)
  }

  console.log('🏁 ===== END SYNC =====\n')
}