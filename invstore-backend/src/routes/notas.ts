import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const Schema = z.object({
  userId: z.string(),
  text:   z.string().min(1),
})

export default async function notaRoutes(app: FastifyInstance) {

  app.post('/', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const admin = request.user as any
    const body  = Schema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const nota = await prisma.nota.create({
      data: { ...body.data, byId: admin.id, byNombre: admin.nombre }
    })
    return reply.status(201).send(nota)
  })

  app.delete('/:id', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const { id } = request.params as any
    await prisma.nota.delete({ where: { id: Number(id) } })
    return reply.send({ ok: true })
  })
}
