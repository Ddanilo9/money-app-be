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
  casa: 36
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

// 🔥 SYNC SHEETS (URL dinamica)
export async function syncToSheets(
  expenses: any[],
  userEmail: string,
  scriptUrl: string
) {
  console.log('\n🚀 ===== SYNC TO SHEETS START =====') // 👈 LOG 10

  const totals = calculateUserTotals(expenses, userEmail)

  console.log('📊 TOTALS RECEIVED:', totals) // 👈 LOG 11

  const payload: any = {}

  const month = new Date().getMonth()
  const column = monthColumns[month]

  console.log('📅 CURRENT MONTH INDEX:', month) // 👈 LOG 12
  console.log('📊 COLUMN SELECTED:', column) // 👈 LOG 13

  if (!column) {
    console.error('❌ Mese fuori range:', month)
    return
  }

  Object.keys(totals).forEach(cat => {
    console.log('🔍 PROCESSING CATEGORY:', cat) // 👈 LOG 14

    const row = categoryRows[cat]
    console.log('📍 ROW FOUND:', row) // 👈 LOG 15

    if (!row) {
      console.warn('⚠️ Categoria non mappata:', cat)
      return
    }

    payload[cat] = {
      cell: `${column}${row}`,
      value: totals[cat]
    }

    console.log('🧱 CELL GENERATED:', payload[cat]) // 👈 LOG 16
  })

  console.log('📤 FINAL PAYLOAD:', payload) // 👈 LOG 17

  if (Object.keys(payload).length === 0) {
    console.warn('⚠️ Nessun dato da inviare a Sheets')
    return
  }

  try {
    console.log('🌍 SCRIPT URL:', scriptUrl) // 👈 LOG 18

    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log('📡 STATUS:', res.status) // 👈 LOG 19

    const text = await res.text()
    console.log('📡 SHEETS RESPONSE:', text) // 👈 LOG 20

  } catch (err) {
    console.error('❌ ERRORE FETCH SHEETS:', err)
  }

  console.log('🏁 ===== SYNC END =====\n') // 👈 LOG 21
}