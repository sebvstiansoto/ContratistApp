import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const CreateSchema = z.object({
  proyecto: z.string().min(1, 'N° Proyecto requerido'),
  plano:    z.string().min(1, 'N° Plano requerido'),
  ficha:    z.string().min(1, 'N° Ficha Contratista requerido'),
  items:    z.array(z.object({
    itemId:   z.number().int().positive(),
    cantidad: z.number().int().positive(),
  })).min(1, 'Debe incluir al menos un insumo'),
})

export default async function solicitudRoutes(app: FastifyInstance) {

  // GET /solicitudes
  app.get('/', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const user  = request.user as any
    const { status, proyecto, page = 1, limit = 100 } = request.query as any

    const where: any = {}
    if (user.role === 'worker') where.userId = user.id   // workers see only their own
    if (status)   where.status   = status
    if (proyecto) where.proyecto = proyecto

    const solicitudes = await prisma.solicitud.findMany({
      where,
      include: {
        user: { select: { id:true, nombre:true, cargo:true, foto:true, role:true } },
        items: {
          include: {
            item: { select: { id:true, nombre:true, codigo:true, spec:true, categoria:true, foto:true,
                              precio: user.role === 'admin' ? true : false } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page)-1) * Number(limit),
      take: Number(limit),
    })

    // Strip precio from items for workers
    if (user.role === 'worker') {
      return reply.send(solicitudes.map(s => ({
        ...s,
        items: s.items.map(si => ({ ...si, precioSnapshot: undefined }))
      })))
    }

    return reply.send(solicitudes)
  })

  // GET /solicitudes/:id
  app.get('/:id', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { id } = request.params as any
    const user   = request.user as any
    const sol = await prisma.solicitud.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { id:true, nombre:true, cargo:true, foto:true } },
        items: { include: { item: true } }
      }
    })
    if (!sol) return reply.status(404).send({ error: 'No encontrada' })
    if (user.role === 'worker' && sol.userId !== user.id)
      return reply.status(403).send({ error: 'Sin permiso' })
    return reply.send(sol)
  })

  // POST /solicitudes
  app.post('/', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const user = request.user as any
    const body = CreateSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { proyecto, plano, ficha, items } = body.data

    // Verify stock and capture precio snapshot
    const itemsWithSnapshot = await Promise.all(items.map(async i => {
      const item = await prisma.item.findUnique({ where: { id: i.itemId } })
      if (!item || !item.activo) throw { status: 400, message: `Insumo ${i.itemId} no encontrado` }
      if (item.stock < i.cantidad) throw { status: 400, message: `Stock insuficiente: ${item.nombre} (disponible: ${item.stock})` }
      return { ...i, precioSnapshot: item.precio ?? null }
    }))

    const sol = await prisma.solicitud.create({
      data: {
        userId: user.id,
        proyecto, plano, ficha,
        items: { create: itemsWithSnapshot.map(i => ({ itemId: i.itemId, cantidad: i.cantidad, precioSnapshot: i.precioSnapshot })) }
      },
      include: {
        user: { select: { id:true, nombre:true, cargo:true } },
        items: { include: { item: { select: { id:true, nombre:true, codigo:true, spec:true, categoria:true } } } }
      }
    })

    return reply.status(201).send(sol)
  })

  // PATCH /solicitudes/:id/aprobar
  app.patch('/:id/aprobar', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const { id }  = request.params as any
    const { force } = request.query as any
    const admin   = request.user as any

    const sol = await prisma.solicitud.findUnique({
      where: { id: Number(id) },
      include: { items: { include: { item: true } } }
    })
    if (!sol)                    return reply.status(404).send({ error: 'No encontrada' })
    if (sol.status !== 'pending') return reply.status(409).send({ error: 'Solo se pueden aprobar solicitudes pendientes' })

    // Duplicate detection
    if (!force) {
      const hoy = new Date(); hoy.setHours(0,0,0,0)
      const itemIds = sol.items.map(si => si.itemId)
      const dupes = await prisma.solicitud.findMany({
        where: {
          id:       { not: sol.id },
          userId:   sol.userId,
          proyecto: sol.proyecto,
          status:   'approved',
          createdAt: { gte: hoy },
          items: { some: { itemId: { in: itemIds } } }
        },
        include: { items: { include: { item: { select: { nombre: true } } } } }
      })
      if (dupes.length > 0) {
        const dupeItems = dupes.flatMap(d => d.items.filter(si => itemIds.includes(si.itemId)).map(si => si.item.nombre))
        return reply.status(409).send({ error: 'Duplicado detectado', duplicados: [...new Set(dupeItems)] })
      }
    }

    // Atomic transaction: verify stock → decrement → create historial → approve
    await prisma.$transaction(async tx => {
      for (const si of sol.items) {
        const item = await tx.item.findUnique({ where: { id: si.itemId } })
        if (!item || item.stock < si.cantidad)
          throw new Error(`Stock insuficiente: ${item?.nombre ?? si.itemId}`)

        await tx.item.update({ where: { id: si.itemId }, data: { stock: { decrement: si.cantidad } } })

        await tx.historial.create({ data: {
          itemId:      si.itemId,
          solicitudId: sol.id,
          userId:      sol.userId,
          cantidad:    si.cantidad,
          precio:      si.precioSnapshot,
          proyecto:    sol.proyecto,
          plano:       sol.plano,
          ficha:       sol.ficha,
        }})
      }

      await tx.solicitud.update({
        where: { id: sol.id },
        data: { status: 'approved', aprobadoPor: admin.id, fechaResolucion: new Date() }
      })
    })

    const updated = await prisma.solicitud.findUnique({
      where: { id: sol.id },
      include: { user: { select: { id:true, nombre:true, cargo:true } }, items: { include: { item: true } } }
    })
    return reply.send(updated)
  })

  // PATCH /solicitudes/:id/rechazar
  app.patch('/:id/rechazar', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const { id } = request.params as any
    const sol = await prisma.solicitud.findUnique({ where: { id: Number(id) } })
    if (!sol) return reply.status(404).send({ error: 'No encontrada' })
    if (sol.status !== 'pending') return reply.status(409).send({ error: 'Solo se pueden rechazar solicitudes pendientes' })

    const updated = await prisma.solicitud.update({
      where: { id: Number(id) },
      data: { status: 'rejected', fechaResolucion: new Date() }
    })
    return reply.send(updated)
  })

  // GET /solicitudes/:id/vale
  app.get('/:id/vale', { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { id } = request.params as any
    const user   = request.user as any
    const sol = await prisma.solicitud.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { id:true, nombre:true, cargo:true, foto:true } },
        items: { include: { item: { select: { id:true, nombre:true, codigo:true, spec:true, categoria:true, foto:true,
                                              precio: user.role === 'admin' ? true : false } } } }
      }
    })
    if (!sol) return reply.status(404).send({ error: 'No encontrado' })
    return reply.send(sol)
  })
}
