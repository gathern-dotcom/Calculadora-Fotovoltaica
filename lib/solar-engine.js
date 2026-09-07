// lib/solar-engine.js

import {
  UNIT_PRICES,
  KIT_DISCOUNT_FACTORS,
  KIT_EXCEL_FORMULAS,
  KITS,
  HP_OPTIONS,
  BATTERY_MODELS_CATALOG
} from &apos;./constants&apos;;

/**
 * Formateador numérico estándar para moneda COP y separador de miles.
 */
export function fmt(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return &apos;0&apos;;
  return Number(num).toLocaleString(&apos;es-CO&apos;, {
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
  if (!watts || watts &lt;= 0) return 0;
  const numericOptions = HP_OPTIONS
    .map(o =&gt; parseFloat(o.v))
    .filter(v =&gt; v &gt; 0);

  let closest = numericOptions[0];
  let minDiff = Math.abs(hpToWatts(closest) - watts);

  for (const hp of numericOptions) {
    const diff = Math.abs(hpToWatts(hp) - watts);
    if (diff &lt; minDiff) {
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
  if (w &lt;= 3000) return { id: &apos;K1&apos;, ...KIT_EXCEL_FORMULAS.K1 };
  if (w &lt;= 4000) return { id: &apos;K2&apos;, ...KIT_EXCEL_FORMULAS.K2 };
  if (w &lt;= 5000) return { id: &apos;K3&apos;, ...KIT_EXCEL_FORMULAS.K3 };
  if (w &lt;= 6000) return { id: &apos;K4&apos;, ...KIT_EXCEL_FORMULAS.K4 };
  if (w &lt;= 6400) return { id: &apos;K5&apos;, ...KIT_EXCEL_FORMULAS.K5 };
  if (w &lt;= 7500) return { id: &apos;K6&apos;, ...KIT_EXCEL_FORMULAS.K6 };
  if (w &lt;= 8000) return { id: &apos;K7&apos;, ...KIT_EXCEL_FORMULAS.K7 };
  if (w &lt;= 10000) return { id: &apos;K8&apos;, ...KIT_EXCEL_FORMULAS.K8 };
  if (w &lt;= 12000) return { id: &apos;K9&apos;, ...KIT_EXCEL_FORMULAS.K9 };
  return { id: &apos;K10&apos;, ...KIT_EXCEL_FORMULAS.K10 };
}

/**
 * Calcula en vivo el BOM de cualquier combinación personalizada y le aplica la fórmula de Excel respectiva.
 */
export function calcCustomKitProposal(config) {
  const panelW = config.panelW || 625;
  const panelQty = parseInt(config.panelQty) || 0;
  const panelModelKey = panelW === 585 ? &apos;Luxen, Monofacial 585/590W&apos; : &apos;Luxen, Monofacial 625W&apos;;
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
  const soporteUnitPrice = UNIT_PRICES[&apos;KIT soporte techo - 2 paneles&apos;] || 157080;
  const soporteSubtotal = soporteQty * soporteUnitPrice;

  const cableMeters = parseInt(config.cableMeters) || 70;
  const cableUnitPrice = UNIT_PRICES[&apos;Cable Fotovoltaico negro/rojo 6mm &apos;] || 4857;
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

  if (appliances &amp;&amp; appliances.length &gt; 0) {
    for (const app of appliances) {
      const p = parseFloat(app.power) || 0;
      const q = parseFloat(app.qty) || 1;
      const h = parseFloat(app.hours) || 0;
      dailyWh += p * q * h;
      peakLoadW += p * q;
    }
  }

  if (!siteParams.useTableSum &amp;&amp; siteParams.kwhMonth &gt; 0) {
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
  if (rawInverterW &gt; 12000) inverterW = 15000;
  else if (rawInverterW &gt; 10000) inverterW = 12000;
  else if (rawInverterW &gt; 8000) inverterW = 10000;
  else if (rawInverterW &gt; 6400) inverterW = 8000;
  else if (rawInverterW &gt; 5000) inverterW = 6400;
  else if (rawInverterW &gt; 3000) inverterW = 5000;

  const batteryOpt = calcManualBattery(batteryBankNeededKwh, siteParams.voltage === 24 ? &apos;Batería LFP FOC Energy de 12V, 2.9 KWh&apos; : &apos;Batería LFP FOC Energy, 48V, 11 KWh&apos;, siteParams.voltage);

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
  if (!kit) return { bom: { total: 0 }, precioFinal: 0, precioConDescuento: 0, ahorro: 0, factor: 1, descuentoPct: 0 };
  const factor = KIT_DISCOUNT_FACTORS[kit.id] || 0.92;
  const precioFinal = kit.precioFinal || 0;
  const precioConDescuento = kit.precioConDescuento || Math.round((precioFinal * factor) / 10000) * 10000;
  return {
    bom: { total: kit.totalBOM || 0 },
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
    const panelsOk = kit.paneles * kit.panelW &gt;= calculo.fvPowerNeeded * 0.95;
    const invOk = kit.inversorW &gt;= calculo.inverterW;
    const batOk = kit.totalBateriaKwh &gt;= calculo.bankKwh * 0.95;

    if (panelsOk &amp;&amp; invOk &amp;&amp; batOk) {
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
  const model = BATTERY_MODELS_CATALOG.find(b =&gt; b.value === modelKey || b.label === modelKey) || BATTERY_MODELS_CATALOG[2];
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
  const compatible = BATTERY_MODELS_CATALOG.filter(b =&gt; b.v === voltage);
  const pool = compatible.length &gt; 0 ? compatible : BATTERY_MODELS_CATALOG;
  const candidates = pool.map(b =&gt; {
    const qty = Math.max(1, Math.ceil((kwhNeeded || 1) / b.kwh));
    const unitCost = UNIT_PRICES[b.value] || 5800000;
    return {
      qty,
      modelKey: b.value,
      totalKwh: qty * b.kwh,
      totalCost: qty * unitCost
    };
  });
  candidates.sort((a, b) =&gt; a.totalCost - b.totalCost);
  return candidates[0] || { qty: 1, modelKey: BATTERY_MODELS_CATALOG[2].value, totalKwh: 11.0, totalCost: 5800000 };
}

/**
 * Calcula el BOM de la solución optimizada.
 */
export function calcOptimizedBOM(optSolution, batteryOpt) {
  const totalPanels = optSolution?.totalPanels || 4;
  const panelCost = totalPanels * (UNIT_PRICES[&apos;Luxen, Monofacial 625W&apos;] || 318000);

  const invW = optSolution?.totalInverterW || 5000;
  let invModel = &apos;Inversor FOC Energy, 5KW, 48V, 120/240V&apos;;
  if (invW &gt;= 15000) invModel = &apos;Hybrid Inverter Sosen, 15KW, 48V, 120/240V&apos;;
  else if (invW &gt;= 12000) invModel = &apos;Hybrid Inverter Sosen, 12KW, 48V, 120/240V&apos;;
  else if (invW &gt;= 10000) invModel = &apos;Hybrid Inverter Sosen, 10KW, 48V, 120/240V&apos;;
  else if (invW &gt;= 8000) invModel = &apos;Hybrid Inverter Sosen, 8KW, 48V, 120/240V&apos;;
  else if (invW &gt;= 6400) invModel = &apos;Inversor FOC Energy, 6.4KW, 48V, 120/240V&apos;;
  else if (invW &lt;= 3000) invModel = &apos;Inversor FOC Energy, 3KW, 24V, 120/240V&apos;;
  const invCost = (optSolution?.qty || 1) * (UNIT_PRICES[invModel] || 1550000);

  const batModel = batteryOpt?.modelKey || &apos;Batería LFP FOC Energy, 48V, 11 KWh&apos;;
  const batCost = (batteryOpt?.qty || 1) * (UNIT_PRICES[batModel] || 5800000);

  const soporteCost = Math.ceil(totalPanels / 2) * (UNIT_PRICES[&apos;KIT soporte techo - 2 paneles&apos;] || 157080);
  const cableCost = 70 * (UNIT_PRICES[&apos;Cable Fotovoltaico negro/rojo 6mm &apos;] || 4857);
  const combCost = UNIT_PRICES[&apos;Combiner Box DC Suntree 3 in 1 out&apos;] || 429352;

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

  let brand = &apos;FOC Energy&apos;;
  let type = &apos;foc&apos;;
  if (invW &gt;= 8000) {
    brand = &apos;Sosen&apos;;
    type = &apos;sosen&apos;;
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

  const motorApps = (appliances || []).filter(a =&gt; (a.hp &amp;&amp; parseFloat(a.hp) &gt; 0) || (a.power &amp;&amp; a.power &gt;= 500));
  if (motorApps.length &gt; 0) {
    list.push({
      id: &apos;adv-surge-motor&apos;,
      titulo: &apos;Sobretensión de arranque por motores detectada&apos;,
      explicacionComercial: `Se detectaron ${motorApps.length} equipo(s) inductivos con pico de arranque. Se recomienda verificar que la potencia pico del inversor soporte 2x a 3x la potencia nominal durante el encendido.`,
      argumentoVenta: &apos;Garantiza que la nevera o bombas no apaguen el sistema al encender simultáneamente.&apos;,
      aplicado: false
    });
  }

  if (siteParams.autonomyHours &lt; 12) {
    list.push({
      id: &apos;adv-low-autonomy&apos;,
      titulo: &apos;Autonomía nocturna ajustada&apos;,
      explicacionComercial: &apos;La autonomía configurada es menor a 12 horas. Se sugiere ampliar el banco a 14-16 horas para evitar descargas profundas en días nublados consecutivos.&apos;,
      argumentoVenta: &apos;Mayor vida útil de las baterías LFP y tranquilidad 24/7 sin riesgo de cortes en madrugadas.&apos;,
      aplicado: false
    });
  }

  if (calculo.fvPowerNeeded &gt; 8000) {
    list.push({
      id: &apos;adv-hibrido-sosen&apos;,
      titulo: &apos;Recomendación de arquitectura híbrida de alta potencia&apos;,
      explicacionComercial: &apos;Para sistemas superiores a 8 kWp, los inversores híbridos Sosen con doble MPPT optimizan la captación ante sombreados parciales y permiten acoplamiento AC.&apos;,
      argumentoVenta: &apos;Tecnología robusta de grado comercial con mayor eficiencia de conversión.&apos;,
      aplicado: true
    });
  }

  return list;
}
