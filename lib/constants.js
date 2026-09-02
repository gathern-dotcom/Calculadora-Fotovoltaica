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
  24: [2.5, 2.9, 4],
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

export const SINERGY_LOGO = 'data:image/webp;base64,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";

if "export const SINERGY_SUN_ICON" not in constants_code:
    with open('/working_dir/c_f66204f844a93894/dimensionador-nextjs/lib/constants.js', 'a') as f:
        f.write(f"\nexport const SINERGY_SUN_ICON = '{sun_src}';\n")
EOF
}
