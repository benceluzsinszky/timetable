import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { createContext } from './trpc/context.js'
import { appRouter } from './trpc/router.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveClientDist(): string | null {
  const candidates = [
    process.env.CLIENT_DIST,
    path.resolve(__dirname, '../client-dist'),
    path.resolve(__dirname, '../../client/dist'),
  ]

  for (const candidate of candidates) {
    if (candidate && existsSync(path.join(candidate, 'index.html'))) {
      return candidate
    }
  }

  return null
}

const app = express()
const port = Number(process.env.PORT) || 3001
const clientDist = resolveClientDist()

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

if (clientDist) {
  app.use(express.static(clientDist))

  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/trpc')) {
      next()
      return
    }

    res.sendFile(path.join(clientDist, 'index.html'), (error) => {
      if (error) next(error)
    })
  })
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
  if (clientDist) {
    console.log(`Serving client from ${clientDist}`)
  }
})
