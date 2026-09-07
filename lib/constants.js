// lib/constants.js

// 1. EQUIPOS POR DEFECTO PARA LA TABLA DE CARGAS
export const DEFAULT_APPLIANCES = [
  { name: 'Nevera / Refrigerador', power: 150, qty: 1, hours: 24, hp: 0 },
  { name: 'Iluminación LED', power: 10, qty: 8, hours: 5, hp: 0 },
  { name: 'Televisor Smart TV', power: 80, qty: 1, hours: 5, hp: 0 },
  { name: 'Ventilador de techo / pedestal', power: 60, qty: 2, hours: 6, hp: 0 },
  { name: 'Licuadora', power: 400, qty: 1, hours: 0.3, hp: 0 },
  { name: 'Lavadora de ropa', power: 500, qty: 1, hours: 1, hp: 0 },
  { name: 'Bomba de agua (0.5 HP)', power: 373, qty: 1, hours: 1, hp: 0.5 }
];

// 2. PARÁMETROS POR DEFECTO DE INSTALACIÓN Y PROYECTO
export const DEFAULT_INSTALL_PROJECT_PARAMS = {
  distanciaKm: 25,
  diasInstalacion: 2,
  numTecnicos: 2,
  tipoCubierta: 'teja',
  adicionales: 0,
  incluyeViaticos: true
};

// 3. PARÁMETROS COMERCIALES Y FINANCIEROS POR DEFECTO
export const DEFAULT_BUSINESS_PARAMS = {
  margenObjetivoPct: 30,
  comisionReferidoPct: 2,
  comisionAsesorPct: 4,
  ivaEquiposPct: 0,
  descuentoProntoPagoPct: 5
};

// 4. PRECIOS UNITARIOS AL POR MAYOR (BOM)
export const UNIT_PRICES = {
  // Paneles Solares
  'Luxen, Monofacial 585/590W': 295661,
  'Luxen, Monofacial 625W': 318000,

  // Inversores
  'Inversor FOC Energy, 3KW, 24V, 120/240V': 1214752,
  'Inversor FOC Energy, 5KW, 48V, 120/240V': 1550000,
  'Inversor FOC Energy, 6.4KW, 48V, 120/240V': 1850000,
  'Hybrid Inverter Sosen, 8KW, 48V, 120/240V': 6600000,
  'Hybrid Inverter Sosen, 10KW, 48V, 120/240V': 6920000,
  'Hybrid Inverter Sosen, 12KW, 48V, 120/240V': 8000000,
  'Hybrid Inverter Sosen, 15KW, 48V, 120/240V': 8380000,
  'Hybrid Inv Deye 8KW Split Phase 120/240V': 7900000,
  'Hybrid Inv Deye 12KW Split Phase 120/240V': 9700000,

  // Baterías Litio LFP
  'Batería LFP FOC Energy, 12V, 1.25 KWh': 834866,
  'Batería LFP FOC Energy, 12V, 2.5 KWh': 1298681,
  'Batería LFP FOC Energy de 12V, 2.9 KWh': 1450000,
  'Batería LFP FOC Energy, 12V, 4 KWh': 1720000,
  'Batería LFP FOC Energy, 48V, 10 KWh': 5913634,
  'Batería LFP FOC Energy, 48V, 11 KWh': 5800000,
  'Batería LFP FOC Energy, 48V, 15 KWh': 6609355,
  'Batería LFP FOC Energy, 48V, 16 KWh': 6300000,

  // Protecciones DC (Combiner Box)
  'Combiner Box DC FOC Energy 1 in 1 out': 187459,
  'Combiner Box DC FOC Energy 2 in 1 out': 207752,
  'Combiner Box DC FOC Energy 3 in 1 out': 227243,
  'Combiner Box DC Suntree 1 in 1 out': 281030,
  'Combiner Box DC Suntree 2 in 1 out': 343482,
  'Combiner Box DC Suntree 3 in 1 out': 429352,
  'Combiner Box DC Suntree 4 in 1 out': 452771,
  'Combiner Box DC Suntree 5 in 1 out': 507416,
  'Combiner Box DC Suntree 2 in 2 out': 624512,
  'Combiner Box DC Suntree 3 in 3 out': 921155,

  // Estructura y Cableado
  'KIT soporte techo - 2 paneles': 157080,
  'Cable Fotovoltaico negro/rojo 6mm ': 4857
};

