# InvStore — Frontend

## Setup rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env
cp .env.example .env
# Edita .env y pon la URL de tu backend:
# VITE_API_URL=http://localhost:3000

# 3. Correr en desarrollo
npm run dev
# Abre http://localhost:5173
```

## Credenciales demo (requiere backend corriendo)
- Admin: `admin` / `Admin2024!`
- Trabajador: `worker` / `Worker2024!`

## Build para producción
```bash
npm run build
# Los archivos quedan en /dist — listo para Vercel
```

## Estructura
```
src/
├── api/          # Llamadas al backend (Axios)
├── components/   # UI reutilizable + Layout
├── hooks/        # (Zustand store en /store)
├── pages/        # admin/ y worker/
├── store/        # authStore.ts (Zustand)
├── types/        # Interfaces TypeScript
└── utils/        # Colores, formato CLP, CSV
```

## Deploy en Vercel
1. Subir el proyecto a GitHub
2. Importar en vercel.com → Framework: Vite
3. Agregar variable de entorno `VITE_API_URL` con la URL de Railway
4. Deploy
