import nodemailer from 'nodemailer'

export async function sendMail(to: string, filePath: string) {
  try {
    console.log('\n📬 ===== SEND MAIL START =====')

    console.log('📧 TO:', to)
    console.log('📎 FILE PATH:', filePath)
    console.log('👤 USER:', process.env.MAIL_USER)
    console.log('🔑 PASS PRESENT:', !!process.env.MAIL_PASS)

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    })

    console.log('🚚 Transporter creato')

    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject: 'Test PDF',
      text: 'Ecco il tuo report',
      attachments: [
        {
          filename: 'report.pdf',
          path: filePath
        }
      ]
    })

    console.log('✅ MAIL INVIATA')
    console.log('📨 MESSAGE ID:', info.messageId)

    console.log('🏁 ===== SEND MAIL END =====\n')

  } catch (err) {
    console.error('💥 ERRORE SEND MAIL:', err)
  }
}