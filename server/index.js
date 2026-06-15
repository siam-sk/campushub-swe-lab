/* global process */
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import noticeRoutes from './routes/notices.js'
import facultyRoutes from './routes/faculty.js'
import messageRoutes from './routes/messages.js'
import settingsRoutes from './routes/settings.js'
import testRoutes from './routes/tests.js'
import profileRoutes from './routes/profile.js'
import adminRoutes from './routes/admin.js'
import { connectMongo } from './db/connectMongo.js'
import coursesHandler from '../api/courses/index.js'
import assignmentsHandler from '../api/assignments/index.js'
import attendanceHandler from '../api/attendance/index.js'
import resultsHandler from '../api/results/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

const app = express()
const port = process.env.PORT || 5000
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: clientOrigin }))
app.use(express.json())

const serverlessAdapter = (handler) => async (req, res) => {
  try {
    await handler(req, res)
  } catch (error) {
    console.error('Serverless route failed:', error)
    res.status(500).json({ message: 'Internal Server Error', error: error.message })
  }
}

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notices', noticeRoutes)
app.use('/api/faculty', facultyRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/tests', testRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/admin', adminRoutes)

app.all('/api/courses', serverlessAdapter(coursesHandler))
app.all('/api/courses/:id/students', serverlessAdapter(coursesHandler))
app.all('/api/courses/:id/results', serverlessAdapter(coursesHandler))
app.all('/api/assignments', serverlessAdapter(assignmentsHandler))
app.all('/api/assignments/:id', serverlessAdapter(assignmentsHandler))
app.all('/api/assignments/:id/submissions', serverlessAdapter(assignmentsHandler))
app.all('/api/assignments/submissions/:submissionId', serverlessAdapter(assignmentsHandler))
app.all('/api/assignments/submit', serverlessAdapter(assignmentsHandler))
app.all('/api/attendance', serverlessAdapter(attendanceHandler))
app.all('/api/results', serverlessAdapter(resultsHandler))
app.all('/api/results/publish', serverlessAdapter(resultsHandler))

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