// 5. FACTORES DE DESCUENTO COMERCIAL / REFERIDO
export const KIT_DISCOUNT_FACTORS = {
  K1: 0.900,
  K2: 0.910,
  K3: 0.920,
  K4: 0.920,
  K5: 0.925,
  K6: 0.930,
  K7: 0.940,
  K8: 0.945,
  K9: 0.950,
  K10: 0.954
};

// 6. OPCIONES DE MOTORES (HP A WATTS)
export const HP_OPTIONS = [
  { v: '0', label: 'Sin motor' },
  { v: '0.25', label: '1/4 HP (186 W)' },
  { v: '0.33', label: '1/3 HP (249 W)' },
  { v: '0.5', label: '1/2 HP (373 W)' },
  { v: '0.75', label: '3/4 HP (559 W)' },
  { v: '1', label: '1 HP (746 W)' },
  { v: '1.5', label: '1.5 HP (1119 W)' },
  { v: '2', label: '2 HP (1492 W)' },
  { v: '3', label: '3 HP (2238 W)' },
  { v: '5', label: '5 HP (3730 W)' }
];

// 7. CATÁLOGOS AUXILIARES PARA EL PERSONALIZADOR MANUAL
export const INVERTER_MODELS_CATALOG = [
  { value: 'Inversor FOC Energy, 3KW, 24V, 120/240V', label: 'FOC Energy 3 kW (24V)', w: 3000, v: 24 },
  { value: 'Inversor FOC Energy, 5KW, 48V, 120/240V', label: 'FOC Energy 5 kW (48V)', w: 5000, v: 48 },
  { value: 'Inversor FOC Energy, 6.4KW, 48V, 120/240V', label: 'FOC Energy 6.4 kW (48V)', w: 6400, v: 48 },
  { value: 'Hybrid Inverter Sosen, 8KW, 48V, 120/240V', label: 'Sosen Híbrido 8 kW (48V)', w: 8000, v: 48 },
  { value: 'Hybrid Inverter Sosen, 10KW, 48V, 120/240V', label: 'Sosen Híbrido 10 kW (48V)', w: 10000, v: 48 },
  { value: 'Hybrid Inverter Sosen, 12KW, 48V, 120/240V', label: 'Sosen Híbrido 12 kW (48V)', w: 12000, v: 48 },
  { value: 'Hybrid Inverter Sosen, 15KW, 48V, 120/240V', label: 'Sosen Híbrido 15 kW (48V)', w: 15000, v: 48 },
  { value: 'Hybrid Inv Deye 8KW Split Phase 120/240V', label: 'Deye Híbrido 8 kW (48V)', w: 8000, v: 48 },
  { value: 'Hybrid Inv Deye 12KW Split Phase 120/240V', label: 'Deye Híbrido 12 kW (48V)', w: 12000, v: 48 }
];

export const BATTERY_MODELS_CATALOG = [
  { value: 'Batería LFP FOC Energy de 12V, 2.9 KWh', label: 'FOC Energy 12.8V · 2.9 kWh LFP', kwh: 2.9, v: 12 },
  { value: 'Batería LFP FOC Energy, 12V, 4 KWh', label: 'FOC Energy 12.8V · 4.0 kWh LFP', kwh: 4.0, v: 12 },
  { value: 'Batería LFP FOC Energy, 48V, 11 KWh', label: 'FOC Energy 51.2V · 11.0 kWh LFP (LC230)', kwh: 11.0, v: 48 },
  { value: 'Batería LFP FOC Energy, 48V, 16 KWh', label: 'FOC Energy 51.2V · 16.0 kWh LFP (LC300)', kwh: 16.0, v: 48 }
];

export const COMBINER_MODELS_CATALOG = [
  { value: 'Combiner Box DC Suntree 2 in 1 out', label: 'Suntree 2 in 1 out' },
  { value: 'Combiner Box DC Suntree 3 in 1 out', label: 'Suntree 3 in 1 out' },
  { value: 'Combiner Box DC Suntree 4 in 1 out', label: 'Suntree 4 in 1 out' },
  { value: 'Combiner Box DC Suntree 5 in 1 out', label: 'Suntree 5 in 1 out' },
  { value: 'Combiner Box DC Suntree 2 in 2 out', label: 'Suntree 2 in 2 out' },
  { value: 'Combiner Box DC Suntree 3 in 3 out', label: 'Suntree 3 in 3 out' },
  { value: 'Combiner Box DC FOC Energy 1 in 1 out', label: 'FOC Energy 1 in 1 out' },
  { value: 'Combiner Box DC FOC Energy 2 in 1 out', label: 'FOC Energy 2 in 1 out' }
];

