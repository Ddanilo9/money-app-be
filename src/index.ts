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

// start server
app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000')
})

// 🔥 cron (automatico, NON blocca server)
startMonthlyReportJob()