import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import expensesRoutes from './routes/expenses.js'

const app = express()

app.use(cors())
app.use(bodyParser.json())

app.use('/expenses', expensesRoutes)

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
