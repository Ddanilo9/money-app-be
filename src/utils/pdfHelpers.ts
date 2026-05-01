export function buildUserReport(expenses: any[], userEmail: string) {

  const groupsMap: Record<string, any> = {}
  let total = 0

  const normalizedUser = userEmail.trim().toLowerCase()

  expenses.forEach(e => {

    const paidBy = (e.paidBy || '').trim().toLowerCase()

    // 🔥 filtro robusto
    const isShared = e.type === 'shared'
    const isPersonal = !isShared && paidBy === normalizedUser

    if (!isShared && !isPersonal) return

    const category = e.category || 'vario'

    if (!groupsMap[category]) {
      groupsMap[category] = {
        category,
        expenses: [],
        total: 0
      }
    }

    // 🔥 valore corretto
    const value = isShared ? e.amount / 2 : e.amount

    // 👇 IMPORTANTISSIMO: salviamo il valore calcolato
    groupsMap[category].expenses.push({
      ...e,
      computedAmount: value
    })

    groupsMap[category].total += value
    total += value
  })

  return {
    groups: Object.values(groupsMap),
    total
  }
}