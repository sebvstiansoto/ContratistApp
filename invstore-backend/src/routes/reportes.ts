import type { FastifyInstance } from 'fastify'
import { prisma } from '../prisma.js'

export default async function reporteRoutes(app: FastifyInstance) {

  // GET /reportes/mensual?mes=MM/YYYY
  app.get('/mensual', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const { mes } = request.query as any

    let dateFilter: any = {}
    if (mes) {
      const [mm, yyyy] = mes.split('/')
      const desde = new Date(Number(yyyy), Number(mm)-1, 1)
      const hasta = new Date(Number(yyyy), Number(mm), 0, 23, 59, 59)
      dateFilter = { createdAt: { gte: desde, lte: hasta } }
    }

    const [solicitudes, historial] = await Promise.all([
      prisma.solicitud.findMany({ where: dateFilter, include: { items: true } }),
      prisma.historial.findMany({ where: dateFilter, include: { item: { select: { categoria: true } } } }),
    ])

    const userIds  = [...new Set(historial.map(h => h.userId))]
    const users    = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id:true, nombre:true } })
    const userMap  = Object.fromEntries(users.map(u => [u.id, u.nombre]))

    const aprobadas  = solicitudes.filter(s => s.status === 'approved').length
    const pendientes = solicitudes.filter(s => s.status === 'pending').length
    const totalUnidades = historial.reduce((a, h) => a + h.cantidad, 0)

    // Group by category
    const catMap: Record<string, number> = {}
    for (const h of historial) {
      const cat = h.item?.categoria ?? 'Otro'
      catMap[cat] = (catMap[cat] ?? 0) + h.cantidad
    }
    const porCategoria = Object.entries(catMap)
      .map(([categoria, qty]) => ({ categoria, qty }))
      .sort((a,b) => b.qty - a.qty)

    // Group by worker
    const workerMap: Record<string, number> = {}
    for (const h of historial) {
      const n = userMap[h.userId] ?? h.userId
      workerMap[n] = (workerMap[n] ?? 0) + h.cantidad
    }
    const porTrabajador = Object.entries(workerMap)
      .map(([nombre, unidades]) => ({ nombre, unidades }))
      .sort((a,b) => b.unidades - a.unidades)

    // Group by project
    const projMap: Record<string, number> = {}
    for (const h of historial) {
      projMap[h.proyecto] = (projMap[h.proyecto] ?? 0) + h.cantidad
    }
    const porProyecto = Object.entries(projMap)
      .map(([proyecto, unidades]) => ({ proyecto, unidades }))
      .sort((a,b) => b.unidades - a.unidades)

    // Detect duplicates
    const seen: Record<string, boolean> = {}
    const duplicados: any[] = []
    const hoy = new Date(); hoy.setHours(0,0,0,0)

    const apprSols = solicitudes.filter(s => s.status === 'approved')
    for (const s of apprSols) {
      for (const si of s.items) {
        const key = `${s.userId}-${si.itemId}-${s.proyecto}-${new Date(s.createdAt).toDateString()}`
        if (seen[key]) {
          const wName = userMap[s.userId] ?? s.userId
          duplicados.push({ worker: wName, itemId: si.itemId, proyecto: s.proyecto, fecha: new Date(s.createdAt).toLocaleDateString('es-CL') })
        } else { seen[key] = true }
      }
    }

    return reply.send({
      totalSolicitudes: solicitudes.length,
      aprobadas, pendientes, totalUnidades,
      porCategoria, porTrabajador, porProyecto,
      duplicados,
    })
  })

  // GET /reportes/comparar?proyectoA=X&proyectoB=Y
  app.get('/comparar', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const { proyectoA, proyectoB } = request.query as any
    if (!proyectoA || !proyectoB) return reply.status(400).send({ error: 'proyectoA y proyectoB requeridos' })

    async function getStats(proyecto: string) {
      const sols = await prisma.solicitud.findMany({
        where: { proyecto, status: 'approved' },
        include: { items: { include: { item: { select: { categoria: true, nombre: true } } } } }
      })
      const userIds = [...new Set(sols.map(s => s.userId))]
      let totalItems = 0
      const catMap: Record<string, { a: number; b: number }> = {}
      const itemFreq: Record<string, number> = {}
      sols.forEach(s => s.items.forEach(si => {
        totalItems += si.cantidad
        const cat = si.item?.categoria ?? 'Otro'
        if (!catMap[cat]) catMap[cat] = { a: 0, b: 0 }
        catMap[cat].a += si.cantidad
        const n = si.item?.nombre ?? ''
        itemFreq[n] = (itemFreq[n] ?? 0) + si.cantidad
      }))
      return { totalSolicitudes: sols.length, totalItems, trabajadores: userIds.length, catMap, itemFreq }
    }

    const [sA, sB] = await Promise.all([getStats(proyectoA), getStats(proyectoB)])

    // Build unified category comparison
    const allCats = [...new Set([...Object.keys(sA.catMap), ...Object.keys(sB.catMap)])]
    const categorias = allCats.map(cat => ({
      categoria: cat,
      a: sA.catMap[cat]?.a ?? 0,
      b: sB.catMap[cat]?.a ?? 0,
    })).sort((x,y) => (y.a+y.b) - (x.a+x.b))

    return reply.send({
      a: { ...sA, itemsFrecuentes: Object.entries(sA.itemFreq).sort((x,y)=>y[1]-x[1]).slice(0,5) },
      b: { ...sB, itemsFrecuentes: Object.entries(sB.itemFreq).sort((x,y)=>y[1]-x[1]).slice(0,5) },
      categorias,
    })
  })
}
