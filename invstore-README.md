# InvStore — Guía Completa de Instalación

## Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS  
- Backend: Node.js + Fastify + TypeScript + Prisma
- DB: PostgreSQL
- Deploy: Railway (backend + DB) + Vercel (frontend)

## Inicio Rápido — Local

### Backend
```bash
cd backend
npm install
cp .env.example .env   # editar con tus datos
npx prisma migrate dev --name init
npm run db:seed        # 135 insumos + usuarios demo
npm run dev            # http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm run dev            # http://localhost:5173
```

### Credenciales Demo
| Rol | Usuario | Contraseña |
|---|---|---|
| Admin | admin | Admin2024! |
| Trabajador | worker | Worker2024! |

## Deploy Producción (Railway + Vercel)

### 1. GitHub
```bash
git init && git add . && git commit -m "InvStore MVP"
git remote add origin https://github.com/TU/invstore.git
git push -u origin main
```

### 2. Railway (Backend + DB)
1. railway.app → New Project → Add PostgreSQL
2. New Service → GitHub Repo → /backend
3. Variables: DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, FRONTEND_URL, NODE_ENV=production
4. Build: `npm install && npx prisma migrate deploy && npm run db:seed && npm run build`
5. Start: `npm start`

### 3. Vercel (Frontend)
1. vercel.com → Import → /frontend → Framework: Vite
2. Variable: VITE_API_URL=https://tu-api.railway.app
3. Deploy → actualizar FRONTEND_URL en Railway

## Variables de Entorno

### Backend .env
```
DATABASE_URL="postgresql://user:pass@host:5432/invstore"
JWT_SECRET="minimo-32-chars-aleatorios"
JWT_EXPIRES_IN="8h"
ANTHROPIC_API_KEY="sk-ant-..."
NODE_ENV="production"
PORT=3000
FRONTEND_URL="https://invstore.vercel.app"
```

### Frontend .env
```
VITE_API_URL="https://invstore-api.railway.app"
```

## Reglas de Negocio Críticas
- Aprobación es transacción atómica (verifica stock → descuenta → historial)
- Workers nunca ven precios en ningún endpoint
- Proyecto + Plano + Ficha son obligatorios
- Detección de duplicados al aprobar (HTTP 409, admin decide con ?force=true)
- Session timeout: 30 min inactividad → logout automático
