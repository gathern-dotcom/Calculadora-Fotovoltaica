// =========================================================================
// CONSTANTES Y CATÁLOGOS — SINERGY SOLUCIONES INTEGRALES (SEPTIEMBRE 2026)
// =========================================================================
export const WHATSAPP_COMERCIAL = '3204230843';
export const WHATSAPP_COMERCIAL_DISPLAY = '+57 320 423 0843';

export const KITS = [
  {
    id: 'K1',
    nombre: 'KIT Hogar Mínimo',
    paneles: 4,
    panelW: 625,
    inversor: 'Inversor FOC Energy, 3KW, 24V, 120/240V',
    inversorW: 3000,
    bateriaModelo: 'Batería LFP FOC Energy de 12V, 2.9 KWh',
    bateriaCant: 2,
    bateriaKwhUnit: 2.9,
    proteccionDC: 'Combiner Box DC Suntree 2 in 1 out',
    soporte: 2,
    cable: 35
  },
  {
    id: 'K2',
    nombre: 'KIT Hogar Mínimo +',
    paneles: 6,
    panelW: 585,
    inversor: 'Inversor FOC Energy, 3KW, 24V, 120/240V',
    inversorW: 3000,
    bateriaModelo: 'Batería LFP FOC Energy, 12V, 4 KWh',
    bateriaCant: 2,
    bateriaKwhUnit: 4.0,
    proteccionDC: 'Combiner Box DC Suntree 3 in 1 out',
    soporte: 3,
    cable: 70
  },
  {
    id: 'K3',
    nombre: 'KIT Hogar Básico',
    paneles: 6,
    panelW: 625,
    inversor: 'Inversor FOC Energy, 5KW, 48V, 120/240V',
    inversorW: 5000,
    bateriaModelo: 'Batería LFP FOC Energy, 48V, 11 KWh',
    bateriaCant: 1,
    bateriaKwhUnit: 11.0,
    proteccionDC: 'Combiner Box DC Suntree 3 in 1 out',
    soporte: 3,
    cable: 70
  },
  {
    id: 'K4',
    nombre: 'KIT Hogar Básico +',
    paneles: 8,
    panelW: 625,
    inversor: 'Inversor FOC Energy, 5KW, 48V, 120/240V',
    inversorW: 5000,
    bateriaModelo: 'Batería LFP FOC Energy, 48V, 11 KWh',
    bateriaCant: 1,
    bateriaKwhUnit: 11.0,
    proteccionDC: 'Combiner Box DC Suntree 4 in 1 out',
    soporte: 4,
    cable: 100
  },
  {
    id: 'K5',
    nombre: 'KIT Hogar Básico2',
    paneles: 9,
    panelW: 625,
    inversor: 'Inversor FOC Energy, 6.4KW, 48V, 120/240V',
    inversorW: 6400,
    bateriaModelo: 'Batería LFP FOC Energy, 48V, 11 KWh',
    bateriaCant: 1,
    bateriaKwhUnit: 11.0,
    proteccionDC: 'Combiner Box DC Suntree 3 in 1 out',
    soporte: 5,
    cable: 74
  },
  {
    id: 'K6',
    nombre: 'KIT Hogar Max',
    paneles: 12,
    panelW: 585,
    inversor: 'Inversor FOC Energy, 6.4KW, 48V, 120/240V',
    inversorW: 6400,
    bateriaModelo: 'Batería LFP FOC Energy, 48V, 16 KWh',
    bateriaCant: 1,
    bateriaKwhUnit: 16.0,
    proteccionDC: 'Combiner Box DC Suntree 4 in 1 out',
    soporte: 6,
    cable: 110
  },
  {
    id: 'K7',
    nombre: 'KIT Hogar Full',
    paneles: 14,
    panelW: 625,
    inversor: 'Hybrid Inverter Sosen, 8KW, 48V, 120/240V',
    inversorW: 8000,
    bateriaModelo: 'Batería LFP FOC Energy, 48V, 11 KWh',
    bateriaCant: 2,
    bateriaKwhUnit: 11.0,
    proteccionDC: 'Combiner Box DC Suntree 2 in 2 out',
    soporte: 7,
    cable: 70
  },
  {
    id: 'K8',
    nombre: 'KIT Hogar Full 2',
    paneles: 17,
    panelW: 625,
    inversor: 'Hybrid Inverter Sosen, 10KW, 48V, 120/240V',
    inversorW: 10000,
    bateriaModelo: 'Batería LFP FOC Energy, 48V, 11 KWh',
    bateriaCant: 2,
    bateriaKwhUnit: 11.0,
    proteccionDC: 'Combiner Box DC Suntree 2 in 2 out',
    soporte: 8.5,
    cable: 74
  },
  {
    id: 'K9',
    nombre: 'KIT Hogar Full +',
    paneles: 21,
    panelW: 625,
    inversor: 'Hybrid Inverter Sosen, 12KW, 48V, 120/240V',
    inversorW: 12000,
    bateriaModelo: 'Batería LFP FOC Energy, 48V, 16 KWh',
    bateriaCant: 2,
    bateriaKwhUnit: 16.0,
    proteccionDC: 'Combiner Box DC Suntree 3 in 3 out',
    soporte: 10.5,
    cable: 98
  },
  {
    id: 'K10',
    nombre: 'KIT Hogar Full + VE',
    paneles: 27,
    panelW: 625,
    inversor: 'Hybrid Inverter Sosen, 15KW, 48V, 120/240V',
    inversorW: 15000,
    bateriaModelo: 'Batería LFP FOC Energy, 48V, 16 KWh',
    bateriaCant: 3,
    bateriaKwhUnit: 16.0,
    proteccionDC: 'Combiner Box DC Suntree 3 in 3 out',
    soporte: 13.5,
    cable: 110
  }
].map(k => ({
  ...k,
  totalWp: k.paneles * k.panelW,
  totalBateriaKwh: k.bateriaCant * k.bateriaKwhUnit
}));