// 8. LAS 10 ECUACIONES CALIBRADAS DE EXCEL
export const KIT_EXCEL_FORMULAS = {
  K1: { mult: 2.35, fijo1: 400000, fijo2: 0, minW: 0, maxW: 3000 },
  K2: { mult: 2.30, fijo1: 400000, fijo2: 0, minW: 3000, maxW: 4000 },
  K3: { mult: 2.20, fijo1: 400000, fijo2: 0, minW: 4000, maxW: 5000 },
  K4: { mult: 2.20, fijo1: 400000, fijo2: 0, minW: 5000, maxW: 6000 },
  K5: { mult: 2.15, fijo1: 400000, fijo2: 0, minW: 6000, maxW: 6400 },
  K6: { mult: 2.10, fijo1: 400000, fijo2: 0, minW: 6400, maxW: 7500 },
  K7: { mult: 1.96, fijo1: 400000, fijo2: 0, minW: 7500, maxW: 9000 },
  K8: { mult: 1.92, fijo1: 400000, fijo2: 0, minW: 9000, maxW: 11000 },
  K9: { mult: 1.88, fijo1: 400000, fijo2: 0, minW: 11000, maxW: 13500 },
  K10: { mult: 1.85, fijo1: 400000, fijo2: 0, minW: 13500, maxW: 99999 }
};

// 9. CATÁLOGO COMERCIAL OFICIAL DE KITS (K1 a K10)
export const KITS = [
  {
    id: 'K1',
    nombre: 'KIT Hogar Mínimo',
    paneles: 4,
    panelW: 625,
    panelModelo: 'Luxen, Monofacial 625W',
    totalWp: 2500,
    inversor: 'Inversor FOC Energy, 3KW, 24V, 120/240V',
    inversorW: 3000,
    voltaje: 24,
    bateriaCant: 2,
    bateriaModelo: 'Batería LFP FOC Energy de 12V, 2.9 KWh',
    totalBateriaKwh: 5.8,
    proteccionDC: 'Combiner Box DC Suntree 2 in 1 out',
    soporte: 2,
    cable: 35,
    precioFinal: 15010000,
    precioConDescuento: 13509000
  },
  {
    id: 'K2',
    nombre: 'KIT Hogar Mínimo +',
    paneles: 6,
    panelW: 585,
    panelModelo: 'Luxen, Monofacial 585/590W',
    totalWp: 3510,
    inversor: 'Inversor FOC Energy, 3KW, 24V, 120/240V',
    inversorW: 3000,
    voltaje: 24,
    bateriaCant: 2,
    bateriaModelo: 'Batería LFP FOC Energy, 12V, 4 KWh',
    totalBateriaKwh: 8.0,
    proteccionDC: 'Combiner Box DC Suntree 3 in 1 out',
    soporte: 3,
    cable: 70,
    precioFinal: 18040000,
    precioConDescuento: 16416400
  },
  {
    id: 'K3',
    nombre: 'KIT Hogar Básico',
    paneles: 6,
    panelW: 625,
    panelModelo: 'Luxen, Monofacial 625W',
    totalWp: 3750,
    inversor: 'Inversor FOC Energy, 5KW, 48V, 120/240V',
    inversorW: 5000,
    voltaje: 48,
    bateriaCant: 1,
    bateriaModelo: 'Batería LFP FOC Energy, 48V, 11 KWh',
    totalBateriaKwh: 11.0,
    proteccionDC: 'Combiner Box DC Suntree 3 in 1 out',
    soporte: 3,
    cable: 70,
    precioFinal: 23500000,
    precioConDescuento: 21620000
  },
  {
    id: 'K4',
    nombre: 'KIT Hogar Básico +',
    paneles: 8,
    panelW: 625,
    panelModelo: 'Luxen, Monofacial 625W',
    totalWp: 5000,
    inversor: 'Inversor FOC Energy, 5KW, 48V, 120/240V',
    inversorW: 5000,
    voltaje: 48,
    bateriaCant: 1,
    bateriaModelo: 'Batería LFP FOC Energy, 48V, 11 KWh',
