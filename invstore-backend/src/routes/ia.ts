import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import Anthropic from '@anthropic-ai/sdk'

const Schema = z.object({
  modo:      z.enum(['texto', 'pdf']),
  contenido: z.string().min(1),
  extra:     z.string().optional().default(''),
})

export default async function iaRoutes(app: FastifyInstance) {

  app.post('/analizar', { preHandler: [(app as any).adminOnly] }, async (request, reply) => {
    const body = Schema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { modo, contenido, extra } = body.data

    // Build catalog string
    const items = await prisma.item.findMany({
      where: { activo: true },
      select: { id:true, nombre:true, spec:true, categoria:true, stock:true, precio:true, codigo:true }
    })
    const catalog = items.map(i =>
      `ID:${i.id}|${i.nombre}|${i.spec}|${i.categoria}|Stock:${i.stock}|${i.precio ? "$"+i.precio : "N/D"}|${i.codigo}`
    ).join("\n")

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Eres experto en piping e instalaciones industriales. Analiza el proyecto y extrae materiales necesarios.

CATALOGO DISPONIBLE:
${catalog}

${modo === 'texto' ? 'PROYECTO:' : 'DOCUMENTO:'}
${contenido}
${extra ? "\nCONTEXTO ADICIONAL:\n" + extra : ""}

Responde SOLO con JSON valido (sin backticks, sin texto extra):
{
  "resumen": "descripcion breve del proyecto detectado",
  "materiales": [
    {
      "catalogId": 13,
      "nombre": "Abrazadera DN 50",
      "spec": "DN 50",
      "cantidadSugerida": 8,
      "unidad": "unidades",
      "razon": "Para fijacion de tuberia cada 2 metros",
      "enCatalogo": true
    }
  ]
}`
      }]
    })

    const text = (message.content[0] as any).text ?? ''
    try {
      const clean  = text.replace(/^\`\`\`json\s*/,'').replace(/^\`\`\`\s*/,'').replace(/\`\`\`\s*$/,'').trim()
      const parsed = JSON.parse(clean)
      return reply.send(parsed)
    } catch {
      return reply.status(500).send({ error: 'Error al parsear respuesta de IA', raw: text.slice(0,300) })
    }
  })
}