// LISTA DE PRECIOS MAYORISTA OFICIAL (EXCEL SEPTIEMBRE 2026)
export const PRICE_LIST = {
  // Paneles
  'Luxen, Monofacial 585/590W': 310000,
  'Luxen, Monofacial 625W': 342016.25,

  // Soportes y Rieles
  'KIT soporte techo - 2 paneles': 147262.5,
  'Aluminium Rail 2.4m': 48000.14,
  'Rail Connector': 5839.93,
  'End Clamp': 1963.5,
  'Mid Clamp': 1905.49,
  'L-foot + HangerBolt': 7296.19,
  'Grouding Cloip': 227.59,

  // Inversores FOC Energy
  'Inversor FOC Energy, 3KW, 24V, 120/240V': 1096865,
  'Inversor FOC Energy, 5KW, 48V, 120/240V': 1331907.5,
  'Inversor FOC Energy, 6.4KW, 48V, 120/240V': 1510987.5,

  // Inversores SOSEN Híbridos (Split Phase 120/240V)
  'Hybrid Inverter Sosen, 8KW, 48V, 120/240V': 5679882.35,
  'Hybrid Inverter Sosen, 10KW, 48V, 120/240V': 6604891.76,
  'Hybrid Inverter Sosen, 12KW, 48V, 120/240V': 6869952.94,
  'Hybrid Inverter Sosen, 15KW, 48V, 120/240V': 7194517.65,

  // Inversores Deye Híbridos
  'Hybrid Inv Deye 8KW Split Phase 120/240V': 7900000,
  'Hybrid Inv Deye 12KW Split Phase 120/240V': 9700000,

  // Baterías Litio LFP 12.8V
  'Batería LFP FOC Energy, 12V, 1.25 KWh': 756728.44,
  'Batería LFP FOC Energy, 12V, 2.5 KWh': 1298680.5,
  'Batería LFP FOC Energy, 12V, 2.9 kWh': 1212035.83,
  'Batería LFP FOC Energy de 12V, 2.9 KWh': 1212035.83,
  'Batería LFP FOC Energy, 12V, 4 kWh': 1398502.88,
  'Batería LFP FOC Energy, 12V, 4 KWh': 1398502.88,

  // Baterías Litio LFP 51.2V (48V)
  'Batería LFP FOC Energy, 48V, 10 KWh': 5913634,
  'Batería LFP FOC Energy, 48V, 11 kWh': 4794867,
  'Batería LFP FOC Energy, 48V, 11 KWh': 4794867,
  'Batería LFP FOC Energy, 48V, 15 KWh': 6609355,
  'Batería LFP FOC Energy, 48V, 16 kWh': 5227736.94,
  'Batería LFP FOC Energy, 48V, 16 KWh': 5227736.94,

  // Cables
  'Cable Fotovoltaico negro/rojo 4mm': 3227.88,
  'Cable Fotovoltaico negro/rojo 6mm': 4779.34,
  'Cable Fotovoltaico negro/rojo 6mm ': 4779.34,
  'Cable Fotovoltaico negro/rojo 6mm (por metro)': 4779.34,
  'Cable Fotovoltaico negro/rojo 10mm': 9850.23,
  'Cable Bateria 200A': 45764.43,
  'Cable Bateria 100A': 25532.94,

  // Combiner Boxes
  'Combiner Box DC Suntree 2 in 2 out': 523766.6,
  'Combiner Box DC Suntree 3 in 3 out': 772555.44,
  'Combiner Box DC FOC Energy 1 in 1 out': 238343.61,
  'Combiner Box DC FOC Energy 2 in 1 out': 276786.56,
  'Combiner Box DC FOC Energy 3 in 1 out': 258437.5,
  'Combiner Box DC Suntree 1 in 1 out': 239776.08,
  'Combiner Box DC Suntree 2 in 1 out': 288072.23,
  'Combiner Box DC Suntree 3 in 1 out': 399923.3,
  'Combiner Box DC Suntree 4 in 1 out': 379730.49,
  'Combiner Box DC Suntree 5 in 1 out': 436258.46
};

