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

// 🔥 MAPPA UTENTE → GOOGLE SHEET
const userSheets: Record<string, string> = {
  'daniloann@mail.com': 'https://script.google.com/macros/s/AKfycbz9GYOl7aid8H0Erufj7UHEoUnSBHtwjTvRGboXrZoZX5zRGyKDklkduGJqibh50eTxkw/exec',
  'mirandaceb@mail.com': 'https://script.google.com/macros/s/URL_MIRANDA/exec'
}

// =====================
// 🔧 helper sync
// =====================
async function syncGroupExpenses(email: string | null) {
  try {
    if (!email) {
      console.warn('⚠️ Email mancante, skip sync')
      return
    }

    console.log('🔄 Sync group expenses for:', email)

    const { data: allExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', GROUP_ID)

    const sheetUrl = userSheets[email]

    if (!sheetUrl) {
      console.warn('⚠️ Nessun sheet per utente:', email)
      return
    }

    console.log('🌍 Sheet URL:', sheetUrl)

    await syncToSheets(allExpenses || [], email, sheetUrl)

    console.log('✅ Sheets sync done')

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

  // 🔥 SYNC
  if (email) {
    await syncGroupExpenses(email)
  }

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

  if (email) {
    await syncGroupExpenses(email)
  }

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

  if (email) {
    await syncGroupExpenses(email)
  }

  console.log('🟢 ===== END PUT =====\n')

  res.json(data)
})

export default router