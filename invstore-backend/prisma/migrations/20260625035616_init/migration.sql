-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'worker');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('active', 'pause', 'leave', 'off');

-- CreateEnum
CREATE TYPE "SolicitudStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'worker',
    "foto" TEXT,
    "telefono" TEXT NOT NULL DEFAULT '',
    "rut" TEXT NOT NULL DEFAULT '',
    "especialidad" TEXT NOT NULL DEFAULT '',
    "estado" "Estado" NOT NULL DEFAULT 'active',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "spec" TEXT NOT NULL DEFAULT '',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "precio" INTEGER,
    "threshold" INTEGER NOT NULL DEFAULT 5,
    "foto" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "proyecto" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "ficha" TEXT NOT NULL,
    "status" "SolicitudStatus" NOT NULL DEFAULT 'pending',
    "aprobadoPor" TEXT,
    "fechaResolucion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudItem" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioSnapshot" INTEGER,

    CONSTRAINT "SolicitudItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Historial" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio" INTEGER,
    "proyecto" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "ficha" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluacion" (
    "id" SERIAL NOT NULL,
    "evaluadoId" TEXT NOT NULL,
    "evaluadorId" TEXT NOT NULL,
    "solicitudId" INTEGER,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "proyecto" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "byId" TEXT NOT NULL,
    "byNombre" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodegaLog" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodegaLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_key" ON "User"("user");

-- CreateIndex
CREATE UNIQUE INDEX "Item_codigo_key" ON "Item"("codigo");

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudItem" ADD CONSTRAINT "SolicitudItem_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudItem" ADD CONSTRAINT "SolicitudItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historial" ADD CONSTRAINT "Historial_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_evaluadoId_fkey" FOREIGN KEY ("evaluadoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_evaluadorId_fkey" FOREIGN KEY ("evaluadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodegaLog" ADD CONSTRAINT "BodegaLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodegaLog" ADD CONSTRAINT "BodegaLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
