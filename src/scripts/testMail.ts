import dotenv from 'dotenv'
dotenv.config()

import { sendMail } from '../utils/mailer.js'
import { generatePdf } from '../utils/pdfGenerator.js'
import { buildUserReport } from '../utils/pdfHelpers.js'
import { supabase } from '../lib/supabase.js'

// ✅ mapping dbEmail (per filtrare) → sendTo (per inviare)
const users = [
  {
    dbEmail: 'daniloann@mail.com',
    sendTo: 'samueletooooo@gmail.com'
  },
  {
    dbEmail: 'mirandaceb@mail.com',
    sendTo: 'mirandaceballos15@gmail.com'
  }
]

;(async () => {
  try {
    console.log('🚀 TEST MAIL SCRIPT START')

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')

    if (error) {
      console.error('💥 ERRORE SUPABASE:', error)
      process.exit(1)
    }

    console.log('📦 SPESE TOTALI:', expenses?.length || 0)

    const now = new Date()

    for (const user of users) {
      console.log('\n👤 DB EMAIL:', user.dbEmail)
      console.log('📧 SEND TO:', user.sendTo)

      const safeEmail = user.dbEmail.replace(/[@.]/g, '_')
      const filePath = `./report-${safeEmail}-${Date.now()}.pdf`

      // ✅ filtro con dbEmail (quella nel DB)
      const userExpenses = (expenses || []).filter(e => {
        if (!e.created_at) return false

        const d = new Date(e.created_at)
        const sameMonth =
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()

        if (!sameMonth) return false

        return e.paidBy === user.dbEmail || e.type === 'shared'
      })

      console.log('📊 SPESE UTENTE:', userExpenses.length)

      if (userExpenses.length === 0) {
        console.log('⚠️ Nessuna spesa → skip utente')
        continue
      }

      // ✅ report con dbEmail (per i calcoli)
      const report = buildUserReport(userExpenses, user.dbEmail)
      console.log('💰 Totale report:', report.total)

      await generatePdf(filePath, report, user.dbEmail)
      console.log('✅ PDF GENERATO:', filePath)

      // ✅ mail inviata a sendTo
      await sendMail(user.sendTo, filePath)
      console.log('✅ MAIL INVIATA A:', user.sendTo)
    }

    console.log('\n🎉 TUTTE LE MAIL INVIATE CORRETTAMENTE')
    process.exit(0)

  } catch (err) {
    console.error('💥 ERRORE GENERALE:', err)
    process.exit(1)
  }
})()