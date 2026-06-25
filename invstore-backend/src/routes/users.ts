import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const CreateSchema = z.object({
  nombre:      z.string().min(1),
  cargo:       z.string().min(1),
  user:        z.string().min(1),
  password:    z.string().min(4),
  role:        z.enum(['admin','worker']).optional().default('worker'),
  especialidad: z.string().optional().default(''),
  rut:         z.string().optional().default(''),
  telefono:    z.string().optional().default(''),
})

const UpdateSchema = z.object({
  nombre:      z.string().min(1).optional(),
  cargo:       z.string().optional(),
  password:    z.string().min(4).optional(),
  especialidad: z.string().optional(),
  rut:         z.string().optional(),
  telefono:    z.string().optional(),
  foto:        z.string().optional().nullable(),
  estado:      z.enum(['active','pause','leave','off']).optional(),
})

export default async function userRoutes(app: FastifyInstance) {

  // GET /users
  app.get('/', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const { role } = request.query as any
    const where: any = { activo: true }
    if (role) where.role = role

    const users = await prisma.user.findMany({
      where,
      include: {
        evaluaciones: { select: { rating:true, comment:true, proyecto:true, createdAt:true, evaluador:{ select:{ nombre:true } } } },
        notas: { select: { id:true, byNombre:true, text:true, createdAt:true } }
      },
      orderBy: { nombre: 'asc' },
    })

    return reply.send(users.map(({ passwordHash, ...u }) => u))
  })

  // GET /users/:id
  app.get('/:id', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { id } = request.params as any
    const caller = request.user as any
    // Workers can only see themselves
    if (caller.role === 'worker' && caller.id !== id)
      return reply.status(403).send({ error: 'Sin permiso' })

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        evaluaciones: { select: { rating:true, comment:true, proyecto:true, createdAt:true, evaluador:{ select:{ nombre:true } } } },
        notas: { select: { id:true, byNombre:true, text:true, createdAt:true } }
      }
    })
    if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' })
    const { passwordHash, ...safe } = user
    return reply.send(safe)
  })

  // POST /users
  app.post('/', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const body = CreateSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { password, ...rest } = body.data
    const passwordHash = await bcrypt.hash(password, 10)

    try {
      const user = await prisma.user.create({ data: { ...rest, passwordHash } })
      const { passwordHash: _ph, ...safe } = user
      return reply.status(201).send(safe)
    } catch (e: any) {
      if (e.code === 'P2002') return reply.status(409).send({ error: 'El usuario ya existe' })
      throw e
    }
  })

  // PUT /users/:id
  app.put('/:id', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { id }   = request.params as any
    const caller   = request.user as any
    // Workers can only update themselves
    if (caller.role === 'worker' && caller.id !== id)
      return reply.status(403).send({ error: 'Sin permiso' })

    const body = UpdateSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { password, ...rest } = body.data as any
    const data: any = { ...rest }
    if (password) data.passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.update({ where: { id }, data })
    const { passwordHash, ...safe } = user
    return reply.send(safe)
  })

  // DELETE /users/:id — soft delete
  app.delete('/:id', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const { id } = request.params as any
    await prisma.user.update({ where: { id }, data: { activo: false } })
    return reply.send({ ok: true })
  })
}
