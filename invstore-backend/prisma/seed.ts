import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const items = [
  { nombre:'Empaquetadura DN 13', codigo:'19486', categoria:'Empaquetaduras', spec:'DN 13', stock:45, precio:490, threshold:5 },
  { nombre:'Empaquetadura DN 20', codigo:'25813', categoria:'Empaquetaduras', spec:'DN 20', stock:30, precio:490, threshold:5 },
  { nombre:'Empaquetadura Flexitallic 1"', codigo:'15961', categoria:'Empaquetaduras', spec:'33-70 DN 25', stock:20, precio:490, threshold:5 },
  { nombre:'Empaquetadura Flexitallic 1.25"', codigo:'15727', categoria:'Empaquetaduras', spec:'43-82 DN 32', stock:22, precio:620, threshold:5 },
  { nombre:'Empaquetadura Flexitallic 1.5"', codigo:'15728', categoria:'Empaquetaduras', spec:'49-92 DN 40', stock:18, precio:780, threshold:5 },
  { nombre:'Empaquetadura Flexitallic 2"', codigo:'15729', categoria:'Empaquetaduras', spec:'61-107 DN 50', stock:10, precio:1330, threshold:5 },
  { nombre:'Empaquetadura Flexitallic 2.5"', codigo:'15730', categoria:'Empaquetaduras', spec:'77-127 DN 65', stock:8, precio:1380, threshold:5 },
  { nombre:'Empaquetadura Flexitallic 3"', codigo:'15731', categoria:'Empaquetaduras', spec:'90-142 DN 80', stock:5, precio:1630, threshold:5 },
  { nombre:'Empaquetadura Flexitallic 4"', codigo:'15732', categoria:'Empaquetaduras', spec:'DN 100', stock:12, precio:1800, threshold:5 },
  { nombre:'Empaquetadura Flexitallic 5"', codigo:'15733', categoria:'Empaquetaduras', spec:'141-192 DN 125', stock:7, precio:1183, threshold:5 },
  { nombre:'Empaquetadura DN 150', codigo:'19496', categoria:'Empaquetaduras', spec:'DN 150', stock:4, precio:1950, threshold:5 },
  { nombre:'Empaquetadura DN 200', codigo:'19497', categoria:'Empaquetaduras', spec:'DN 200', stock:2, precio:2200, threshold:5 },
  { nombre:'Abrazadera DN 32', codigo:'23454', categoria:'Fijaciones', spec:'DN 32', stock:60, precio:850, threshold:8 },
  { nombre:'Abrazadera DN 40', codigo:'23455', categoria:'Fijaciones', spec:'DN 40', stock:55, precio:920, threshold:8 },
  { nombre:'Abrazadera DN 50', codigo:'23456', categoria:'Fijaciones', spec:'DN 50', stock:40, precio:1100, threshold:8 },
  { nombre:'Abrazadera DN 65', codigo:'23457', categoria:'Fijaciones', spec:'DN 65', stock:35, precio:1350, threshold:8 },
  { nombre:'Abrazadera DN 80', codigo:'23458', categoria:'Fijaciones', spec:'DN 80', stock:28, precio:1600, threshold:8 },
  { nombre:'Abrazadera DN 100', codigo:'23459', categoria:'Fijaciones', spec:'DN 100', stock:20, precio:2100, threshold:8 },
  { nombre:'Abrazadera DN 125', codigo:'23460', categoria:'Fijaciones', spec:'DN 125', stock:15, precio:2800, threshold:8 },
  { nombre:'Abrazadera DN 150', codigo:'23461', categoria:'Fijaciones', spec:'DN 150', stock:10, precio:3400, threshold:8 },
  { nombre:'Abrazadera DN 200', codigo:'23462', categoria:'Fijaciones', spec:'DN 200', stock:6, precio:4500, threshold:5 },
  { nombre:'Abrazadera DN 250', codigo:'23463', categoria:'Fijaciones', spec:'DN 250', stock:3, precio:5800, threshold:5 },
  { nombre:'Guia Luz', codigo:'19984', categoria:'Herramientas', spec:'', stock:8, precio:null, threshold:3 },
  { nombre:'Guia Tablero', codigo:'19985', categoria:'Herramientas', spec:'', stock:4, precio:null, threshold:3 },
  { nombre:'Llave Jardin', codigo:'8959', categoria:'Herramientas', spec:'', stock:5, precio:null, threshold:3 },
  { nombre:'Protector Solar', codigo:'22035', categoria:'Consumibles y EPP', spec:'', stock:25, precio:null, threshold:5 },
  { nombre:'Diluyente', codigo:'4076', categoria:'Consumibles y EPP', spec:'', stock:12, precio:null, threshold:5 },
  { nombre:'Mascarilla', codigo:'7207', categoria:'Consumibles y EPP', spec:'', stock:50, precio:null, threshold:10 },
  { nombre:'Perno Hexag Galva DIN 933', codigo:'4574', categoria:'Fijaciones', spec:'M 16 X 60', stock:100, precio:364, threshold:20 },
  { nombre:'Perno Hexag Zincado DIN 931', codigo:'26529', categoria:'Fijaciones', spec:'M 12 X 50', stock:80, precio:280, threshold:20 },
  { nombre:'Perno Hexag F/N DIN 933 M10', codigo:'11267', categoria:'Fijaciones', spec:'M 10 X 40', stock:60, precio:124, threshold:20 },
  { nombre:'Perno Hexag F/N DIN 933 M16x55', codigo:'18712', categoria:'Fijaciones', spec:'M 16 X 55', stock:50, precio:229, threshold:15 },
  { nombre:'Perno Hexag F/N DIN 933 M16x60', codigo:'6444', categoria:'Fijaciones', spec:'M 16 X 60', stock:40, precio:222, threshold:15 },
  { nombre:'Tuerca Hexag Galva DIN 934 M16', codigo:'7443', categoria:'Fijaciones', spec:'M 16', stock:120, precio:83, threshold:25 },
  { nombre:'Tuerca Hexag Zincado DIN 934 M12', codigo:'23388', categoria:'Fijaciones', spec:'M 12', stock:90, precio:50, threshold:25 },
  { nombre:'Tuerca Hexag F/N DIN 934 M16', codigo:'27296', categoria:'Fijaciones', spec:'M 16', stock:70, precio:149, threshold:20 },
  { nombre:'Remache Pop Aluminio', codigo:'3773', categoria:'Fijaciones', spec:'4 X 12', stock:500, precio:12, threshold:50 },
  { nombre:'Pasada Mamparo N8 DN25', codigo:'18833', categoria:'Tuberias y Pasamuros', spec:'WS N8 DN25', stock:5, precio:4000, threshold:3 },
  { nombre:'Pasada Mamparo N8 DN65', codigo:'18837', categoria:'Tuberias y Pasamuros', spec:'WS N8 DN65', stock:3, precio:7500, threshold:2 },
  { nombre:'Fitting F/N Pasamamparo ESV PL', codigo:'2191', categoria:'Fittings y Flanges', spec:'ESV 22 PL', stock:4, precio:8860, threshold:2 },
  { nombre:'Tapon Acero Galva Hilo Ext 1.5"', codigo:'5550', categoria:'Fittings y Flanges', spec:'1.5 pulgada', stock:10, precio:1564, threshold:5 },
  { nombre:'Tapon Drenaje WS', codigo:'26281', categoria:'Fittings y Flanges', spec:'M 42 X 2', stock:3, precio:213143, threshold:2 },
  { nombre:'Flange Acero F/N DIN 86041 2"', codigo:'1506', categoria:'Fittings y Flanges', spec:'50/60.3', stock:5, precio:12825, threshold:3 },
  { nombre:'Tapon Acero Galva Hilo Ext 1.25"', codigo:'1568', categoria:'Fittings y Flanges', spec:'1.25 pulgada', stock:8, precio:1210, threshold:4 },
  { nombre:'Perfil Angular Acero Laminado', codigo:'23771', categoria:'Perfiles y Estructuras', spec:'80 X 80 X 10', stock:6, precio:10115, threshold:3 },
  { nombre:'Perfil Angular F/N A-3724 40x40', codigo:'2531', categoria:'Perfiles y Estructuras', spec:'40 X 40 X 4 X 6000', stock:4, precio:2057, threshold:3 },
  { nombre:'Plancha Galva Lisa Opaco', codigo:'28790', categoria:'Planchas', spec:'0.6 X 1000 X 3000', stock:3, precio:20160, threshold:2 },
  { nombre:'Searox WM 950 Alu', codigo:'24867', categoria:'Aislacion', spec:'4000 X 1000 X 50', stock:6, precio:30027, threshold:3 },
  { nombre:'Disco Corte A960 TZ Inox', codigo:'21145', categoria:'Herramientas', spec:'4.5"', stock:25, precio:500, threshold:8 },
  { nombre:'Disco Flap SMT 624 G.60 Inox', codigo:'15295', categoria:'Herramientas', spec:'4.5" Convexo', stock:15, precio:2400, threshold:6 },
  { nombre:'Espatula 50mm', codigo:'1052', categoria:'Herramientas', spec:'50 M/M', stock:5, precio:1949, threshold:3 },
  { nombre:'Spray Galvanizado Loctite', codigo:'24357', categoria:'Consumibles y EPP', spec:'400 ML', stock:8, precio:5628, threshold:4 },
  { nombre:'Cinta Tela Impermeable Gris', codigo:'9812', categoria:'Consumibles y EPP', spec:'2" X 50 MTS', stock:6, precio:5368, threshold:3 },
  { nombre:'Huincha Aluminio Engomada', codigo:'22187', categoria:'Consumibles y EPP', spec:'3" X 50 MT', stock:4, precio:8822, threshold:3 },
  { nombre:'Lente Seguridad 3M SF407', codigo:'27750', categoria:'Consumibles y EPP', spec:'3M I/O SGAF', stock:12, precio:6890, threshold:5 },
  { nombre:'Overol Poplin con Reflectante', codigo:'24338', categoria:'Consumibles y EPP', spec:'Azul Talla M', stock:8, precio:3890, threshold:4 },
  { nombre:'Guante Ninja Skin T9', codigo:'28805', categoria:'Consumibles y EPP', spec:'T/9', stock:10, precio:2690, threshold:5 },
  { nombre:'Traje de Agua Verde XL', codigo:'24528', categoria:'Consumibles y EPP', spec:'Talla XL', stock:4, precio:13900, threshold:3 },
  { nombre:'Cubre Calzado Desechable', codigo:'17186', categoria:'Consumibles y EPP', spec:'', stock:50, precio:70, threshold:15 },
  { nombre:'Lente Antiempanante 3M', codigo:'21254', categoria:'Consumibles y EPP', spec:'Clara', stock:10, precio:6730, threshold:5 },
  { nombre:'Linterna para Casco Yato', codigo:'24945', categoria:'Herramientas', spec:'Marca Yato', stock:3, precio:28000, threshold:2 },
  { nombre:'Protector Auditivo 3M 1270', codigo:'7209', categoria:'Consumibles y EPP', spec:'3M 1270', stock:20, precio:1090, threshold:8 },
  { nombre:'Traje de Agua Verde M', codigo:'24527', categoria:'Consumibles y EPP', spec:'Talla M', stock:5, precio:13900, threshold:3 },
  { nombre:'Guante Cuero Cabritilla', codigo:'3333', categoria:'Consumibles y EPP', spec:'Puno Rojo', stock:15, precio:990, threshold:6 },
  { nombre:'Panos de Limpieza', codigo:'3555', categoria:'Limpieza', spec:'', stock:10, precio:1366, threshold:4 },
  { nombre:'Bolsas Plasticas Basura', codigo:'2760', categoria:'Limpieza', spec:'80 X 110 Paq 10u', stock:8, precio:1650, threshold:4 },
  { nombre:'Pano Absorbente 3M HP-156', codigo:'23450', categoria:'Limpieza', spec:'Hidrocarburos 100u', stock:5, precio:459, threshold:3 },
  { nombre:'Alambre Recocido 1 kg', codigo:'2414', categoria:'Consumibles y EPP', spec:'Galv. Fino N18', stock:20, precio:1693, threshold:6 },
  { nombre:'Polietileno Standard', codigo:'6325', categoria:'Consumibles y EPP', spec:'0.10 X 2 MTS', stock:15, precio:758, threshold:6 },
  { nombre:'Balde Galvanizado 8L', codigo:'25651', categoria:'Herramientas', spec:'8 LTS', stock:4, precio:13445, threshold:3 },
  { nombre:'Broca HSS Alpen 4mm', codigo:'2581', categoria:'Herramientas', spec:'4 M/M', stock:6, precio:844, threshold:3 },
  { nombre:'Perno Hexag Galva DIN 933 M16x55', codigo:'18308', categoria:'Fijaciones', spec:'M 16 X 55', stock:60, precio:339, threshold:15 },
  { nombre:'Perno Hexag F/N DIN 933 M16x40', codigo:'27211', categoria:'Fijaciones', spec:'M 16 X 40', stock:40, precio:343, threshold:15 },
  { nombre:'Perno Hexag F/N DIN 933 M20x65', codigo:'4888', categoria:'Fijaciones', spec:'M 20 X 65', stock:30, precio:371, threshold:12 },
  { nombre:'Perno Hexag F/N DIN 933 M20x70', codigo:'15069', categoria:'Fijaciones', spec:'M 20 X 70', stock:25, precio:434, threshold:12 },
  { nombre:'Perno Hexag Inoxi A4 DIN 933', codigo:'24510', categoria:'Fijaciones', spec:'M 16 X 55', stock:15, precio:1510, threshold:6 },
  { nombre:'Perno Hexag Galva DIN 931 M16x90', codigo:'1435', categoria:'Fijaciones', spec:'M 16 X 90', stock:20, precio:434, threshold:8 },
  { nombre:'Perno Hexag Galva DIN 933 M16x40', codigo:'1107', categoria:'Fijaciones', spec:'M 16 X 40', stock:35, precio:254, threshold:12 },
  { nombre:'Perno Hexag Galva DIN 933 M20x80', codigo:'1699', categoria:'Fijaciones', spec:'M 20 X 80', stock:18, precio:371, threshold:8 },
  { nombre:'Perno Hexag Inox A2 DIN 931', codigo:'23843', categoria:'Fijaciones', spec:'M 16 X 120', stock:10, precio:2072, threshold:5 },
  { nombre:'Perno Hexag F/N DIN 933 M12x40', codigo:'1020', categoria:'Fijaciones', spec:'M 12 X 40', stock:20, precio:171, threshold:8 },
  { nombre:'Tuerca Hexag F/N DIN 934 M16b', codigo:'7451', categoria:'Fijaciones', spec:'M 16', stock:80, precio:53, threshold:20 },
  { nombre:'Tuerca Hexag Zincado DIN 934 M16', codigo:'23168', categoria:'Fijaciones', spec:'M 16', stock:60, precio:120, threshold:20 },
  { nombre:'Tuerca Hexag F/N DIN 934 M20', codigo:'27212', categoria:'Fijaciones', spec:'M 20', stock:50, precio:210, threshold:15 },
  { nombre:'Tuerca Hexag Inoxi A4 DIN 934', codigo:'5484', categoria:'Fijaciones', spec:'M 16', stock:20, precio:633, threshold:8 },
  { nombre:'Tuerca Hexag Galva DIN 934 M20', codigo:'7444', categoria:'Fijaciones', spec:'M 20', stock:30, precio:169, threshold:12 },
  { nombre:'Tuerca Hexag F/N DIN 934 M10', codigo:'7448', categoria:'Fijaciones', spec:'M 10', stock:60, precio:34, threshold:20 },
  { nombre:'Tuerca Hexag F/N DIN 934 M12', codigo:'7449', categoria:'Fijaciones', spec:'M 12', stock:40, precio:21, threshold:15 },
  { nombre:'Caneria HY Inox 25x3', codigo:'17550', categoria:'Tuberias y Pasamuros', spec:'25 X 3.0', stock:6, precio:21871, threshold:3 },
  { nombre:'Fitting HY Inox ESV S', codigo:'17123', categoria:'Fittings y Flanges', spec:'ESV 25 S', stock:8, precio:67595, threshold:3 },
  { nombre:'Fitting HY Inox EVW', codigo:'26394', categoria:'Fittings y Flanges', spec:'EVW 25 PL', stock:5, precio:58476, threshold:3 },
  { nombre:'Fitting HY Inox G PS', codigo:'17554', categoria:'Fittings y Flanges', spec:'G 25 PS', stock:6, precio:50394, threshold:3 },
  { nombre:'Tapon Drenaje OS', codigo:'26282', categoria:'Fittings y Flanges', spec:'M 42 X 2', stock:4, precio:217126, threshold:2 },
  { nombre:'Abrazadera Plastica NR25', codigo:'2718', categoria:'Fijaciones', spec:'NR 25 RAP 3', stock:30, precio:1515, threshold:10 },
  { nombre:'Tapagorro Acero Galva 1.5"', codigo:'1573', categoria:'Fittings y Flanges', spec:'1.5 pulgada', stock:6, precio:1826, threshold:3 },
  { nombre:'Flange Acero DIN 86041 4"', codigo:'1509', categoria:'Fittings y Flanges', spec:'100/114.3', stock:3, precio:19040, threshold:2 },
  { nombre:'Flange Acero DIN 86041 2.5"', codigo:'1507', categoria:'Fittings y Flanges', spec:'65/76.1', stock:4, precio:14268, threshold:2 },
  { nombre:'Flange Acero DIN 86041 3"', codigo:'1508', categoria:'Fittings y Flanges', spec:'80/88.9', stock:3, precio:17890, threshold:2 },
  { nombre:'Pletina Acero A-3724', codigo:'3329', categoria:'Perfiles y Estructuras', spec:'5 X 38', stock:5, precio:1379, threshold:3 },
  { nombre:'Perfil Angular F/N A-3724 30x30', codigo:'15297', categoria:'Perfiles y Estructuras', spec:'30 X 30 X 5 X 6000', stock:6, precio:1940, threshold:3 },
  { nombre:'Searox MA 720 Alu', codigo:'27419', categoria:'Aislacion', spec:'7000 X 1000 X 50', stock:4, precio:51009, threshold:3 },
  { nombre:'Adhesivo Agorex La Gotita', codigo:'3171', categoria:'Adhesivos', spec:'2 GR', stock:10, precio:1548, threshold:4 },
  { nombre:'Loctite Nickel Anti-Seize', codigo:'22440', categoria:'Adhesivos', spec:'454 GR', stock:3, precio:59760, threshold:2 },
  { nombre:'Contrabrida Switch de Nivel', codigo:'13908', categoria:'Instrumentacion', spec:'92 X 92 MM', stock:2, precio:63784, threshold:2 },
  { nombre:'Soldadura 7018 Lincoln', codigo:'1279', categoria:'Soldadura', spec:'3/32" X 12"', stock:15, precio:4, threshold:5 },
  { nombre:'Soldadura Inox 316L 1/8"', codigo:'4523', categoria:'Soldadura', spec:'1/8 X 14"', stock:5, precio:7967, threshold:3 },
  { nombre:'Soldadura Alun-34 Amco', codigo:'12034', categoria:'Soldadura', spec:'1/8"', stock:4, precio:1700, threshold:3 },
  { nombre:'Soldadura Inox 316L 3/32"', codigo:'4522', categoria:'Soldadura', spec:'3/32" X 12"', stock:3, precio:15500, threshold:2 },
  { nombre:'Varilla Aporte TIG ER70', codigo:'2357', categoria:'Soldadura', spec:'ER 70.S.6 3/32', stock:6, precio:4835, threshold:3 },
  { nombre:'Escobilla Acero Inox', codigo:'4819', categoria:'Herramientas', spec:'4-C Inox', stock:8, precio:3295, threshold:4 },
  { nombre:'Disco Plastico Soporte 4.5"', codigo:'25235', categoria:'Herramientas', spec:'Rigido ST 358', stock:5, precio:4440, threshold:3 },
  { nombre:'Disco Flap SMT 926 Inox G40', codigo:'22721', categoria:'Herramientas', spec:'4.5"', stock:10, precio:2880, threshold:5 },
  { nombre:'Disco Lija Esmeril Cubitron', codigo:'23228', categoria:'Herramientas', spec:'4.5" 1182 C', stock:8, precio:2130, threshold:4 },
  { nombre:'Permatex 80016 (2-B)', codigo:'5514', categoria:'Adhesivos', spec:'Tubo 85 GRS', stock:5, precio:3532, threshold:3 },
  { nombre:'Permatex 515 300ml', codigo:'16685', categoria:'Adhesivos', spec:'Tubo 300 ML', stock:3, precio:91590, threshold:2 },
  { nombre:'Casquete Careta Esmerilador', codigo:'4503', categoria:'Consumibles y EPP', spec:'Amarillo', stock:4, precio:1380, threshold:3 },
  { nombre:'Guante Industrial Verde Nitrilo', codigo:'3205', categoria:'Consumibles y EPP', spec:'Nitrilo 9', stock:15, precio:590, threshold:6 },
  { nombre:'Overol Proteccion Papel', codigo:'11952', categoria:'Consumibles y EPP', spec:'Marca Coveral', stock:6, precio:1290, threshold:4 },
  { nombre:'Visor Careta Esmerilador', codigo:'5751', categoria:'Consumibles y EPP', spec:'8" X 16"', stock:5, precio:850, threshold:3 },
  { nombre:'Guante Mosquetero Soldador', codigo:'4492', categoria:'Consumibles y EPP', spec:'Ansell 43-216', stock:8, precio:6400, threshold:4 },
  { nombre:'Guante Anticorte Ansell T10', codigo:'28816', categoria:'Consumibles y EPP', spec:'Talla 10', stock:6, precio:3250, threshold:4 },
  { nombre:'Guante Anticorte Ansell T8', codigo:'28811', categoria:'Consumibles y EPP', spec:'Talla 8', stock:6, precio:3250, threshold:4 },
  { nombre:'Teflon Gas Cinta Amarilla', codigo:'4092', categoria:'Consumibles y EPP', spec:'0.5"', stock:20, precio:204, threshold:8 },
  { nombre:'Tiza Esteatita 50u', codigo:'11828', categoria:'Consumibles y EPP', spec:'50 un x caja', stock:8, precio:856, threshold:4 },
  { nombre:'Limpia Contactos Loctite', codigo:'23741', categoria:'Limpieza', spec:'340 GRS 12 OZ', stock:4, precio:5126, threshold:3 },
  { nombre:'Huincha Medir Stanley 5m', codigo:'12341', categoria:'Herramientas', spec:'3/4" X 5 MTS', stock:5, precio:7739, threshold:3 },
  { nombre:'Broca HSS Alpen 4.5mm', codigo:'2578', categoria:'Herramientas', spec:'4.5 M/M', stock:5, precio:1075, threshold:3 },
  { nombre:'Broca HSS Alpen 12mm', codigo:'2592', categoria:'Herramientas', spec:'12 M/M', stock:4, precio:6936, threshold:3 },
  { nombre:'Broca HSS Alpen 5mm', codigo:'2580', categoria:'Herramientas', spec:'5 M/M', stock:6, precio:1210, threshold:3 },
  { nombre:'Broca HSS Alpen 3.5mm', codigo:'2583', categoria:'Herramientas', spec:'3.5 M/M', stock:5, precio:766, threshold:3 },
  { nombre:'Sierra Copa Bi-Metal 46mm', codigo:'27435', categoria:'Herramientas', spec:'46MM', stock:3, precio:5756, threshold:2 },
  { nombre:'Aceite Rocol RTD 400gr', codigo:'8371', categoria:'Lubricantes', spec:'400 GR', stock:5, precio:36900, threshold:3 },
  { nombre:'Lapiz Sharpie', codigo:'20658', categoria:'Escritorio', spec:'Azul/Rojo/Verde', stock:20, precio:760, threshold:5 },
  { nombre:'Marcador Oleo Pilot', codigo:'20657', categoria:'Escritorio', spec:'Blanco/Azul/Rojo', stock:15, precio:1984, threshold:5 },
  { nombre:'Eslinga Sintetica Poliester 4m', codigo:'23984', categoria:'Izaje', spec:'3" X 4 MTS', stock:4, precio:27205, threshold:2 },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const adminHash = await bcrypt.hash('Admin2024!', 10)
  await prisma.user.upsert({
    where: { user: 'admin' },
    update: {},
    create: {
      nombre: 'Carlos Mendoza',
      cargo: 'Supervisor General',
      user: 'admin',
      passwordHash: adminHash,
      role: 'admin',
      especialidad: 'Administracion',
    },
  })

  // Worker users
  const workerHash = await bcrypt.hash('Worker2024!', 10)
  const workers = [
    { nombre: 'Juan Perez', cargo: 'Operario', user: 'worker', especialidad: 'Operario' },
    { nombre: 'Luis Torres', cargo: 'Electricista', user: 'lt', especialidad: 'Electricista' },
    { nombre: 'Maria Gomez', cargo: 'Tecnica', user: 'mg', especialidad: 'Tecnica' },
  ]

  for (const w of workers) {
    await prisma.user.upsert({
      where: { user: w.user },
      update: {},
      create: { ...w, passwordHash: workerHash, role: 'worker' },
    })
  }

  // Items — 135 insumos
  for (const item of items) {
    await prisma.item.upsert({
      where: { codigo: item.codigo },
      update: {},
      create: item,
    })
  }

  console.log(`✅ Seed complete: ${items.length} items + 4 users`)
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
