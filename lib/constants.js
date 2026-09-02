// =========================================================================
// CONSTANTES Y CATÁLOGOS — SINERGY SOLUCIONES INTEGRALES
// =========================================================================

export const KITS = [
  {
    id: 'K1',
    nombre: 'KIT Hogar Mínimo',
    paneles: 4,
    panelW: 625,
    inversor: 'FOC Energy 3KW, 24V, 120/240V',
    inversorW: 3000,
    bateriaModelo: 'LFP FOC Energy 12.8V, 200Ah (2.56 kWh)',
    bateriaCant: 2,
    bateriaKwhUnit: 2.56,
    proteccionDC: 'Combiner Box DC Suntree 2 in 1 out',
    soporte: 2,
    cable: 35
  },
  {
    id: 'K2',
    nombre: 'KIT Hogar Mínimo +',
    paneles: 6,
    panelW: 585,
    inversor: 'FOC Energy 3KW, 24V, 120/240V',
    inversorW: 3000,
    bateriaModelo: 'LFP FOC Energy 12.8V, 300Ah (3.84 kWh)',
    bateriaCant: 2,
    bateriaKwhUnit: 3.84,
    proteccionDC: 'Combiner Box DC Suntree 3 in 1 out',
    soporte: 3,
    cable: 70
  },
  {
    id: 'K3',
    nombre: 'KIT Hogar Básico',
    paneles: 6,
    panelW: 625,
    inversor: 'FOC Energy 5KW, 48V, 120/240V',
    inversorW: 5000,
    bateriaModelo: 'LFP FOC Energy 51.2V, 230Ah (11.78 kWh)',
    bateriaCant: 1,
    bateriaKwhUnit: 11.78,
    proteccionDC: 'Combiner Box DC Suntree 3 in 1 out',
    soporte: 3,
    cable: 70
  },
  {
    id: 'K4',
    nombre: 'KIT Hogar Básico +',
    paneles: 8,
    panelW: 625,
    inversor: 'FOC Energy 5KW, 48V, 120/240V',
    inversorW: 5000,
    bateriaModelo: 'LFP FOC Energy 51.2V, 230Ah (11.78 kWh)',
    bateriaCant: 1,
    bateriaKwhUnit: 11.78,
    proteccionDC: 'Combiner Box DC Suntree 4 in 1 out',
    soporte: 4,
    cable: 100
  },
  {
    id: 'K5',
    nombre: 'KIT Hogar Básico2',
    paneles: 9,
    panelW: 625,
    inversor: 'FOC Energy 6.4KW, 48V, 120/240V',
    inversorW: 6400,
    bateriaModelo: 'LFP FOC Energy 51.2V, 230Ah (11.78 kWh)',
    bateriaCant: 1,
    bateriaKwhUnit: 11.78,
    proteccionDC: 'Combiner Box DC Suntree 3 in 1 out',
    soporte: 5,
    cable: 74
  },
  {
    id: 'K6',
    nombre: 'KIT Hogar Max',
    paneles: 12,
    panelW: 585,
    inversor: 'FOC Energy 6.4KW, 48V, 120/240V',
    inversorW: 6400,
    bateriaModelo: 'LFP FOC Energy 51.2V, 314Ah (16.08 kWh)',
    bateriaCant: 1,
    bateriaKwhUnit: 16.08,
    proteccionDC: 'Combiner Box DC Suntree 4 in 1 out',
    soporte: 6,
    cable: 110
  },
  {
    id: 'K7',
    nombre: 'KIT Hogar Full',
    paneles: 14,
    panelW: 625,
    inversor: 'Hybrid Inverter Sosen 8KW, 48V, 120/240V',
    inversorW: 8000,
    bateriaModelo: 'LFP FOC Energy 51.2V, 230Ah (11.78 kWh)',
    bateriaCant: 2,
    bateriaKwhUnit: 11.78,
    proteccionDC: 'Combiner Box DC Suntree 2 in 2 out',
    soporte: 7,
    cable: 70
  },
  {
    id: 'K8',
    nombre: 'KIT Hogar Full 2',
    paneles: 17,
    panelW: 625,
    inversor: 'Hybrid Inverter Sosen 10KW, 48V, 120/240V',
    inversorW: 10000,
    bateriaModelo: 'LFP FOC Energy 51.2V, 314Ah (16.08 kWh)',
    bateriaCant: 2,
    bateriaKwhUnit: 16.08,
    proteccionDC: 'Combiner Box DC Suntree 2 in 2 out',
    soporte: 9,
    cable: 74
  },
  {
    id: 'K9',
    nombre: 'KIT Hogar Full +',
    paneles: 21,
    panelW: 625,
    inversor: 'Hybrid Inverter Sosen 12KW, 48V, 120/240V',
    inversorW: 12000,
    bateriaModelo: 'LFP FOC Energy 51.2V, 230Ah (11.78 kWh)',
    bateriaCant: 2,
    bateriaKwhUnit: 11.78,
    proteccionDC: 'Combiner Box DC Suntree 3 in 3 out',
    soporte: 11,
    cable: 98
  },
  {
    id: 'K10',
    nombre: 'KIT Hogar Full + VE',
    paneles: 27,
    panelW: 625,
    inversor: 'Hybrid Inverter Sosen 15KW, 48V, 120/240V',
    inversorW: 15000,
    bateriaModelo: 'LFP FOC Energy 51.2V, 314Ah (16.08 kWh)',
    bateriaCant: 3,
    bateriaKwhUnit: 16.08,
    proteccionDC: 'Combiner Box DC Suntree 3 in 3 out',
    soporte: 14,
    cable: 98
  }
].map(k => ({
  ...k,
  totalWp: k.paneles * k.panelW,
  totalBateriaKwh: k.bateriaCant * k.bateriaKwhUnit
}));

