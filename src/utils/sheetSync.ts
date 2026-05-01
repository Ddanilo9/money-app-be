// ✅ TUTTI I MESI
const monthColumns = [
  'B','C','D','E','F','G','H','I','J','K','L','M'
]

// ✅ mapping categorie → righe
const categoryRows: Record<string, number> = {
  affitto: 26,
  spesa: 28,
  tel: 30,
  health: 32,
  entertainment: 34,
  casa: 36,
  trasporti: 38
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
  console.log('\n🚀 ===== SYNC TO SHEETS START =====')

  // Raggruppa le spese per anno → mese
  const byYearMonth: Record<number, Record<number, any[]>> = {}

  expenses.forEach(e => {
    if (!e.created_at) {
      console.warn('⚠️ created_at mancante, skip:', e)
      return
    }
    const normalized = String(e.created_at).replace(' ', 'T').replace(/\+00$/, '+00:00')
    const d = new Date(normalized)
    if (isNaN(d.getTime())) {
      console.warn('⚠️ Data non valida:', e.created_at)
      return
    }
    const year = d.getFullYear()
    const month = d.getMonth()
    if (!byYearMonth[year]) byYearMonth[year] = {}
    if (!byYearMonth[year][month]) byYearMonth[year][month] = []
    byYearMonth[year][month].push(e)
  })

  console.log('📅 ANNI TROVATI:', Object.keys(byYearMonth))

  // Per ogni anno, costruisce un payload e manda una richiesta
  for (const [yearStr, monthMap] of Object.entries(byYearMonth)) {
    const year = Number(yearStr)
    const payload: Record<string, any> = { _year: year }

    for (const [monthStr, monthExpenses] of Object.entries(monthMap)) {
      const month = Number(monthStr)
      const column = monthColumns[month]

      if (!column) {
        console.error('❌ Mese fuori range:', month)
        continue
      }

      const totals = calculateUserTotals(monthExpenses, userEmail)

      Object.keys(totals).forEach(cat => {
        const row = categoryRows[cat]
        if (!row) {
          console.warn('⚠️ Categoria non mappata:', cat)
          return
        }
        payload[`${cat}_${column}`] = {
          cell: `${column}${row}`,
          value: totals[cat] ?? 0
        }
        console.log(`🧱 [${year}] CELL:`, `${cat}_${column}`, payload[`${cat}_${column}`])
      })
    }

    if (Object.keys(payload).length <= 1) {
      console.warn(`⚠️ Nessun dato per anno ${year}`)
      continue
    }

    console.log(`📤 SEND TO SHEETS [${year}]:`, payload)

    try {
      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log(`📡 STATUS [${year}]:`, res.status)
      const text = await res.text()
      console.log(`📡 SHEETS RESPONSE [${year}]:`, text)
    } catch (err) {
      console.error(`❌ ERRORE FETCH SHEETS [${year}]:`, err)
    }
  }

  console.log('🏁 ===== SYNC END =====\n')
}