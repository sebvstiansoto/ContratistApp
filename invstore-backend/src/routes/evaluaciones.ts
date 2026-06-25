import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const Schema = z.object({
  evaluadoId:  z.string(),
  solicitudId: z.number().int().optional().nullable(),
  rating:      z.number().int().min(1).max(5),
  comment:     z.string().optional().default(''),
  proyecto:    z.string().optional().default(''),
})

export default async function evaluacionRoutes(app: FastifyInstance) {

  app.post('/', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const admin = request.user as any
    const body  = Schema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const ev = await prisma.evaluacion.create({
      data: { ...body.data, evaluadorId: admin.id },
      include: { evaluador: { select: { nombre: true } } }
    })
    return reply.status(201).send(ev)
  })

  app.get('/:userId', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { userId } = request.params as any
    const caller     = request.user as any

    if (caller.role === 'worker' && caller.id !== userId)
      return reply.status(403).send({ error: 'Sin permiso' })

    const evs = await prisma.evaluacion.findMany({
      where: { evaluadoId: userId },
      include: { evaluador: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(evs)
  })
}
