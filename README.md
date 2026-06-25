<div align="center">

# ContratistApp

### Inventario, solicitudes, bodega y vales para operaciones de contratistas

Sistema web full stack para controlar la entrega de materiales, aprobar solicitudes, administrar stock, revisar historial operativo y generar vales imprimibles con trazabilidad.

<br />

[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=111)](#frontend)
[![Backend](https://img.shields.io/badge/Backend-Fastify%20%2B%20TypeScript-202020?style=for-the-badge&logo=fastify&logoColor=white)](#backend)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](#base-de-datos)
[![ORM](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](#prisma)
[![Deploy](https://img.shields.io/badge/Deploy-Railway%20%2B%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](#despliegue)

<br />

**Backend:** `http://localhost:3000`  
**Frontend:** `http://localhost:5173`  
**Health check:** `http://localhost:3000/health`

</div>

---

## Guia rapida

| Quiero... | Ir a |
| --- | --- |
| Entender que hace la app | [Vista general](#vista-general) |
| Levantarla rapido | [Inicio express](#inicio-express) |
| Instalarla desde cero | [Instalacion local desde cero](#instalacion-local-desde-cero) |
| Configurar `.env` | [Variables de entorno](#variables-de-entorno) |
| Preparar PostgreSQL y Prisma | [Base de datos](#base-de-datos) |
| Levantar frontend y backend | [Ejecutar la app](#ejecutar-la-app) |
| Entrar con usuarios demo | [Credenciales demo](#credenciales-demo) |
| Ver rutas de la API | [API principal](#api-principal) |
| Publicarla en internet | [Despliegue](#despliegue) |
| Arreglar errores comunes | [Solucion de problemas](#solucion-de-problemas) |

## Vista general

ContratistApp organiza el ciclo completo de solicitud y entrega de materiales: desde que un trabajador pide insumos para un proyecto hasta que administracion aprueba, descuenta stock y deja registro auditable.

| Area | Que resuelve |
| --- | --- |
| Inventario | Control de insumos, codigos, categorias, stock, precios y alertas por bajo stock. |
| Solicitudes | Flujo formal para pedir materiales asociados a proyecto, plano y ficha. |
| Aprobaciones | Validacion administrativa con descuento automatico de stock. |
| Bodega | Ingreso de stock y registro de movimientos internos. |
| Historial | Trazabilidad de salidas, proyectos, usuarios y materiales entregados. |
| Trabajadores | Gestion de perfiles, cargos, especialidades, notas y evaluaciones. |
| Reportes | Lectura mensual y comparativa de consumo. |
| Vales | Comprobante imprimible para respaldar entregas aprobadas. |
| IA | Analisis asistido para administradores mediante Anthropic. |

## Flujo de trabajo

```mermaid
flowchart LR
    A["Trabajador inicia sesion"] --> B["Crea solicitud"]
    B --> C["Agrega proyecto, plano, ficha e insumos"]
    C --> D["Administrador revisa"]
    D --> E{"Hay stock suficiente?"}
    E -- "Si" --> F["Aprueba solicitud"]
    F --> G["Se descuenta inventario"]
    G --> H["Se registra historial"]
    H --> I["Se genera vale imprimible"]
    E -- "No" --> J["Se rechaza o queda pendiente"]
```

## Experiencia por rol

| Rol | Panel principal | Acciones destacadas |
| --- | --- | --- |
| Administrador | Dashboard, inventario, solicitudes, historial, bodega, IA, reportes, trabajadores y perfil. | Aprobar o rechazar solicitudes, ingresar stock, revisar consumos, gestionar usuarios y auditar movimientos. |
| Trabajador | Solicitar materiales, mis vales y mi perfil. | Crear solicitudes, revisar estado, consultar vales aprobados y mantener datos personales. |

## Stack tecnico

<a id="frontend"></a>

| Capa | Tecnologias |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Navegacion y estado | React Router, Zustand, TanStack React Query |
| UI y experiencia | React Hot Toast, React To Print, Axios, clsx |
| Backend | Node.js, Fastify, TypeScript |
| Datos y seguridad | PostgreSQL, Prisma, JWT, cookies, bcryptjs, Zod |
| IA | Anthropic SDK |
| Deploy sugerido | Railway para API/DB y Vercel para frontend |

## Estructura del proyecto

```text
ContratistApp/
├─ invstore-backend/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  ├─ seed.ts
│  │  └─ migrations/
│  ├─ src/
│  │  ├─ routes/
│  │  ├─ prisma.ts
│  │  └─ server.ts
│  ├─ .env.example
│  └─ package.json
│
├─ invstore-frontend/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ store/
│  │  ├─ types/
│  │  └─ utils/
│  ├─ .env.example
│  └─ package.json
│
├─ invstore-README.md
└─ README.md
```

## Requisitos previos

Antes de empezar, instala:

| Herramienta | Version recomendada | Para que sirve |
| --- | --- | --- |
| Node.js | 20 o superior | Ejecutar frontend y backend |
| npm | Incluido con Node | Instalar dependencias |
| Git | Ultima estable | Clonar y subir el proyecto |
| PostgreSQL | 14 o superior | Base de datos local |

Comprueba tus versiones:

```bash
node -v
npm -v
git --version
psql --version
```

## Inicio express

Si ya tienes PostgreSQL listo y solo quieres levantar la app rapidamente:

```bash
git clone https://github.com/sebvstiansoto/ContratistApp.git
cd ContratistApp/invstore-backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

En otra terminal:

```bash
cd ContratistApp/invstore-frontend
npm install
cp .env.example .env
npm run dev
```

Luego abre:

```text
http://localhost:5173
```

> [!TIP]
> En Windows PowerShell usa `Copy-Item .env.example .env` en lugar de `cp .env.example .env`.

## Instalacion local desde cero

### 1. Clonar el repositorio

```bash
git clone https://github.com/sebvstiansoto/ContratistApp.git
cd ContratistApp
```

### 2. Instalar dependencias del backend

```bash
cd invstore-backend
npm install
```

### 3. Crear variables de entorno del backend

En macOS/Linux:

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Luego edita `invstore-backend/.env` con tus datos reales.

### 4. Instalar dependencias del frontend

Desde la raiz del proyecto:

```bash
cd ../invstore-frontend
npm install
```

### 5. Crear variables de entorno del frontend

En macOS/Linux:

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Para desarrollo local, deja:

```env
VITE_API_URL=http://localhost:3000
```

## Variables de entorno

### Backend: `invstore-backend/.env`

```env
DATABASE_URL="postgresql://user:password@host:5432/invstore"
JWT_SECRET="cambia-esto-por-un-secret-de-al-menos-32-caracteres"
JWT_EXPIRES_IN="8h"
ANTHROPIC_API_KEY="sk-ant-tu-key-aqui"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

| Variable | Obligatoria | Descripcion |
| --- | --- | --- |
| `DATABASE_URL` | Si | URL de conexion a PostgreSQL. |
| `JWT_SECRET` | Si | Clave secreta para firmar tokens. Usa minimo 32 caracteres. |
| `JWT_EXPIRES_IN` | Si | Duracion de sesion. Ejemplo: `8h`. |
| `ANTHROPIC_API_KEY` | Solo para IA | API key para la seccion de analisis con IA. |
| `PORT` | No | Puerto del backend. Por defecto: `3000`. |
| `NODE_ENV` | No | `development` o `production`. |
| `FRONTEND_URL` | Si | URL permitida por CORS. En local: `http://localhost:5173`. |

### Frontend: `invstore-frontend/.env`

```env
VITE_API_URL=http://localhost:3000
```

| Variable | Obligatoria | Descripcion |
| --- | --- | --- |
| `VITE_API_URL` | Si | URL base del backend que consumira React. |

## Base de datos

### Crear una base local

Si tienes PostgreSQL instalado localmente, crea una base llamada `invstore`:

```bash
createdb invstore
```

Ejemplo de `DATABASE_URL` local:

```env
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/invstore"
```

### Prisma

Entra al backend:

```bash
cd invstore-backend
```

Aplica las migraciones:

```bash
npx prisma migrate dev
```

Carga datos demo:

```bash
npm run db:seed
```

El seed crea:

- 4 usuarios demo.
- 135 insumos iniciales.
- Inventario base con categorias, codigos, stock, precios y umbrales.

Abrir Prisma Studio:

```bash
npm run db:studio
```

Prisma Studio sirve para revisar y editar datos visualmente desde el navegador.

## Ejecutar la app

Necesitas dos terminales: una para backend y otra para frontend.

### Terminal 1: backend

```bash
cd invstore-backend
npm run dev
```

Backend disponible en:

```text
http://localhost:3000
```

Comprobar que la API esta viva:

```text
http://localhost:3000/health
```

### Terminal 2: frontend

```bash
cd invstore-frontend
npm run dev
```

Frontend disponible en:

```text
http://localhost:5173
```

Abre esa URL en el navegador e inicia sesion con las credenciales demo.

## Credenciales demo

| Rol | Usuario | Password |
| --- | --- | --- |
| Admin | `admin` | `Admin2024!` |
| Trabajador | `worker` | `Worker2024!` |
| Trabajador | `lt` | `Worker2024!` |
| Trabajador | `mg` | `Worker2024!` |

Importante: cambia estas claves antes de usar la app en produccion.

## Como usar ContratistApp

### Administrador

1. Ingresa con `admin`.
2. Revisa el dashboard para ver el estado general.
3. Entra a inventario para crear, editar o desactivar insumos.
4. Revisa solicitudes pendientes.
5. Aprueba una solicitud si corresponde.
6. El sistema descuenta stock automaticamente.
7. Consulta historial para auditar movimientos.
8. Usa bodega para ingresar nuevo stock.
9. Revisa reportes mensuales y comparativos.
10. Gestiona trabajadores, notas y evaluaciones.

### Trabajador

1. Ingresa con un usuario worker.
2. Abre la seccion de solicitud.
3. Selecciona materiales y cantidades.
4. Completa proyecto, plano y ficha.
5. Envia la solicitud.
6. Revisa el estado en mis vales.
7. Cuando este aprobada, consulta o imprime el vale.

## Reglas de negocio importantes

- Las solicitudes requieren proyecto, plano y ficha.
- Solo administradores pueden aprobar o rechazar solicitudes.
- Al aprobar, el backend valida stock antes de descontar.
- La aprobacion descuenta stock y registra historial.
- Los trabajadores no deben administrar inventario ni usuarios.
- Los precios quedan protegidos para flujos de trabajador.
- El inventario usa umbral de stock bajo para alertas.
- Los vales permiten dejar registro operativo de la entrega.

## Scripts disponibles

### Backend

Ejecutar dentro de `invstore-backend`.

| Comando | Descripcion |
| --- | --- |
| `npm run dev` | Levanta la API en modo desarrollo con recarga. |
| `npm run build` | Compila TypeScript a `dist/`. |
| `npm start` | Ejecuta el backend compilado. |
| `npm run db:migrate` | Aplica migraciones Prisma en produccion. |
| `npm run db:seed` | Carga usuarios e insumos demo. |
| `npm run db:studio` | Abre Prisma Studio. |

### Frontend

Ejecutar dentro de `invstore-frontend`.

| Comando | Descripcion |
| --- | --- |
| `npm run dev` | Levanta Vite en desarrollo. |
| `npm run build` | Compila TypeScript y genera build de produccion. |
| `npm run preview` | Sirve localmente el build generado. |
| `npm run lint` | Ejecuta ESLint sobre `src`. |

## API principal

La API se monta desde `http://localhost:3000`.

### Salud

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/health` | Verifica que el backend este activo. |

### Autenticacion

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `POST` | `/auth/login` | Inicia sesion. |
| `POST` | `/auth/logout` | Cierra sesion. |
| `GET` | `/auth/me` | Retorna el usuario autenticado. |

### Inventario

| Metodo | Ruta | Rol | Descripcion |
| --- | --- | --- | --- |
| `GET` | `/items` | Autenticado | Lista insumos. |
| `GET` | `/items/low-stock` | Admin | Lista insumos con stock bajo. |
| `GET` | `/items/:id` | Autenticado | Obtiene un insumo. |
| `POST` | `/items` | Admin | Crea un insumo. |
| `PUT` | `/items/:id` | Admin | Actualiza un insumo. |
| `DELETE` | `/items/:id` | Admin | Desactiva o elimina un insumo segun logica del backend. |

### Solicitudes

| Metodo | Ruta | Rol | Descripcion |
| --- | --- | --- | --- |
| `GET` | `/solicitudes` | Autenticado | Lista solicitudes segun rol. |
| `GET` | `/solicitudes/:id` | Autenticado | Detalle de solicitud. |
| `POST` | `/solicitudes` | Autenticado | Crea solicitud. |
| `PATCH` | `/solicitudes/:id/aprobar` | Admin | Aprueba y descuenta stock. |
| `PATCH` | `/solicitudes/:id/rechazar` | Admin | Rechaza solicitud. |
| `GET` | `/solicitudes/:id/vale` | Autenticado | Obtiene datos del vale. |

### Operacion y administracion

| Metodo | Ruta | Rol | Descripcion |
| --- | --- | --- | --- |
| `GET` | `/historial` | Admin | Lista movimientos historicos. |
| `GET` | `/historial/export` | Admin | Exporta historial. |
| `GET` | `/historial/stats` | Admin | Estadisticas de historial. |
| `POST` | `/bodega/ingresar` | Admin | Ingresa stock a bodega. |
| `GET` | `/bodega/log` | Admin | Lista ingresos de bodega. |
| `GET` | `/users` | Admin | Lista usuarios. |
| `GET` | `/users/:id` | Autenticado | Obtiene usuario. |
| `POST` | `/users` | Admin | Crea usuario. |
| `PUT` | `/users/:id` | Autenticado | Actualiza usuario. |
| `DELETE` | `/users/:id` | Admin | Desactiva usuario. |
| `POST` | `/evaluaciones` | Admin | Crea evaluacion. |
| `GET` | `/evaluaciones/:userId` | Autenticado | Lista evaluaciones por usuario. |
| `POST` | `/notas` | Admin | Crea nota. |
| `DELETE` | `/notas/:id` | Admin | Elimina nota. |
| `POST` | `/ia/analizar` | Admin | Ejecuta analisis con IA. |
| `GET` | `/reportes/mensual` | Admin | Reporte mensual. |
| `GET` | `/reportes/comparar` | Admin | Comparacion de reportes. |

## Despliegue

### Backend y PostgreSQL en Railway

1. Sube el repositorio a GitHub.
2. Entra a Railway.
3. Crea un nuevo proyecto.
4. Agrega una base PostgreSQL.
5. Agrega un servicio desde el repositorio de GitHub.
6. Configura el servicio apuntando a `invstore-backend`.
7. Agrega variables de entorno:

```env
DATABASE_URL="la-url-que-entrega-railway"
JWT_SECRET="un-secret-largo-y-seguro"
JWT_EXPIRES_IN="8h"
ANTHROPIC_API_KEY="tu-api-key"
PORT=3000
NODE_ENV="production"
FRONTEND_URL="https://tu-frontend.vercel.app"
```

8. Usa estos comandos de build/start si Railway los solicita:

```bash
npm install
npm run build
npm start
```

9. Ejecuta migraciones en produccion:

```bash
npm run db:migrate
```

10. Si necesitas datos iniciales:

```bash
npm run db:seed
```

### Frontend en Vercel

1. Entra a Vercel.
2. Importa el repositorio desde GitHub.
3. Configura el directorio raiz del proyecto como `invstore-frontend`.
4. Verifica que el framework sea Vite.
5. Agrega la variable:

```env
VITE_API_URL=https://tu-backend.railway.app
```

6. Despliega.
7. Copia la URL final de Vercel.
8. Actualiza `FRONTEND_URL` en Railway con esa URL.
9. Vuelve a desplegar el backend si Railway no lo hace automaticamente.

## Subir cambios a GitHub

Desde la raiz del proyecto:

```bash
git status
git add .
git commit -m "Actualizar README"
git push -u origin main
```

Si el remoto no existe:

```bash
git remote add origin https://github.com/sebvstiansoto/ContratistApp.git
git push -u origin main
```

## Solucion de problemas

### El frontend no conecta con el backend

Revisa `invstore-frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Reinicia Vite despues de cambiar variables de entorno.

### Error de CORS

Revisa `invstore-backend/.env`:

```env
FRONTEND_URL=http://localhost:5173
```

En produccion debe ser la URL real de Vercel.

### Error de base de datos

Comprueba que PostgreSQL este activo y que `DATABASE_URL` sea correcta.

Luego ejecuta:

```bash
npx prisma migrate dev
npm run db:seed
```

### Cambie el schema y no aparece en la app

Regenera el cliente Prisma:

```bash
npx prisma generate
```

Si agregaste una migracion:

```bash
npx prisma migrate dev
```

### Puerto ocupado

Si el backend no puede usar `3000`, cambia en `invstore-backend/.env`:

```env
PORT=3001
```

Y actualiza el frontend:

```env
VITE_API_URL=http://localhost:3001
```

### No funciona la IA

Verifica:

- `ANTHROPIC_API_KEY` esta configurada.
- La cuenta tiene saldo o acceso vigente.
- La ruta `/ia/analizar` se llama con usuario administrador.

## Buenas practicas

| Practica | Por que importa |
| --- | --- |
| No subir `.env` a GitHub | Evita exponer claves, passwords y URLs privadas. |
| Cambiar credenciales demo | Protege el acceso antes de usar la app con datos reales. |
| Usar un `JWT_SECRET` largo | Mejora la seguridad de las sesiones. |
| Ejecutar migraciones antes de publicar | Mantiene backend y base de datos sincronizados. |
| Probar `npm run build` | Detecta errores antes de desplegar. |
| Hacer commits pequenos | Facilita revisar cambios y volver atras si algo falla. |
| Respaldar la base de datos | Reduce riesgo antes de cambios grandes. |

## Checklist rapido

Antes de dar por lista una instalacion:

- [ ] PostgreSQL esta funcionando.
- [ ] `DATABASE_URL` apunta a la base correcta.
- [ ] Migraciones Prisma aplicadas.
- [ ] Seed ejecutado si se necesitan datos demo.
- [ ] Backend responde en `/health`.
- [ ] Frontend abre en `http://localhost:5173`.
- [ ] Login admin funciona.
- [ ] Login worker funciona.
- [ ] Una solicitud puede crearse.
- [ ] Una solicitud puede aprobarse.
- [ ] El stock se descuenta correctamente.
- [ ] El vale se puede revisar o imprimir.

## Licencia

Este proyecto no declara licencia publica todavia. Si quieres permitir uso, copia o modificacion por terceros, agrega un archivo `LICENSE` con la licencia que prefieras.

---

<div align="center">

**ContratistApp**  
Inventario claro, solicitudes ordenadas y entregas faciles de auditar.

Hecho para que la operacion diaria sea mas simple, trazable y confiable.

</div>