export const PRICE_LIST = {
  'Inversor FOC Energy, 3KW, 24V, 120/240V': 1214752,
  'Inversor FOC Energy, 5KW, 48V, 120/240V': 1550000,
  'Inversor FOC Energy, 6.4KW, 48V, 120/240V': 1850000,
  'Hybrid Inverter Sosen, 8KW, 48V, 120/240V': 6600000,
  'Hybrid Inverter Sosen, 10KW, 48V, 120/240V': 6920000,
  'Hybrid Inverter Sosen, 12KW, 48V, 120/240V': 8000000,
  'Hybrid Inverter Sosen, 15KW, 48V, 120/240V': 8380000,
  'Cable Fotovoltaico negro/rojo 6mm (por metro)': 4857,
  'Combiner Box DC Suntree 2 in 2 out': 624512,
  'Combiner Box DC Suntree 3 in 3 out': 921155,
  'Combiner Box DC FOC Energy 1 in 1 out': 187459,
  'Combiner Box DC FOC Energy 2 in 1 out': 207752,
  'Combiner Box DC FOC Energy 3 in 1 out': 227243,
  'Combiner Box DC Suntree 1 in 1 out': 281030,
  'Combiner Box DC Suntree 2 in 1 out': 343482,
  'Combiner Box DC Suntree 3 in 1 out': 429352,
  'Combiner Box DC Suntree 4 in 1 out': 452771,
  'Combiner Box DC Suntree 5 in 1 out': 507416,
  'Batería LFP FOC Energy, 12V, 2.5 kWh': 1298681,
  'Batería LFP FOC Energy, 12V, 2.9 kWh': 1450000,
  'Batería LFP FOC Energy, 12V, 4 kWh': 1720000,
  'Batería LFP FOC Energy, 48V, 10 kWh': 5913634,
  'Batería LFP FOC Energy, 48V, 11 kWh': 5800000,
  'Batería LFP FOC Energy, 48V, 15 kWh': 6609355,
  'Batería LFP FOC Energy, 48V, 16 kWh': 6300000,
  'Luxen, Monofacial 585/590W': 295661,
  'Luxen, Monofacial 625W': 318000,
  'KIT soporte techo - 2 paneles': 157080
};

export const PRICE_FORMULAS = {
  K1:  { multiplicador: 2.35, suma: 400000, multiplicadorFinal: 1.11 },
  K2:  { multiplicador: 2.30, suma: 400000, multiplicadorFinal: 1.108 },
  K3:  { multiplicador: 2.20, suma: 400000, multiplicadorFinal: 1.106 },
  K4:  { multiplicador: 2.20, suma: 400000, multiplicadorFinal: 1.104 },
  K5:  { multiplicador: 2.15, suma: 400000, multiplicadorFinal: 1.102 },
  K6:  { multiplicador: 2.10, suma: 400000, multiplicadorFinal: 1.094 },
  K7:  { multiplicador: 1.96, suma: 400000, multiplicadorFinal: 1.093 },
  K8:  { multiplicador: 1.92, suma: 400000, multiplicadorFinal: 1.092 },
  K9:  { multiplicador: 1.88, suma: 400000, multiplicadorFinal: 1.091 },
  K10: { multiplicador: 1.85, suma: 400000, multiplicadorFinal: 1.09 }
};

export const INVERTER_PRICES = {
  3000: 1214752,
  5000: 1550000,
  6400: 1850000,
  8000: 6600000,
  10000: 6920000,
  12000: 8000000,
  15000: 8380000
};

export const BATTERY_OPTIONS_BY_VOLTAGE = {
  24: Array(2.56, 3.84),
  48: [5.12, 11.78, 16.08]
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
  costoKm: 1350.00, // Ajustado a camioneta 4x4 en vía terciaria/rural
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
