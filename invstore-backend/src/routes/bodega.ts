import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const IngresoSchema = z.object({
  itemId:   z.number().int().positive(),
  cantidad: z.number().int().positive(),
})

export default async function bodegaRoutes(app: FastifyInstance) {

  // POST /bodega/ingresar
  app.post('/ingresar', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const body = IngresoSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { itemId, cantidad } = body.data
    const admin = request.user as any

    const item = await prisma.item.findUnique({ where: { id: itemId } })
    if (!item || !item.activo) return reply.status(404).send({ error: 'Insumo no encontrado' })

    await prisma.$transaction([
      prisma.item.update({ where: { id: itemId }, data: { stock: { increment: cantidad } } }),
      prisma.bodegaLog.create({ data: { itemId, userId: admin.id, cantidad } }),
    ])

    const updated = await prisma.item.findUnique({ where: { id: itemId } })
    return reply.send(updated)
  })

  // GET /bodega/log
  app.get('/log', { preHandler: [(app as any).adminOnly] }, async (_request, reply) => {
    const logs = await prisma.bodegaLog.findMany({
      include: {
        item: { select: { id:true, nombre:true, codigo:true, spec:true } },
        user: { select: { id:true, nombre:true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return reply.send(logs)
  })
}
