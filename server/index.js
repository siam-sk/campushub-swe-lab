/* global process */
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import noticeRoutes from './routes/notices.js'
import facultyRoutes from './routes/faculty.js'
import { connectMongo } from './db/connectMongo.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: clientOrigin }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notices', noticeRoutes)
app.use('/api/faculty', facultyRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'campushub-api' })
})

const startServer = async () => {
  const mongoState = await connectMongo().catch((error) => ({
    connected: false,
    skipped: false,
    reason: error?.message || 'Unexpected startup error',
  }))

  app.listen(port, () => {
    console.log(`CampusHub API running on port ${port}`)

    if (mongoState.connected) {
      console.log('MongoDB connected')
    } else if (mongoState.skipped) {
      console.log(`MongoDB skipped: ${mongoState.reason}`)
    } else {
      console.log(`MongoDB connection failed: ${mongoState.reason}`)
      console.log('Using dashboard fallbacks')
    }
  })
}

startServer()
