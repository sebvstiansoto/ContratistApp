import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const ItemSchema = z.object({
  nombre:    z.string().min(1),
  codigo:    z.string().min(1),
  spec:      z.string().optional().default(''),
  categoria: z.string().min(1),
  stock:     z.coerce.number().int().min(0),
  precio:    z.coerce.number().int().positive().optional().nullable(),
  threshold: z.coerce.number().int().min(1).optional().default(5),
  foto:      z.string().optional().nullable(),
})

export default async function itemRoutes(app: FastifyInstance) {

  // GET /items
  app.get('/', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { q, categoria, page = 1, limit = 200 } = request.query as any
    const user = request.user as any

    const where: any = { activo: true }
    if (categoria) where.categoria = categoria
    if (q) where.OR = [
      { nombre:    { contains: q, mode: 'insensitive' } },
      { codigo:    { contains: q, mode: 'insensitive' } },
      { spec:      { contains: q, mode: 'insensitive' } },
    ]

    const items = await prisma.item.findMany({
      where,
      orderBy: { nombre: 'asc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    })

    // Workers do NOT see precio
    if (user.role === 'worker') {
      return reply.send(items.map(({ precio, ...rest }) => rest))
    }

    return reply.send(items)
  })

  // GET /items/low-stock
  app.get('/low-stock', { preHandler: [(app as any).adminOnly] }, async (_request, reply) => {
    const items = await prisma.item.findMany({
      where: { activo: true },
      orderBy: { stock: 'asc' },
    })
    const low = items.filter(i => i.stock <= i.threshold)
    return reply.send(low)
  })

  // GET /items/:id
  app.get('/:id', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { id } = request.params as any
    const item = await prisma.item.findUnique({ where: { id: Number(id) } })
    if (!item || !item.activo) return reply.status(404).send({ error: 'Insumo no encontrado' })
    return reply.send(item)
  })

  // POST /items
  app.post('/', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const body = ItemSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    try {
      const item = await prisma.item.create({ data: body.data })
      return reply.status(201).send(item)
    } catch (e: any) {
      if (e.code === 'P2002') return reply.status(409).send({ error: 'El código ya existe' })
      throw e
    }
  })

  // PUT /items/:id
  app.put('/:id', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const { id } = request.params as any
    const body = ItemSchema.partial().safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    try {
      const item = await prisma.item.update({
        where: { id: Number(id) },
        data: body.data,
      })
      return reply.send(item)
    } catch {
      return reply.status(404).send({ error: 'Insumo no encontrado' })
    }
  })

  // DELETE /items/:id — soft delete
  app.delete('/:id', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const { id } = request.params as any
    await prisma.item.update({ where: { id: Number(id) }, data: { activo: false } })
    return reply.send({ ok: true })
  })
}
