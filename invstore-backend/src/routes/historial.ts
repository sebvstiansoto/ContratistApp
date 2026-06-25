import type { FastifyInstance } from 'fastify'
import { prisma } from '../prisma.js'

export default async function historialRoutes(app: FastifyInstance) {

  // GET /historial
  app.get('/', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const { q, categoria, proyecto, plano, desde, hasta, page = 1, limit = 100 } = request.query as any

    const where: any = {}
    if (proyecto) where.proyecto = { contains: proyecto, mode: 'insensitive' }
    if (plano)    where.plano    = { contains: plano,    mode: 'insensitive' }
    if (desde || hasta) where.createdAt = {}
    if (desde) where.createdAt.gte = new Date(desde)
    if (hasta) where.createdAt.lte = new Date(hasta)
    if (categoria) where.item = { categoria }
    if (q) where.OR = [
      { item: { nombre:   { contains: q, mode: 'insensitive' } } },
      { item: { codigo:   { contains: q, mode: 'insensitive' } } },
      { proyecto: { contains: q, mode: 'insensitive' } },
      { plano:    { contains: q, mode: 'insensitive' } },
    ]

    const movimientos = await prisma.historial.findMany({
      where,
      include: {
        item: { select: { id:true, nombre:true, codigo:true, spec:true, categoria:true, foto:true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page)-1) * Number(limit),
      take: Number(limit),
    })

    // Attach user info
    const userIds = [...new Set(movimientos.map(m => m.userId))]
    const users   = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id:true, nombre:true, cargo:true } })
    const userMap = Object.fromEntries(users.map(u => [u.id, u]))

    return reply.send(movimientos.map(m => ({ ...m, user: userMap[m.userId] ?? null })))
  })

  // GET /historial/export  — returns CSV
  app.get('/export', { preHandler: [(app as any).adminOnly] }, async (_request, reply) => {
    const movimientos = await prisma.historial.findMany({
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    })
    const userIds = [...new Set(movimientos.map(m => m.userId))]
    const users   = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id:true, nombre:true } })
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]))

    const bom = '\uFEFF'
    const header = 'Fecha,Insumo,Codigo,Categoria,Cantidad,Precio Unit.,Subtotal,Trabajador,Proyecto,Plano,Ficha,Vale'
    const rows = movimientos.map(m => {
      const sub = m.precio ? m.precio * m.cantidad : ''
      return [
        new Date(m.createdAt).toLocaleDateString('es-CL'),
        m.item?.nombre ?? '',
        m.item?.codigo ?? '',
        m.item?.categoria ?? '',
        m.cantidad,
        m.precio ?? '',
        sub,
        userMap[m.userId] ?? '',
        m.proyecto, m.plano, m.ficha,
        `#${String(m.solicitudId).padStart(4,'0')}`,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })

    const csv = bom + [header, ...rows].join('\r\n')
    reply.header('Content-Type', 'text/csv; charset=utf-8')
    reply.header('Content-Disposition', `attachment; filename="historial_${new Date().toISOString().slice(0,10)}.csv"`)
    return reply.send(csv)
  })

  // GET /historial/stats
  app.get('/stats', { preHandler: [(app as any).adminOnly] }, async (_request, reply) => {
    const movimientos = await prisma.historial.findMany({ include: { item: true } })
    const userIds = [...new Set(movimientos.map(m => m.userId))]
    const users   = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id:true, nombre:true } })
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]))

    const byCat: Record<string, number>    = {}
    const byUser: Record<string, number>   = {}
    const byProj: Record<string, number>   = {}

    for (const m of movimientos) {
      const cat  = m.item?.categoria ?? 'Otro'
      const user = userMap[m.userId] ?? m.userId
      const proj = m.proyecto
      byCat[cat]  = (byCat[cat]  ?? 0) + m.cantidad
      byUser[user] = (byUser[user] ?? 0) + m.cantidad
      byProj[proj] = (byProj[proj] ?? 0) + m.cantidad
    }

    return reply.send({ byCat, byUser, byProj })
  })
}
