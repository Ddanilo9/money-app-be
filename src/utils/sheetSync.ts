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

  expenses.forEach(e => {
    const cat = e.category?.toLowerCase().trim()
    if (!cat) return

    const current = result[cat] ?? 0

    let value = 0

    if (e.type === 'personal' && e.paidBy === userEmail) {
      value = e.amount
    }

    if (e.type === 'shared') {
      value = e.amount / 2
    }

    result[cat] = current + value
  })

  return result
}

// 🔥 SYNC SHEETS (URL dinamica)
export async function syncToSheets(
  expenses: any[],
  userEmail: string,
  scriptUrl: string // 👈 NUOVO
) {
  const totals = calculateUserTotals(expenses, userEmail)

  const payload: any = {}

  const month = new Date().getMonth()
  const column = monthColumns[month]

  if (!column) {
    console.error('❌ Mese fuori range:', month)
    return
  }

  Object.keys(totals).forEach(cat => {
    const row = categoryRows[cat]

    if (!row) {
      console.warn('⚠️ Categoria non mappata:', cat)
      return
    }

    payload[cat] = {
      cell: `${column}${row}`,
      value: totals[cat]
    }
  })

  console.log('📤 SEND TO SHEETS:', payload)

  if (Object.keys(payload).length === 0) {
    console.warn('⚠️ Nessun dato da inviare a Sheets')
    return
  }

  try {
    const res = await fetch(scriptUrl, { // 👈 USA URL DINAMICA
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const text = await res.text()
    console.log('📡 SHEETS RESPONSE:', text)
  } catch (err) {
    console.error('❌ ERRORE FETCH SHEETS:', err)
  }
}