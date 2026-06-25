import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const LoginSchema = z.object({
  user:     z.string().min(1),
  password: z.string().min(1),
})

export default async function authRoutes(app: FastifyInstance) {

  // POST /auth/login
  app.post('/login', async (request, reply) => {
    const body = LoginSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Datos inválidos' })

    const { user: username, password } = body.data

    const user = await prisma.user.findUnique({
      where: { user: username },
      include: { evaluaciones: { select: { rating:true, comment:true, proyecto:true, createdAt:true } }, notas: true }
    })

    if (!user || !user.activo) return reply.status(401).send({ error: 'Credenciales incorrectas' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Credenciales incorrectas' })

    const token = app.jwt.sign(
      { id: user.id, role: user.role, nombre: user.nombre },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' }
    )

    reply.setCookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 8 * 60 * 60,
    })

    const { passwordHash, ...safeUser } = user
    return reply.send({ user: safeUser })
  })

  // POST /auth/logout
  app.post('/logout', async (_request, reply) => {
    reply.clearCookie('token', { path: '/' })
    return reply.send({ ok: true })
  })

  // GET /auth/me
  app.get('/me', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { id } = (request.user as any)
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        evaluaciones: { select: { rating:true, comment:true, proyecto:true, createdAt:true, evaluador:{ select:{ nombre:true } } } },
        notas: { select: { id:true, byNombre:true, text:true, createdAt:true } }
      }
    })
    if (!user || !user.activo) return reply.status(401).send({ error: 'Usuario no encontrado' })
    const { passwordHash, ...safeUser } = user
    return reply.send(safeUser)
  })
}