// FÓRMULAS OFICIALES DE EXCEL POR CADA KIT (K1 A K10)
export const KIT_EXCEL_FORMULAS = {
  K1:  { col: 'C10', mult: 2.35, fijo1: 652000, fijo2: 796000 },
  K2:  { col: 'E10', mult: 2.30, fijo1: 652000, fijo2: 796000 },
  K3:  { col: 'G10', mult: 2.20, fijo1: 652000, fijo2: 931000 },
  K4:  { col: 'I10', mult: 2.20, fijo1: 600000, fijo2: 1448000 },
  K5:  { col: 'K10', mult: 2.15, fijo1: 652000, fijo2: 1448000 },
  K6:  { col: 'M10', mult: 2.10, fijo1: 652000, fijo2: 2607000 },
  K7:  { col: 'O10', mult: 1.96, fijo1: 765000, fijo2: 2607000 },
  K8:  { col: 'Q10', mult: 1.92, fijo1: 765000, fijo2: 2607000 },
  K9:  { col: 'S10', mult: 1.88, fijo1: 765000, fijo2: 3339000 },
  K10: { col: 'U10', mult: 1.85, fijo1: 765000, fijo2: 3339000 }
};

export const INVERTER_PRICES = {
  3000: 1096865,
  5000: 1331907.5,
  6400: 1510987.5,
  8000: 5679882.35,
  10000: 6604891.76,
  12000: 6869952.94,
  15000: 7194517.65
};

export const BATTERY_OPTIONS_BY_VOLTAGE = {
  24: [2.9, 4.0],
  48: [11.0, 16.0]
};

export const OPTIMIZED_INVERTERS = [
  { w: 3000, brand: 'FOC Energy', type: 'foc', seriesLen: 2, maxPanels: 5 },
  { w: 5000, brand: 'FOC Energy', type: 'foc', seriesLen: 2, maxPanels: 10 },
  { w: 6400, brand: 'FOC Energy', type: 'foc', seriesLen: 3, maxPanels: 12 },
  { w: 8000, brand: 'Sosen', type: 'sosen', trackers: 3, maxPanels: 19, maxPerString: 10 },
  { w: 10000, brand: 'Sosen', type: 'sosen', trackers: 3, maxPanels: 24, maxPerString: 10 },
  { w: 12000, brand: 'Sosen', type: 'sosen', trackers: 3, maxPanels: 28, maxPerString: 10 },
  { w: 15000, brand: 'Sosen', type: 'sosen', trackers: 3, maxPanels: 36, maxPerString: 10 }
];

export const HP_OPTIONS = [
  { v: '0', label: '0 HP' },
  { v: '0.25', label: '0,25 HP' },
  { v: '0.5', label: '0,5 HP' },
  { v: '0.75', label: '0,75 HP' },
  { v: '1', label: '1 HP' },
  { v: '1.5', label: '1,5 HP' },
  { v: '2', label: '2 HP' },
  { v: '3', label: '3 HP' },
  { v: '5', label: '5 HP' },
  { v: '7.5', label: '7,5 HP' },
  { v: '10', label: '10 HP' },
  { v: '15', label: '15 HP' },
  { v: '20', label: '20 HP' },
  { v: '25', label: '25 HP' },
  { v: '30', label: '30 HP' },
  { v: '40', label: '40 HP' },
  { v: '50', label: '50 HP' }
];

export const DEFAULT_BUSINESS_PARAMS = {
  costoManoObraDia: 103396.60,
  costoKm: 1350.00,
  contingenciaPct: 10,
  coordinacionPct: 5,
  tarifaMinima: 1600000,
  margenInstalacionPct: 40,
  margenMinimoTotalPct: 35,
  margenObjetivoTotalPct: 40,
  ivaPct: 0
};

export const DEFAULT_INSTALL_PROJECT_PARAMS = {
  personas: 2,
  dias: 2,
  km: 80,
  viatico: 45000,
  complejidad: 0,
  comision: 0
};

