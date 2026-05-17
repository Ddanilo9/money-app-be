import { categoryRows, monthColumns } from './sheetConfig.js'

// =====================
// CALCOLO TOTALI UTENTE
// =====================
export function calculateUserTotals(
  expenses: any[],
  userEmail: string
): Record<string, number> {
  const result: Record<string, number> = {}

  for (const e of expenses) {
    const cat = e.category?.toLowerCase().trim()
    if (!cat) continue

    let value = 0

    if (e.type === 'personal' && e.paidBy === userEmail) {
      value = e.amount
    } else if (e.type === 'shared') {
      value = e.amount / 2
    }

    result[cat] = (result[cat] ?? 0) + value
  }

  return result
}

// =====================
// SYNC MESE CORRENTE
// =====================
export async function syncToSheets(
  expenses: any[],
  userEmail: string,
  scriptUrl: string
): Promise<void> {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const column = monthColumns[currentMonth]

  // Filtra solo il mese corrente
  const monthExpenses = expenses.filter(e => {
    if (!e.created_at) return false
    const d = new Date(e.created_at)
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth
  })

  const totals = calculateUserTotals(monthExpenses, userEmail)

  console.log(`📊 [${userEmail}] totals:`, totals)

  // Costruisce payload con tutte le categorie (reset a 0 se assenti)
  const payload: Record<string, any> = { _year: currentYear }

  for (const [cat, row] of Object.entries(categoryRows)) {
    payload[`${cat}_${column}`] = {
      cell: `${column}${row}`,
      value: totals[cat] ?? 0
    }
  }

  // Fetch con timeout esplicito
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
   console.log(`🚀 [${userEmail}] starting fetch to Google...`)
const res = await fetch(scriptUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  signal: controller.signal,
  redirect: 'follow'
})
console.log(`📡 [${userEmail}] fetch response status: ${res.status}`)

    const text = await res.text()
    console.log(`✅ [${userEmail}] sheet updated — status ${res.status}:`, text)
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error(`⏱️ [${userEmail}] fetch timeout dopo 8s`)
    } else {
      console.error(`❌ [${userEmail}] fetch error:`, err.message)
    }
  } finally {
    clearTimeout(timeout)
  }
}