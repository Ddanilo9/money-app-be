import PDFDocument from 'pdfkit'
import fs from 'fs'

export async function generatePdf(filePath: string, report: any, userEmail: string) {
  return new Promise<void>((resolve, reject) => {

    const doc = new PDFDocument({ margin: 40 })
    const stream = fs.createWriteStream(filePath)

    doc.pipe(stream)

    let y = 40

    // 🧾 HEADER
    doc.fontSize(18).text('Report Spese', { align: 'center' })

    y += 25

    const month = new Date().toLocaleString('it-IT', {
      month: 'long',
      year: 'numeric'
    })

    doc.fontSize(12).text(`${userEmail} • ${month}`, { align: 'center' })

    y += 20

    doc.moveTo(40, y).lineTo(550, y).stroke()

    y += 20

    // 📦 GROUPS
    report.groups.forEach((group: any) => {

      // Categoria
      doc.fontSize(13).text(group.category.toUpperCase(), 40, y)
      y += 15

      doc.fontSize(11)

      group.expenses.forEach((e: any) => {

        const typeLabel = e.type === 'shared' ? '(C)' : '(P)'

        // 🔥 VALORE CORRETTO (FIX BUG)
        const value =
          e.type === 'shared'
            ? e.amount / 2
            : e.amount

        doc.text(`• ${e.name} ${typeLabel}`, 45, y)

        doc.text(`€${value.toFixed(2)}`, 500, y, {
          width: 50,
          align: 'right'
        })

        y += 15
      })

      // Totale categoria
      y += 5
      doc.fillColor('grey')

      doc.text(
        `Totale categoria: €${group.total.toFixed(2)}`,
        40,
        y,
        { align: 'right' }
      )

      doc.fillColor('black')

      y += 20
    })

    // 📊 TOTALE GENERALE
    doc.moveTo(40, y).lineTo(550, y).stroke()

    y += 20

    doc.fontSize(14).text(
      `Totale generale: €${report.total.toFixed(2)}`,
      40,
      y,
      { align: 'right' }
    )

    doc.end()

    stream.on('finish', () => resolve())
    stream.on('error', reject)
  })
}