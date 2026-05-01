import cron from 'node-cron'
import path from 'path'
import { supabase } from '../lib/supabase.js'
import { generatePdf } from '../utils/pdfGenerator.js'
import { sendMail } from '../utils/mailer.js'
import { buildUserReport } from '../utils/pdfHelpers.js'

// 🔥 mapping DB → email invio
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

export function startMonthlyReportJob() {
  cron.schedule('0 23 28-31 * *', async () => {
    console.log('\n🕒 CRON START')

    try {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      console.log('📅 Oggi:', today.toISOString())

      // 👉 solo ultimo giorno del mese
      if (tomorrow.getMonth() === today.getMonth()) {
        console.log('⏭️ Non è fine mese, skip\n')
        return
      }

      console.log('🔥 ULTIMO GIORNO DEL MESE → GENERO REPORT')

      // 📦 fetch spese
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')

      if (error) {
        console.error('❌ ERRORE FETCH EXPENSES:', error)
        return
      }

      console.log('📦 Totale spese:', expenses?.length)

      // 🔁 loop utenti
      for (const user of users) {
        console.log('\n👤 USER DB:', user.dbEmail)
        console.log('📧 SEND TO:', user.sendTo)

        const filePath = path.join(
          process.cwd(),
          `report-${user.dbEmail.replace(/[@.]/g, '_')}.pdf`
        )

        console.log('📄 FILE PATH:', filePath)

        // 🔥 filtro IDENTICO al frontend + FIX robusto email
        const userExpenses = (expenses || []).filter(e => {
          if (!e.created_at) return false

          const d = new Date(e.created_at)

          const sameMonth =
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()

          if (!sameMonth) return false

          const paidBy = (e.paidBy || '').trim().toLowerCase()
          const userEmail = user.dbEmail.trim().toLowerCase()

          // debug utile
          console.log('🔎 CHECK', {
            name: e.name,
            type: e.type,
            paidBy,
            userEmail
          })

          if (e.type === 'shared') return true

          return paidBy === userEmail
        })

        console.log('📊 SPESE UTENTE:', userExpenses.length)

        // 🔥 DEBUG HARD (così vedi cosa entra davvero)
        console.log('🧪 USER EXPENSES:', userExpenses)

        if (userExpenses.length === 0) {
          console.log('⚠️ Nessuna spesa → skip')
          continue
        }

        // 🧾 build report
        const report = buildUserReport(userExpenses, user.dbEmail)

        console.log('🧾 REPORT:', {
          groups: report.groups.length,
          total: report.total
        })

        // 📄 PDF
        await generatePdf(filePath, report, user.dbEmail)
        console.log('📄 PDF GENERATO')

        // 📧 MAIL
        await sendMail(user.sendTo, filePath)
        console.log('📨 MAIL INVIATA A:', user.sendTo)
      }

      console.log('\n✅ TUTTI I REPORT INVIATI\n')

    } catch (err) {
      console.error('💥 ERRORE CRON:', err)
    }
  })
}