export const DEFAULT_APPLIANCES = [
  { name: 'Refrigerador', power: 150, qty: 1, hours: 24, hp: 0 },
  { name: 'Bombillos LED', power: 10, qty: 6, hours: 5, hp: 0 },
  { name: 'Televisor', power: 100, qty: 1, hours: 4, hp: 0 },
  { name: 'Bomba de agua', power: 750, qty: 1, hours: 1, hp: 1 }
];

export const CABLE_METERS_PER_PANEL = 6;

export const INVERTER_MODELS_CATALOG = [
  { label: 'Inversor FOC Energy 3KW (24V)', value: 'Inversor FOC Energy, 3KW, 24V, 120/240V', w: 3000, v: 24, maxKwp: 3.2 },
  { label: 'Inversor FOC Energy 5KW (48V)', value: 'Inversor FOC Energy, 5KW, 48V, 120/240V', w: 5000, v: 48, maxKwp: 6.4 },
  { label: 'Inversor FOC Energy 6.4KW (48V)', value: 'Inversor FOC Energy, 6.4KW, 48V, 120/240V', w: 6400, v: 48, maxKwp: 6.4 },
  { label: 'Inversor SOSEN Híbrido 8KW (48V)', value: 'Hybrid Inverter Sosen, 8KW, 48V, 120/240V', w: 8000, v: 48, maxKwp: 12.0 },
  { label: 'Inversor SOSEN Híbrido 10KW (48V)', value: 'Hybrid Inverter Sosen, 10KW, 48V, 120/240V', w: 10000, v: 48, maxKwp: 15.0 },
  { label: 'Inversor SOSEN Híbrido 12KW (48V)', value: 'Hybrid Inverter Sosen, 12KW, 48V, 120/240V', w: 12000, v: 48, maxKwp: 18.0 },
  { label: 'Inversor SOSEN Híbrido 15KW (48V)', value: 'Hybrid Inverter Sosen, 15KW, 48V, 120/240V', w: 15000, v: 48, maxKwp: 22.5 },
  { label: 'Inversor DEYE Híbrido 8KW (48V)', value: 'Hybrid Inv Deye 8KW Split Phase 120/240V', w: 8000, v: 48, maxKwp: 10.4 },
  { label: 'Inversor DEYE Híbrido 12KW (48V)', value: 'Hybrid Inv Deye 12KW Split Phase 120/240V', w: 12000, v: 48, maxKwp: 15.6 }
];

export const BATTERY_MODELS_CATALOG = [
  { label: 'Batería LFP FOC Energy 12.8V, 2.9 kWh (200Ah)', value: 'Batería LFP FOC Energy de 12V, 2.9 KWh', kwh: 2.56, v: 12 },
  { label: 'Batería LFP FOC Energy 12.8V, 4.0 kWh (300Ah)', value: 'Batería LFP FOC Energy, 12V, 4 KWh', kwh: 3.84, v: 12 },
  { label: 'Batería LFP FOC Energy 51.2V, 11 kWh (230Ah)', value: 'Batería LFP FOC Energy, 48V, 11 KWh', kwh: 11.78, v: 48 },
  { label: 'Batería LFP FOC Energy 51.2V, 16 kWh (314Ah)', value: 'Batería LFP FOC Energy, 48V, 16 KWh', kwh: 16.08, v: 48 }
];

export const COMBINER_MODELS_CATALOG = [
  { label: 'Combiner Box Suntree 2 in 1 out', value: 'Combiner Box DC Suntree 2 in 1 out' },
  { label: 'Combiner Box Suntree 3 in 1 out', value: 'Combiner Box DC Suntree 3 in 1 out' },
  { label: 'Combiner Box Suntree 4 in 1 out', value: 'Combiner Box DC Suntree 4 in 1 out' },
  { label: 'Combiner Box Suntree 5 in 1 out', value: 'Combiner Box DC Suntree 5 in 1 out' },
  { label: 'Combiner Box Suntree 2 in 2 out', value: 'Combiner Box DC Suntree 2 in 2 out' },
  { label: 'Combiner Box Suntree 3 in 3 out', value: 'Combiner Box DC Suntree 3 in 3 out' },
  { label: 'Combiner Box FOC Energy 1 in 1 out', value: 'Combiner Box DC FOC Energy 1 in 1 out' },
  { label: 'Combiner Box FOC Energy 2 in 1 out', value: 'Combiner Box DC FOC Energy 2 in 1 out' },
  { label: 'Combiner Box FOC Energy 3 in 1 out', value: 'Combiner Box DC FOC Energy 3 in 1 out' }
];
