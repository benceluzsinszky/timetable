import cors from 'cors'
import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { createContext } from './trpc/context.js'
import { appRouter } from './trpc/router.js'

const app = express()
const port = Number(process.env.PORT) || 3001

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
)

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
)

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
