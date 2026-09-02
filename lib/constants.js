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
    bateriaModelo: 'LFP FOC Energy 12V, 2.9 kWh',
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
    inversor: 'FOC Energy 3KW, 24V, 120/240V',
    inversorW: 3000,
    bateriaModelo: 'LFP FOC Energy 12V, 4 kWh',
    bateriaCant: 2,
    bateriaKwhUnit: 4,
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
    bateriaModelo: 'LFP FOC Energy 48V, 11 kWh',
    bateriaCant: 1,
    bateriaKwhUnit: 11,
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
    bateriaModelo: 'LFP FOC Energy 48V, 11 kWh',
    bateriaCant: 1,
    bateriaKwhUnit: 11,
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
    bateriaModelo: 'LFP FOC Energy 48V, 11 kWh',
    bateriaCant: 1,
    bateriaKwhUnit: 11,
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
    bateriaModelo: 'LFP FOC Energy 48V, 16 kWh',
    bateriaCant: 1,
    bateriaKwhUnit: 16,
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
    bateriaModelo: 'LFP FOC Energy 48V, 11 kWh',
    bateriaCant: 2,
    bateriaKwhUnit: 11,
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
    bateriaModelo: 'LFP FOC Energy 48V, 16 kWh',
    bateriaCant: 2,
    bateriaKwhUnit: 16,
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
    bateriaModelo: 'LFP FOC Energy 48V, 11 kWh',
    bateriaCant: 2,
    bateriaKwhUnit: 11,
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
    bateriaModelo: 'LFP FOC Energy 48V, 16 kWh',
    bateriaCant: 3,
    bateriaKwhUnit: 16,
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
  'Batería LFP FOC Energy, 12V, 1.25 kWh': 834866,
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
  24: Array(2.5, 2.9, 4),
  48: [10, 11, 15, 16]
};

export const OPTIMIZED_INVERTERS = [
  { w: 3000, brand: 'FOC Energy', type: 'foc', seriesLen: 2, maxPanels: 4 },
  { w: 5000, brand: 'FOC Energy', type: 'foc', seriesLen: 2, maxPanels: 10 },
  { w: 6400, brand: 'FOC Energy', type: 'foc', seriesLen: 3, maxPanels: 12 },
  { w: 8000, brand: 'Sosen', type: 'sosen', trackers: 3, maxPanels: 18 },
  { w: 10000, brand: 'Sosen', type: 'sosen', trackers: 3, maxPanels: 24 },
  { w: 12000, brand: 'Sosen', type: 'sosen', trackers: 3, maxPanels: 27 },
  { w: 15000, brand: 'Sosen', type: 'sosen', trackers: 3, maxPanels: 30 }
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
  costoKm: 966.67,
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

// =========================================================================
// RECURSOS GRÁFICOS ORIGINALES DE SINERGY
// =========================================================================

export const SINERGY_LOGO = 'data:image/webp;base64,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';

export const SINERGY_SUN_ICON = 'data:image/webp;base64,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";
