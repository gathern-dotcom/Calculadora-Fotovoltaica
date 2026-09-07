// lib/solar-engine.js

import {
  UNIT_PRICES,
  KIT_DISCOUNT_FACTORS,
  KIT_EXCEL_FORMULAS,
  KITS,
  HP_OPTIONS,
  BATTERY_MODELS_CATALOG
} from './constants';

/**
 * Formateador numérico estándar para moneda COP y separador de miles.
 */
export function fmt(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Conversión de HP a Watts (1 HP = 746 W nominal).
 */
export function hpToWatts(hp) {
  if (!hp || isNaN(hp)) return 0;
  return Math.round(parseFloat(hp) * 745.7);
}

/**
 * Encuentra el valor de HP más cercano a partir de una potencia en Watts.
 */
export function wattsToClosestHp(watts) {
  if (!watts || watts <= 0) return 0;
  const numericOptions = HP_OPTIONS
    .map(o => parseFloat(o.v))
    .filter(v => v > 0);

  let closest = numericOptions[0];
  let minDiff = Math.abs(hpToWatts(closest) - watts);

  for (const hp of numericOptions) {
    const diff = Math.abs(hpToWatts(hp) - watts);
    if (diff < minDiff) {
      minDiff = diff;
      closest = hp;
    }
  }
  return closest;
}

/**
 * Selecciona la fórmula calibrada de Excel según la potencia total de inversores.
 */
export function getExcelFormulaForInverter(totalInverterW) {
  const w = parseFloat(totalInverterW) || 5000;
  if (w <= 3000) return { id: 'K1', ...KIT_EXCEL_FORMULAS.K1 };
  if (w <= 4000) return { id: 'K2', ...KIT_EXCEL_FORMULAS.K2 };
  if (w <= 5000) return { id: 'K3', ...KIT_EXCEL_FORMULAS.K3 };
  if (w <= 6000) return { id: 'K4', ...KIT_EXCEL_FORMULAS.K4 };
  if (w <= 6400) return { id: 'K5', ...KIT_EXCEL_FORMULAS.K5 };
  if (w <= 7500) return { id: 'K6', ...KIT_EXCEL_FORMULAS.K6 };
  if (w <= 8000) return { id: 'K7', ...KIT_EXCEL_FORMULAS.K7 };
  if (w <= 10000) return { id: 'K8', ...KIT_EXCEL_FORMULAS.K8 };
  if (w <= 12000) return { id: 'K9', ...KIT_EXCEL_FORMULAS.K9 };
  return { id: 'K10', ...KIT_EXCEL_FORMULAS.K10 };
}

/**
 * Calcula en vivo el BOM de cualquier combinación personalizada y le aplica la fórmula de Excel respectiva.
 */
export function calcCustomKitProposal(config) {
  const panelW = config.panelW || 625;
  const panelQty = parseInt(config.panelQty) || 0;
  const panelModelKey = panelW === 585 ? 'Luxen, Monofacial 585/590W' : 'Luxen, Monofacial 625W';
  const panelUnitPrice = UNIT_PRICES[panelModelKey] || 318000;
  const panelSubtotal = panelQty * panelUnitPrice;

  const invQty = parseInt(config.inverterQty) || 1;
  const invModelKey = config.inverterModel;
  const invUnitPrice = UNIT_PRICES[invModelKey] || 1550000;
  const invSubtotal = invQty * invUnitPrice;
  const totalInverterW = (parseInt(config.inverterW) || 5000) * invQty;

  const batQty = parseInt(config.batteryQty) || 0;
  const batModelKey = config.batteryModel;
  const batUnitPrice = UNIT_PRICES[batModelKey] || 5800000;
  const batSubtotal = batQty * batUnitPrice;

  const combQty = parseInt(config.combinerQty) || 1;
  const combModelKey = config.combinerModel;
  const combUnitPrice = UNIT_PRICES[combModelKey] || 343482;
  const combSubtotal = combQty * combUnitPrice;

  const soporteQty = parseInt(config.soporteQty) || Math.ceil(panelQty / 2);
  const soporteUnitPrice = UNIT_PRICES['KIT soporte techo - 2 paneles'] || 157080;
  const soporteSubtotal = soporteQty * soporteUnitPrice;

  const cableMeters = parseInt(config.cableMeters) || 70;
  const cableUnitPrice = UNIT_PRICES['Cable Fotovoltaico negro/rojo 6mm '] || 4857;
  const cableSubtotal = cableMeters * cableUnitPrice;

  const totalBOM =
    panelSubtotal +
    invSubtotal +
    batSubtotal +
    combSubtotal +
    soporteSubtotal +
    cableSubtotal;

  const formula = getExcelFormulaForInverter(totalInverterW);

  const rawPrecioFinal = totalBOM * formula.mult + (formula.fijo1 + formula.fijo2);
  const precioFinal = Math.ceil(rawPrecioFinal / 10000) * 10000;

  const discountFactor = KIT_DISCOUNT_FACTORS[config.baseKitId] || 0.92;
  const precioConDescuento = Math.round((precioFinal * discountFactor) / 10000) * 10000;

  return {
    bom: {
      paneles: panelSubtotal,
      inversores: invSubtotal,
      baterias: batSubtotal,
      combiner: combSubtotal,
      soporte: soporteSubtotal,
      cable: cableSubtotal,
      total: totalBOM
    },
    formula,
    totalInverterW,
    precioFinal,
    precioConDescuento,
    discountFactor
  };
}

/**
 * Dimensionamiento base de paneles, baterías e inversor a partir del consumo diario.
 */
export function calcDimensionamiento(siteParams, appliances) {
  let dailyWh = 0;
  let peakLoadW = 0;

  if (appliances && appliances.length > 0) {
    for (const app of appliances) {
      const p = parseFloat(app.power) || 0;
      const q = parseFloat(app.qty) || 1;
      const h = parseFloat(app.hours) || 0;
      dailyWh += p * q * h;
      peakLoadW += p * q;
    }
  }

  if (!siteParams.useTableSum && siteParams.kwhMonth > 0) {
    dailyWh = (siteParams.kwhMonth * 1000) / 30;
  }

  const hsp = parseFloat(siteParams.hsp) || 3.8;
  const eff = parseFloat(siteParams.efficiency) || 0.78;
  const dod = parseFloat(siteParams.dod) || 0.90;
  const autonomy = parseFloat(siteParams.autonomyHours) || 14;
  const panelW = parseFloat(siteParams.panelW) || 625;
  const battKwh = parseFloat(siteParams.battKwh) || 11.0;
  const safetyFactor = parseFloat(siteParams.safetyFactor) || 1.25;

  const fvPowerNeeded = dailyWh / (hsp * eff);
  const numPaneles = Math.max(1, Math.ceil(fvPowerNeeded / panelW));

  const nightWh = dailyWh * (autonomy / 24);
  const batteryBankNeededKwh = nightWh / (dod * 1000);
  const numBatteries = Math.max(1, Math.ceil(batteryBankNeededKwh / battKwh));
  const bankKwh = numBatteries * battKwh;

  const rawInverterW = peakLoadW * safetyFactor;
  let inverterW = 3000;
  if (rawInverterW > 12000) inverterW = 15000;
  else if (rawInverterW > 10000) inverterW = 12000;
  else if (rawInverterW > 8000) inverterW = 10000;
  else if (rawInverterW > 6400) inverterW = 8000;
  else if (rawInverterW > 5000) inverterW = 6400;
  else if (rawInverterW > 3000) inverterW = 5000;

  const batteryOpt = calcManualBattery(
    batteryBankNeededKwh,
    siteParams.voltage === 24 ? 'Batería LFP FOC Energy de 12V, 2.9 KWh' : 'Batería LFP FOC Energy, 48V, 11 KWh',
    siteParams.voltage
  );

  return {
    dailyWh,
    peakLoadW,
    fvPowerNeeded,
    numPaneles,
    numBatteries,
    bankKwh,
    inverterW,
    batteryBankNeededKwh,
    batteryOpt
  };
}

/**
 * Calcula precios de un kit comercial del catálogo.
 */
export function calcKitPricing(kit) {
  if (!kit) return { precioFinal: 0, precioConDescuento: 0, ahorro: 0, factor: 1, descuentoPct: 0 };
  const factor = KIT_DISCOUNT_FACTORS[kit.id] || 0.92;
  const precioFinal = kit.precioFinal || 0;
  const precioConDescuento = kit.precioConDescuento || Math.round((precioFinal * factor) / 10000) * 10000;
  return {
    precioFinal,
    precioConDescuento,
    ahorro: precioFinal - precioConDescuento,
    factor,
    descuentoPct: Math.round((1 - factor) * 1000) / 10
  };
}

/**
 * Recomienda el kit más ajustado del catálogo comercial.
 */
export function recommendKit(calculo, siteParams) {
  if (!calculo) return { kit: KITS[0], cumple: false, pricing: calcKitPricing(KITS[0]) };

  for (const kit of KITS) {
    const panelsOk = kit.paneles * kit.panelW >= calculo.fvPowerNeeded * 0.95;
    const invOk = kit.inversorW >= calculo.inverterW;
    const batOk = kit.totalBateriaKwh >= calculo.bankKwh * 0.95;

    if (panelsOk && invOk && batOk) {
      return {
        kit,
        cumple: true,
        pricing: calcKitPricing(kit)
      };
    }
  }

  const maxKit = KITS[KITS.length - 1];
  return {
    kit: maxKit,
    cumple: false,
    pricing: calcKitPricing(maxKit)
  };
}

export const findRecommendedKit = recommendKit;

/**
 * Cálculo manual de batería para un modelo seleccionado.
 */
export function calcManualBattery(kwhNeeded, modelKey, voltage = 48) {
  const model = BATTERY_MODELS_CATALOG.find(b => b.value === modelKey || b.label === modelKey) || BATTERY_MODELS_CATALOG;
  const unitKwh = model.kwh || 11.0;
  const qty = Math.max(1, Math.ceil((kwhNeeded || 1) / unitKwh));
  return {
    qty,
    unitKwh,
    totalKwh: qty * unitKwh,
    modelKey: model.value,
    voltage: model.v
  };
}

/**
 * Encuentra la opción de batería más económica que cubra los kWh requeridos.
 */
export function findCheapestBattery(kwhNeeded, voltage = 48) {
  const compatible = BATTERY_MODELS_CATALOG.filter(b => b.v === voltage);
  const pool = compatible.length > 0 ? compatible : BATTERY_MODELS_CATALOG;
  const candidates = pool.map(b => {
    const qty = Math.max(1, Math.ceil((kwhNeeded || 1) / b.kwh));
    const unitCost = UNIT_PRICES[b.value] || 5800000;
    return {
      qty,
      modelKey: b.value,
      totalKwh: qty * b.kwh,
      totalCost: qty * unitCost
    };
  });
  candidates.sort((a, b) => a.totalCost - b.totalCost);
  return candidates[0] || { qty: 1, modelKey: BATTERY_MODELS_CATALOG.value, totalKwh: 11.0, totalCost: 5800000 };
}

/**
 * Calcula el BOM de la solución optimizada.
 */
export function calcOptimizedBOM(optSolution, batteryOpt) {
  const totalPanels = optSolution?.totalPanels || 4;
  const panelCost = totalPanels * (UNIT_PRICES['Luxen, Monofacial 625W'] || 318000);

  const invW = optSolution?.totalInverterW || 5000;
  let invModel = 'Inversor FOC Energy, 5KW, 48V, 120/240V';
  if (invW >= 15000) invModel = 'Hybrid Inverter Sosen, 15KW, 48V, 120/240V';
  else if (invW >= 12000) invModel = 'Hybrid Inverter Sosen, 12KW, 48V, 120/240V';
  else if (invW >= 10000) invModel = 'Hybrid Inverter Sosen, 10KW, 48V, 120/240V';
  else if (invW >= 8000) invModel = 'Hybrid Inverter Sosen, 8KW, 48V, 120/240V';
  else if (invW >= 6400) invModel = 'Inversor FOC Energy, 6.4KW, 48V, 120/240V';
  else if (invW <= 3000) invModel = 'Inversor FOC Energy, 3KW, 24V, 120/240V';
  const invCost = (optSolution?.qty || 1) * (UNIT_PRICES[invModel] || 1550000);

  const batModel = batteryOpt?.modelKey || 'Batería LFP FOC Energy, 48V, 11 KWh';
  const batCost = (batteryOpt?.qty || 1) * (UNIT_PRICES[batModel] || 5800000);

  const soporteCost = Math.ceil(totalPanels / 2) * (UNIT_PRICES['KIT soporte techo - 2 paneles'] || 157080);
  const cableCost = 70 * (UNIT_PRICES['Cable Fotovoltaico negro/rojo 6mm '] || 4857);
  const combCost = UNIT_PRICES['Combiner Box DC Suntree 3 in 1 out'] || 429352;

  const total = panelCost + invCost + batCost + soporteCost + cableCost + combCost;

  return {
    panelCost,
    invCost,
    batCost,
    soporteCost,
    cableCost,
    combCost,
    total
  };
}

/**
 * Aplica fórmula y factor de descuento al BOM optimizado.
 */
export function calcOptimizedPrice(bomTotal, totalInverterW, discountFactor = 0.94) {
  const formula = getExcelFormulaForInverter(totalInverterW);
  const rawPrecioFinal = bomTotal * formula.mult + (formula.fijo1 + formula.fijo2);
  const precioFinal = Math.ceil(rawPrecioFinal / 10000) * 10000;
  const precioConDescuento = Math.round((precioFinal * discountFactor) / 10000) * 10000;
  return {
    precioFinal,
    precioConDescuento,
    formula
  };
}

/**
 * Calcula la solución optimizada por ingeniería.
 */
export function findOptimizedSolution(calculo, siteParams) {
  if (!calculo) return null;
  const totalPanels = calculo.numPaneles || 4;
  const invW = calculo.inverterW || 5000;
  
  let brand = 'FOC Energy';
  let type = 'foc';
  if (invW >= 8000) {
    brand = 'Sosen';
    type = 'sosen';
  }

  const optSolution = {
    totalPanels,
    qty: 1,
    inverter: { brand, w: invW, type },
    totalInverterW: invW,
    configs: [
      {
        panels: totalPanels,
        inverter: { brand, w: invW, type },
        layout: `${totalPanels} paneles en serie/paralelo`,
        layoutText: `${Math.ceil(totalPanels / 2)} + ${Math.floor(totalPanels / 2)}`
      }
    ]
  };

  const bom = calcOptimizedBOM(optSolution, calculo.batteryOpt);
  const pricing = calcOptimizedPrice(bom.total, invW);

  return {
    ...optSolution,
    bom,
    pricing
  };
}

export const calcOptimizedSystem = findOptimizedSolution;

/**
 * Genera las observaciones consultivas de ingeniería para Sinergy Advisor.
 */
export function generateEngineeringAdvisories(calculo, siteParams, kitResult, appliances = []) {
  const list = [];
  if (!calculo) return list;

  const motorApps = (appliances || []).filter(a => (a.hp && parseFloat(a.hp) > 0) || (a.power && a.power >= 500));
  if (motorApps.length > 0) {
    list.push({
      id: 'adv-surge-motor',
      titulo: 'Sobretensión de arranque por motores detectada',
      explicacionComercial: `Se detectaron ${motorApps.length} equipo(s) inductivos con pico de arranque. Se recomienda verificar que la potencia pico del inversor soporte 2x a ) inductivos con pico de arranque. Se recomienda verificar que la potencia pico del inversor soporte 2x a 3x la potencia nominal durante el encendido.`,
      argumentoVenta: 'Garantiza que la nevera o bombas no apaguen el sistema al encender simultáneamente.',
      aplicado: false
    });
  }

  if (siteParams.autonomyHours < 12) {
    list.push({
      id: 'adv-low-autonomy',
      titulo: 'Autonomía nocturna ajustada',
      explicacionComercial: 'La autonomía configurada es menor a 12 horas. Se sugiere ampliar el banco a 14-16 horas para evitar descargas profundas en días nublados consecutivos.',
      argumentoVenta: 'Mayor vida útil de las baterías LFP y tranquilidad 24/7 sin riesgo de cortes en madrugadas.',
      aplicado: false
    });
  }

  if (calculo.fvPowerNeeded > 8000) {
    list.push({
      id: 'adv-hibrido-sosen',
      titulo: 'Recomendación de arquitectura híbrida de alta potencia',
      explicacionComercial: 'Para sistemas superiores a 8 kWp, los inversores híbridos Sosen con doble MPPT optimizan la captación ante sombreados parciales y permiten acoplamiento AC.',
      argumentoVenta: 'Tecnología robusta de grado comercial con mayor eficiencia de conversión.',
      aplicado: true
    });
  }

  return list;
}

/**
 * Calcula los costos de instalación y viáticos.
 */
export function calcInstallCost(calculo, siteParams) {
  const baseInstalacion = 1800000;
  const porPanel = (calculo?.numPaneles || 4) * 65000;
  const porBateria = (calculo?.numBatteries || 1) * 120000;
  const costoDirecto = baseInstalacion + porPanel + porBateria;
  const costoAjustado = Math.round(costoDirecto * 1.15);
  const precioFinal = Math.round(costoAjustado * 1.35 / 10000) * 10000;

  return {
    costoDirecto,
    costoAjustado,
    precioFinal
  };
}

/**
 * Resumen consolidado del proyecto, margen y estado de rentabilidad.
 */
export function calcProjectTotals(kitResult, installResult) {
  const kitVenta = kitResult?.pricing?.precioFinal || 0;
  const installVenta = installResult?.precioFinal || 0;
  const precioVentaTotal = kitVenta + installVenta;

  const kitCosto = kitResult?.kit ? (kitResult.kit.paneles * 318000 + kitResult.kit.inversorW * 300) : (kitVenta * 0.55);
  const installCosto = installResult?.costoAjustado || 0;
  const costoTotalProyecto = kitCosto + installCosto;

  const margenBrutoCOP = precioVentaTotal - costoTotalProyecto;
  const margenBrutoPct = precioVentaTotal > 0 ? (margenBrutoCOP / precioVentaTotal) * 100 : 0;

  let status = 'approved';
  let statusText = 'Rentabilidad Óptima (≥ 30%)';
  if (margenBrutoPct < 20) {
    status = 'danger';
    statusText = 'Margen Bajo (< 20%)';
  } else if (margenBrutoPct < 30) {
    status = 'review';
    statusText = 'En Revisión (20% – 30%)';
  }

  return {
    precioVentaTotal,
    costoTotalProyecto,
    margenBrutoCOP,
    margenBrutoPct,
    status,
    statusText
  };
}
