import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import expensesRoutes from './routes/expenses.js'
import { startMonthlyReportJob } from './jobs/monthlyReport.js'

const app = express()

// middleware
app.use(cors())
app.use(bodyParser.json())

// routes
app.use('/expenses', expensesRoutes)

const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})

// 🔥 cron (automatico, NON blocca server)
startMonthlyReportJob()