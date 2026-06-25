import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'

// Routes
import authRoutes      from './routes/auth.js'
import itemRoutes      from './routes/items.js'
import solicitudRoutes from './routes/solicitudes.js'
import historialRoutes from './routes/historial.js'
import userRoutes      from './routes/users.js'
import bodegaRoutes    from './routes/bodega.js'
import evaluacionRoutes from './routes/evaluaciones.js'
import notaRoutes      from './routes/notas.js'
import iaRoutes        from './routes/ia.js'
import reporteRoutes   from './routes/reportes.js'

const app = Fastify({ logger: process.env.NODE_ENV !== 'production' })

// ── Plugins ──────────────────────────────────
await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(cookie, {
  secret: process.env.JWT_SECRET ?? 'invstore-cookie-secret',
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'invstore-dev-secret-change-in-prod',
  cookie: { cookieName: 'token', signed: false },
})

await app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

// ── Decorators ───────────────────────────────
// Attach user to request after JWT verify
app.decorate('authenticate', async function(request: any, reply: any) {
  try {
    await request.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
})

app.decorate('adminOnly', async function(request: any, reply: any) {
  try {
    await request.jwtVerify()
    if (request.user.role !== 'admin') {
      reply.status(403).send({ error: 'Solo administradores' })
    }
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
})

// ── Routes ───────────────────────────────────
await app.register(authRoutes,       { prefix: '/auth' })
await app.register(itemRoutes,       { prefix: '/items' })
await app.register(solicitudRoutes,  { prefix: '/solicitudes' })
await app.register(historialRoutes,  { prefix: '/historial' })
await app.register(userRoutes,       { prefix: '/users' })
await app.register(bodegaRoutes,     { prefix: '/bodega' })
await app.register(evaluacionRoutes, { prefix: '/evaluaciones' })
await app.register(notaRoutes,       { prefix: '/notas' })
await app.register(iaRoutes,         { prefix: '/ia' })
await app.register(reporteRoutes,    { prefix: '/reportes' })

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Start ────────────────────────────────────
const port = Number(process.env.PORT ?? 3000)
try {
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`🚀 InvStore API running on port ${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
