import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { syncToSheets } from '../utils/sheetSync.js'

const router = Router()

function getUserEmail(req: any) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return null

  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString()
  )

  return payload.email
}

const GROUP_ID = 'casa'

// 🔥 UTENTI DEL GRUPPO
const users = [
  'daniloann@mail.com',
  'mirandaceb@mail.com'
]

// 🔥 MAPPA UTENTE → GOOGLE SHEET
const userSheets: Record<string, string> = {
  'daniloann@mail.com': 'https://script.google.com/macros/s/AKfycby6QwXUfwht-fBTAK9MIVfJu2FN2TTBwZxVy4OuGggMmwOlKmEASt06A08Kh55HMAwOZA/exec',
  'mirandaceb@mail.com': 'https://script.google.com/macros/s/AKfycbzdqRRcpLk2_cIXvASo2b0frAjmvs10yrOor6_0YqhWOxkns2lniPBaGuWOj9TjuDKJ/exec'
}

// =====================
// 🔧 helper sync (FIX)
// =====================
async function syncGroupExpenses() {
  try {
    console.log('🔄 Sync group expenses for ALL users')

    const { data: allExpenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', GROUP_ID)

    if (error) {
      console.error('❌ Error fetching expenses:', error)
      return
    }

    console.log('📦 ALL EXPENSES:', allExpenses)

    for (const email of users) {
      const sheetUrl = userSheets[email]

      if (!sheetUrl) {
        console.warn('⚠️ Nessun sheet per:', email)
        continue
      }

      console.log('\n👤 Sync per:', email)
      console.log('🌍 Sheet URL:', sheetUrl)

      await syncToSheets(allExpenses || [], email, sheetUrl)
    }

    console.log('\n✅ Sync COMPLETATO per tutti\n')

  } catch (err) {
    console.error('❌ Sheets sync error:', err)
  }
}

// =====================
// GET
// =====================
router.get('/', async (req, res) => {
  console.log('\n🟡 ===== GET /expenses =====')

  const email = getUserEmail(req)
  console.log('👤 USER EMAIL:', email)

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('group_id', GROUP_ID)
    .order('created_at', { ascending: false })

  console.log('📦 SUPABASE DATA:', data)
  console.log('❌ SUPABASE ERROR:', error)

  if (error) {
    return res.status(500).json(error)
  }

  // 🔥 SYNC PER TUTTI
  await syncGroupExpenses()

  console.log('🟢 ===== END GET =====\n')

  res.json(data)
})

// =====================
// POST
// =====================
router.post('/', async (req, res) => {
  console.log('\n🟡 ===== POST /expenses =====')

  const email = getUserEmail(req)
  console.log('👤 USER EMAIL:', email)
  console.log('📥 BODY:', req.body)

  const expense = {
    ...req.body,
    paidBy: email,
    group_id: GROUP_ID
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select()

  console.log('📦 INSERT RESULT:', data)
  console.log('❌ INSERT ERROR:', error)

  if (error) {
    return res.status(500).json(error)
  }

  // 🔥 SYNC PER TUTTI
  await syncGroupExpenses()

  console.log('🟢 ===== END POST =====\n')

  res.json(data)
})

// =====================
// PUT
// =====================
router.put('/:id', async (req, res) => {
  console.log('\n🟡 ===== PUT /expenses =====')

  const id = req.params.id
  const email = getUserEmail(req)

  console.log('👤 USER EMAIL:', email)
  console.log('🆔 ID:', id)
  console.log('📥 BODY:', req.body)

  const { data, error } = await supabase
    .from('expenses')
    .update(req.body)
    .eq('id', id)
    .eq('group_id', GROUP_ID)
    .select()

  console.log('📦 UPDATE RESULT:', data)
  console.log('❌ UPDATE ERROR:', error)

  if (error) {
    return res.status(500).json(error)
  }

  // 🔥 SYNC PER TUTTI
  await syncGroupExpenses()

  console.log('🟢 ===== END PUT =====\n')

  res.json(data)
})

export default router