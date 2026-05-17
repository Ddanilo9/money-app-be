import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { syncToSheets } from '../utils/sheetSync.js'

const router = Router()

// =====================
// CONFIG
// =====================
const GROUP_ID = 'casa'

const GROUP_USERS: Record<string, string> = {
  'daniloann@mail.com': 'https://script.google.com/macros/s/AKfycbyBlz1Gz4jxgtLtDdAvgKzMAPW3qi3DPKYi5azmQPleFUTKaCc9xTkbZLHfpQwcdn-ofg/exec',
  'mirandaceb@mail.com': 'https://script.google.com/macros/s/AKfycbzdqRRcpLk2_cIXvASo2b0frAjmvs10yrOor6_0YqhWOxkns2lniPBaGuWOj9TjuDKJ/exec'
}

// =====================
// HELPERS
// =====================
function getUserEmail(req: any): string | null {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return null

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.email ?? null
  } catch {
    return null
  }
}

function syncInBackground(): void {
  (async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('group_id', GROUP_ID)

      if (error) {
        console.error('❌ Sync fetch error:', error)
        return
      }

      await Promise.allSettled(
        Object.entries(GROUP_USERS).map(([email, sheetUrl]) =>
          syncToSheets(data ?? [], email, sheetUrl)
        )
      )

      console.log('✅ Background sync completato')
    } catch (err) {
      console.error('❌ Background sync error:', err)
    }
  })()
}

// =====================
// GET
// =====================
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('group_id', GROUP_ID)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ GET error:', error)
    return res.status(500).json(error)
  }

  syncInBackground()
  res.json(data)
})

// =====================
// POST
// =====================
router.post('/', async (req, res) => {
  const email = getUserEmail(req)

  const { data, error } = await supabase
    .from('expenses')
    .insert([{ ...req.body, paidBy: email, group_id: GROUP_ID }])
    .select()

  if (error) {
    console.error('❌ POST error:', error)
    return res.status(500).json(error)
  }

  syncInBackground()
  res.json(data)
})

// =====================
// PUT
// =====================
router.put('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('expenses')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('group_id', GROUP_ID)
    .select()

  if (error) {
    console.error('❌ PUT error:', error)
    return res.status(500).json(error)
  }

  syncInBackground()
  res.json(data)
})

export default router