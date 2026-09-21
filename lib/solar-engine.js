// =========================================================================
// MOTOR TÉCNICO Y ECONÓMICO FV — SINERGY SOLUCIONES INTEGRALES (SEPT 2026)
// =========================================================================

import {
  KITS,
  PRICE_LIST,
  KIT_EXCEL_FORMULAS,
  INVERTER_PRICES,
  BATTERY_OPTIONS_BY_VOLTAGE,
  OPTIMIZED_INVERTERS,
  HP_OPTIONS,
  CABLE_METERS_PER_PANEL
} from './constants';

// TABLA MAESTRA CON LOS TRES PRECIOS OFICIALES: CONTADO, CRÉDITO Y REFERIDO
export const OFFICIAL_KIT_PRICES = {
  K1:  { contado: 14700000, credito: 16317000, referido: 13230000, factorCredito: 1.110, factorReferido: 0.900, pctDesc: 10.0 },
  K2:  { contado: 17390000, credito: 19268120, referido: 15824900, factorCredito: 1.108, factorReferido: 0.910, pctDesc: 9.0 },
  K3:  { contado: 22170000, credito: 24520020, referido: 20396400, factorCredito: 1.106, factorReferido: 0.920, pctDesc: 8.0 },
  K4:  { contado: 24790000, credito: 27368160, referido: 22806800, factorCredito: 1.104, factorReferido: 0.920, pctDesc: 8.0 },
  K5:  { contado: 25480000, credito: 28078960, referido: 23569000, factorCredito: 1.102, factorReferido: 0.925, pctDesc: 7.5 },
  K6:  { contado: 28980000, credito: 31704120, referido: 26951400, factorCredito: 1.094, factorReferido: 0.930, pctDesc: 7.0 },
  K7:  { contado: 46390000, credito: 50704270, referido: 43606600, factorCredito: 1.093, factorReferido: 0.940, pctDesc: 6.0 },
  K8:  { contado: 49720000, credito: 54294240, referido: 46985400, factorCredito: 1.092, factorReferido: 0.945, pctDesc: 5.5 },
  K9:  { contado: 55420000, credito: 60463220, referido: 52649000, factorCredito: 1.091, factorReferido: 0.950, pctDesc: 5.0 },
  K10: { contado: 68650000, credito: 74828500, referido: 65492100, factorCredito: 1.090, factorReferido: 0.954, pctDesc: 4.6 }
};

export function fmt(n, decimals = 0) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Number(n).toLocaleString('es-CO', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
}

export function hpToWatts(hp) {
  return hp > 0 ? Math.round(hp * 746) : 0;
}

export function wattsToClosestHp(w) {
  if (!w) return '0';
  let best = HP_OPTIONS.reduce((a, b) =>
    Math.abs(hpToWatts(parseFloat(a.v)) - w) < Math.abs(hpToWatts(parseFloat(b.v)) - w) ? a : b
  );
  return best.v;
}

export function panelPriceFor(panelW) {
  return panelW === 585
    ? PRICE_LIST['Luxen, Monofacial 585/590W'] || 310000
    : PRICE_LIST['Luxen, Monofacial 625W'] || 342016.25;
}

export function batteryPriceFor(kit) {
  const voltage = kit.bateriaModelo.includes('12V') ? '12V' : '48V';
  const key = `Batería LFP FOC Energy, ${voltage}, ${kit.bateriaKwhUnit} KWh`;
  return PRICE_LIST[key] || PRICE_LIST[kit.bateriaModelo] || 0;
}

export function calcKitBOM(kit) {
  const paneles = panelPriceFor(kit.panelW) * kit.paneles;
  const inversor = INVERTER_PRICES[kit.inversorW] || 0;
  const baterias = batteryPriceFor(kit) * kit.bateriaCant;
  const proteccion = PRICE_LIST[kit.proteccionDC] || 0;
  const soporte = (PRICE_LIST['KIT soporte techo - 2 paneles'] || 147262.5) * kit.soporte;
  const cable = (PRICE_LIST['Cable Fotovoltaico negro/rojo 6mm (por metro)'] || 4779.34) * kit.cable;
  return {
    paneles,
    inversor,
    baterias,
    proteccion,
    soporte,
    cable,
    total: paneles + inversor + baterias + proteccion + soporte + cable
  };
}

export function calcKitPricing(kit) {
  const bom = calcKitBOM(kit);
  const data = OFFICIAL_KIT_PRICES[kit?.id];
  if (data) {
    return {
      bom,
      precioContado: data.contado,
      precioCredito: data.credito,
      precioReferido: data.referido,
      factorCredito: data.factorCredito,
      factorReferido: data.factorReferido,
      pctDesc: data.pctDesc,
      ahorroReferido: data.contado - data.referido,
      recargoCredito: data.credito - data.contado,
      // Retrocompatibilidad
      precioFinal: data.contado,
      precioConDescuento: data.referido
    };
  }
  const formula = KIT_EXCEL_FORMULAS[kit?.id] || KIT_EXCEL_FORMULAS.K5;
  const subtotal = (bom.total * formula.mult) + formula.fijo1 + formula.fijo2;
  const precioContado = Math.ceil(subtotal / 10000) * 10000;
  const precioCredito = Math.round(precioContado * 1.092);
  const precioReferido = Math.round(precioContado * 0.94);
  return {
    bom,
    precioContado,
    precioCredito,
    precioReferido,
    factorCredito: 1.092,
    factorReferido: 0.94,
    pctDesc: 6.0,
    ahorroReferido: precioContado - precioReferido,
    recargoCredito: precioCredito - precioContado,
    precioFinal: precioContado,
    precioConDescuento: precioReferido
  };
}

export function recommendKit(neededWp, neededBankKwh, neededInverterW) {
  // 1. Busca el primer kit del catálogo que cubra simultáneamente:
  //    - Los paneles generados por el consumo mensual (neededWp)
  //    - La batería necesaria para la autonomía nocturna (neededBankKwh)
  //    - La potencia del inversor para la carga simultánea (neededInverterW)
  const candidato = KITS.find(
    k =>
      k.totalWp >= (neededWp || 0) &&
      k.totalBateriaKwh >= (neededBankKwh || 0) &&
      k.inversorW >= (neededInverterW || 0)
  );

  if (candidato) {
    return { kit: candidato, cumple: true };
  }

  // 2. Si el consumo supera todos los kits estándar, entrega el kit mayor
  // indicando que requiere cotización personalizada
  const masGrande = [...KITS].sort((a, b) => b.totalWp - a.totalWp)[0];
  return { kit: masGrande, cumple: false };
}

export function calcManualBattery(bankKwh, voltage, battKwh, requiredInverterW = 0) {
  let qty, modelKey;
  if (voltage === 24) {
    const perModuleKwh = battKwh * 2;
    const numModulesEnergy = Math.min(1, Math.max(1, Math.ceil(bankKwh / perModuleKwh)));
    const numModulesPower = requiredInverterW > 0 ? Math.min(1, Math.ceil(requiredInverterW / 2500)) : 1;
    const numModules = Math.max(numModulesEnergy, numModulesPower);
    qty = numModules * 2;
    modelKey = `Batería LFP FOC Energy, 12V, ${battKwh} KWh`;
  } else {
    const qtyEnergy = Math.max(1, Math.ceil(bankKwh / battKwh));
    const powerPerPack = battKwh >= 15 ? 7500 : 5100;
    const qtyPower = requiredInverterW > 0 ? Math.ceil(requiredInverterW / powerPerPack) : 1;
    qty = Math.max(qtyEnergy, qtyPower);
    modelKey = `Batería LFP FOC Energy, 48V, ${battKwh} KWh`;
  }
  const unitPrice = PRICE_LIST[modelKey] || 0;
  return { qty, modelKey, unitPrice, total: unitPrice * qty, totalKwh: qty * battKwh };
}


export function findCheapestBattery(bankKwh, voltage, requiredInverterW = 0) {
  // REGLA DE ORO DE INGENIERÍA:
  // Todo inversor >= 5kW opera estrictamente a 48V y SOLO admite baterías de 48V (11 o 16 kWh).
  // Solo inversores de 3kW operan a 24V (pares de 12V).
  const safeVoltage = requiredInverterW >= 5000 ? 48 : (voltage === 24 ? 24 : 48);
  const options = BATTERY_OPTIONS_BY_VOLTAGE[safeVoltage] || [11.0, 16.0];
  
  let best = null;
  options.forEach(battKwh => {
    const result = calcManualBattery(bankKwh, safeVoltage, battKwh, requiredInverterW);
    if (!result.unitPrice) return;
    if (
      !best ||
      result.total < best.total ||
      (result.total === best.total && result.qty < best.qty)
    ) {
      best = { ...result, battKwh };
    }
  });
  return best || calcManualBattery(bankKwh, safeVoltage, options[0], requiredInverterW);
}

export function distributeSosenPanels(total, maxPanels) {
  if (total < 1 || total > maxPanels) return null;
  if (total <= 18) {
    const a = Math.ceil(total / 2);
    const b = total - a;
    if (b < 1) return [total];
    if (a <= 10) return [b, a].sort((x, y) => x - y);
  }
  const candidates = [];
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      for (let c = 1; c <= 10; c++) {
        if (a + b + c === total) {
          const p = [a, b, c].sort((x, y) => x - y);
          candidates.push({ parts: p, spread: p - p[0] });
        }
      }
    }
  }
  if (!candidates.length) return null;
  candidates.sort((x, y) => x.spread - y.spread);
  return candidates[0].parts;
}

export function getFocCombiner(numStrings) {
  const n = Math.max(1, numStrings);
  const box = Math.min(n, 5);
  const spec = `Combiner Box DC Suntree ${box} in 1 out`;
  return {
    spec,
    unitPrice: PRICE_LIST[spec] || 0,
    warning: n > 5 ? `Se requieren ${n} strings; la caja 5 en 1 es la mayor disponible.` : null
  };
}

export function getSosenCombiner(trackersUsed) {
  const n = trackersUsed >= 3 ? 3 : 2;
  const spec = `Combiner Box DC Suntree ${n} in ${n} out`;
  return { spec, unitPrice: PRICE_LIST[spec] || 0, warning: null };
}

export function buildOptimizedInverterConfig(inv, panels) {
  if (panels < 1) return null;
  if (inv.type === 'foc') {
    const rounded = Math.ceil(panels / inv.seriesLen) * inv.seriesLen;
    if (rounded > inv.maxPanels) return null;
    const strings = rounded / inv.seriesLen;
    return {
      inverter: inv,
      panels: rounded,
      requestedPanels: panels,
      layout: `${inv.seriesLen}S × ${strings}P`,
      protection: getFocCombiner(strings)
    };
  }
  if (panels > inv.maxPanels) return null;
  const layout = distributeSosenPanels(panels, inv.maxPanels);
  if (!layout) return null;
  return {
    inverter: inv,
    panels,
    requestedPanels: panels,
    layout,
    layoutText: layout.join(' / '),
    protection: getSosenCombiner(layout.length)
  };
}

export function optimizedPriceFormula(inverterW) {
  const map = {
    3000: 'K1',
    5000: 'K4',
    6400: 'K6',
    8000: 'K7',
    10000: 'K8',
    12000: 'K9',
    15000: 'K10'
  };
  const key = map[inverterW] || (inverterW <= 3000 ? 'K1' : inverterW <= 5000 ? 'K4' : inverterW <= 6400 ? 'K6' : inverterW <= 8000 ? 'K7' : inverterW <= 10000 ? 'K8' : inverterW <= 12000 ? 'K9' : 'K10');
  return KIT_EXCEL_FORMULAS[key] || KIT_EXCEL_FORMULAS.K5;
}

export function getClosestKitDiscount(inverterW, numPaneles = 0) {
  const w = parseFloat(inverterW) || 5000;
  const p = parseInt(numPaneles) || 0;

  if (w <= 3000) {
    return p <= 4
      ? { kitId: 'K1', factorCredito: 1.110, factorReferido: 0.900, pctDesc: 10.0 }
      : { kitId: 'K2', factorCredito: 1.108, factorReferido: 0.910, pctDesc: 9.0 };
  }
  if (w <= 5000) {
    return p <= 6
      ? { kitId: 'K3', factorCredito: 1.106, factorReferido: 0.920, pctDesc: 8.0 }
      : { kitId: 'K4', factorCredito: 1.104, factorReferido: 0.920, pctDesc: 8.0 };
  }
  if (w <= 6400) {
    return p <= 9
      ? { kitId: 'K5', factorCredito: 1.102, factorReferido: 0.925, pctDesc: 7.5 }
      : { kitId: 'K6', factorCredito: 1.094, factorReferido: 0.930, pctDesc: 7.0 };
  }
  if (w <= 8000) {
    return { kitId: 'K7', factorCredito: 1.093, factorReferido: 0.940, pctDesc: 6.0 };
  }
  if (w <= 10000) {
    return { kitId: 'K8', factorCredito: 1.092, factorReferido: 0.945, pctDesc: 5.5 };
  }
  if (w <= 12000) {
    return { kitId: 'K9', factorCredito: 1.091, factorReferido: 0.950, pctDesc: 5.0 };
  }
  return { kitId: 'K10', factorCredito: 1.090, factorReferido: 0.954, pctDesc: 4.6 };
}

export function findOptimizedSolution(numPanels, manualW = null, requiredInverterW = 0) {
  if (numPanels <= 0) return null;
  const pool = manualW
    ? OPTIMIZED_INVERTERS.filter(x => x.w === manualW)
    : OPTIMIZED_INVERTERS;
  if (!pool.length) return null;

  for (let qty = 1; qty <= Math.min(12, numPanels); qty++) {
    const candidates = [];
    pool.forEach(inv => {
      const base = Math.floor(numPanels / qty);
      const rem = numPanels % qty;
      const counts = Array.from({ length: qty }, (_, i) => base + (i < rem ? 1 : 0));
      if (counts.some(n => n < 1)) return;
      if (!manualW && inv.w * qty < requiredInverterW) return;
      const configs = counts.map(n => buildOptimizedInverterConfig(inv, n));
      if (configs.some(c => !c)) return;
      const totalPanels = configs.reduce((sum, c) => sum + c.panels, 0);
      candidates.push({
        inverter: inv,
        qty,
        counts,
        configs,
        totalPanels,
        requestedPanels: numPanels,
        totalInverterW: inv.w * qty
      });
    });
    if (candidates.length) {
      candidates.sort(
        (a, b) => a.totalInverterW - b.totalInverterW || a.inverter.w - b.inverter.w
      );
      return candidates[0];
    }
  }
  return null;
}

export function calcOptimizedBOM(solution, panelW, batteryResult) {
  const panelUnit = panelPriceFor(panelW);
  const paneles = panelUnit * solution.totalPanels;
  let inversores = 0;
  let proteccion = 0;
  const inverterLines = [];
  const protectionLines = [];

  solution.configs.forEach(c => {
    const ip = INVERTER_PRICES[c.inverter.w] || 0;
    inversores += ip;
    inverterLines.push({
      spec: `${c.inverter.brand} ${c.inverter.w / 1000} kW`,
      qty: 1,
      total: ip
    });
    const pp = c.protection.unitPrice || 0;
    proteccion += pp;
    protectionLines.push({ spec: c.protection.spec, qty: 1, total: pp });
  });

  const soporteQty = Math.ceil(solution.totalPanels / 2);
  const cableMeters = solution.totalPanels * CABLE_METERS_PER_PANEL;
  const soporte = (PRICE_LIST['KIT soporte techo - 2 paneles'] || 147262.5) * soporteQty;
  const cable = (PRICE_LIST['Cable Fotovoltaico negro/rojo 6mm (por metro)'] || 4779.34) * cableMeters;

  return {
    paneles: { qty: solution.totalPanels, total: paneles },
    inversores: inverterLines,
    baterias: batteryResult,
    protecciones: protectionLines,
    soporte: { qty: soporteQty, total: soporte },
    cable: { metros: cableMeters, total: cable },
    total: paneles + inversores + proteccion + batteryResult.total + soporte + cable
  };
}

export function calcOptimizedPrice(bom, solution) {
  const invW = solution.totalInverterW || solution.inverter?.w || 5000;
  const panels = solution.totalPanels || 0;
  const formula = optimizedPriceFormula(invW);
  if (!formula) return { precioContado: null, precioCredito: null, precioReferido: null };

  const subtotal = Math.ceil((bom.total * formula.mult + (formula.fijo1 || 0) + (formula.fijo2 || 0)) / 10000) * 10000;
  const discountInfo = getClosestKitDiscount(invW, panels);
  const precioContado = subtotal;
  const precioCredito = Math.round(precioContado * discountInfo.factorCredito);
  const precioReferido = Math.round(precioContado * discountInfo.factorReferido);

  return {
    precioContado,
    precioCredito,
    precioReferido,
    factorCredito: discountInfo.factorCredito,
    factorReferido: discountInfo.factorReferido,
    pctDesc: discountInfo.pctDesc,
    ahorroReferido: precioContado - precioReferido,
    recargoCredito: precioCredito - precioContado,
    kitEquivalente: discountInfo.kitId,
    // Retrocompatibilidad
    precioFinal: precioContado,
    precioConDescuento: precioReferido
  };
}

export function calcInstallCost(projectParams, businessParams) {
  const p = { ...projectParams, ...businessParams };
  const costoManoObra = (p.personas || 2) * (p.dias || 2) * (p.costoManoObraDia || 103396.6);
  const costoTransporte = (p.km || 0) * (p.costoKm || 1350.0);
  const costoViaticos = (p.personas || 2) * (p.dias || 2) * (p.viatico || 45000);
  const costoDirecto = costoManoObra + costoTransporte + costoViaticos;

  const contingencia = costoDirecto * ((p.contingenciaPct || 10) / 100);
  const coordinacion = costoDirecto * ((p.coordinacionPct || 5) / 100);
  const costoAjustado = costoDirecto + contingencia + coordinacion + (p.comision || 0);

  const margenFactor = Math.max(0.01, 1 - (p.margenInstalacionPct || 40) / 100);
  const precioBase = costoAjustado / margenFactor;
  const precioConMinimo = Math.max(p.tarifaMinima || 1600000, precioBase);
  const precioFinal = precioConMinimo * (1 + (p.complejidad || 0));

  return {
    costoManoObra,
    costoTransporte,
    costoViaticos,
    costoDirecto,
    contingencia,
    coordinacion,
    costoAjustado,
    precioFinal: Math.round(precioFinal),
    params: p
  };
}

export function calcProjectTotals(equiposBOM, equiposPrecioFinal, installResult, businessParams) {
  const costoTotalProyecto = (equiposBOM || 0) + installResult.costoAjustado;
  const precioTotalEquipos = equiposPrecioFinal || 0;
  const precioVentaTotal = precioTotalEquipos + installResult.precioFinal;

  const margenBrutoCOP = precioVentaTotal - costoTotalProyecto;
  const margenBrutoPct = precioVentaTotal > 0 ? (margenBrutoCOP / precioVentaTotal) * 100 : 0;

  let status = 'approved';
  let statusText = '✓ Aprobado (Rentabilidad óptima)';
  if (margenBrutoPct < (businessParams.margenMinimoTotalPct || 35)) {
    status = 'rejected';
    statusText = '✕ No aprobado (Margen bajo el mínimo)';
  } else if (margenBrutoPct < (businessParams.margenObjetivoTotalPct || 40)) {
    status = 'review';
    statusText = '⚠ Revisar (Margen aceptable pero bajo objetivo)';
  }

  return {
    costoTotalProyecto,
    precioVentaTotal,
    margenBrutoCOP,
    margenBrutoPct,
    status,
    statusText
  };
}

export function generateEngineeringAdvisories(appliances = [], calculo = {}, currentInverterW = 0, appliedAdvisories = {}) {
  const advisories = [];
  const motores = appliances.filter(a => (parseFloat(a.hp) || 0) > 0);
  if (motores.length > 0) {
    const maxMotor = motores.reduce((prev, curr) =>
      (parseFloat(curr.hp) || 0) > (parseFloat(prev.hp) || 0) ? curr : prev
    );
    const hp = parseFloat(maxMotor.hp) || 0;
    const pNom = hp * 746;
    const pArranqueEst = Math.round(pNom * 4.5);
    const picoSoportadoInv = currentInverterW * 1.8;

    const necesitaUpgrade =
      pArranqueEst > picoSoportadoInv ||
      (currentInverterW <= 3000 && hp >= 1.0) ||
      (currentInverterW <= 5000 && hp >= 1.5);

    if (necesitaUpgrade) {
      const siguienteInv = currentInverterW <= 3000 ? 5000 : currentInverterW <= 5000 ? 6400 : 8000;
      advisories.push({
        id: 'motor-inrush',
        tipo: 'alerta-motor',
        titulo: `Arranque de motor detectado (${maxMotor.name || 'Motor'} de ${hp} HP)`,
        explicacionComercial: `Los motores al arrancar demandan entre 4 y 5 veces su potencia nominal (~${fmt(pArranqueEst)} W pico). Con un inversor estándar de ${fmt(currentInverterW)} W puede disparar protección por sobrecarga.`,
        argumentoVenta: `«Para garantizar que su bomba de ${hp} HP arranque sin problemas ni caídas de tensión, recomendamos un inversor de ${fmt(siguienteInv)} W».`,
        accionTexto: `Aplicar inversor de ${fmt(siguienteInv)} W (+${fmt(siguienteInv - currentInverterW)} W)`,
        inversorSugerido: siguienteInv,
        aplicado: !!appliedAdvisories['motor-inrush']
      });
    }
  }

  if (calculo.voltage === 48 && currentInverterW >= 8000) {
    const batQty = calculo.numBatteries || 1;
    const battKwh = calculo.battKwh || 11;
    const kwPorBat = battKwh >= 15 ? 7.5 : 5.1;
    const potenciaBancoKw = batQty * kwPorBat;

    if (potenciaBancoKw < currentInverterW / 1000) {
      const batReqCrate = Math.ceil(currentInverterW / 1000 / kwPorBat);
      advisories.push({
        id: 'battery-crate',
        tipo: 'alerta-bateria',
        titulo: `Capacidad de descarga continua del banco de litio (${currentInverterW / 1000} kW)`,
        explicacionComercial: `El inversor de ${currentInverterW / 1000} kW puede demandar más corriente de la que ${batQty} batería(s) entregan continuamente a 0.5C. Para cuidar la vida útil, se sugiere ampliar el banco.`,
        argumentoVenta: `«Recomendamos agregar ${batReqCrate - batQty} batería(s) para que el banco trabaje descansado y dure más de 10 años».`,
        accionTexto: `Ampliar banco a ${batReqCrate} baterías (+${batReqCrate - batQty} unidad(es))`,
        bateriasSugeridas: batReqCrate,
        aplicado: !!appliedAdvisories['battery-crate']
      });
    }
  }

  if ((calculo.numPaneles || 0) > 0 && (calculo.dailyWh || 0) > 8000) {
    advisories.push({
      id: 'reserva-nubosidad',
      tipo: 'sugerencia-clima',
      titulo: 'Margen de seguridad para temporada de lluvias en la región',
      explicacionComercial: `En regiones con temporadas de alta nubosidad, un margen del 15% asegura recarga continua.`,
      argumentoVenta: `«Le incluimos 2 paneles de seguridad para tener energía continua incluso en días lluviosos».`,
      accionTexto: `Agregar 2 paneles solares adicionales de seguridad`,
      panelesExtra: 2,
      aplicado: !!appliedAdvisories['reserva-nubosidad']
    });
  }

  return advisories;
}

export function calcCustomKitProposal(config) {
  const panelPrice = panelPriceFor(config.panelW);
  const costPaneles = panelPrice * (config.panelQty || 0);
  const costInversor = (PRICE_LIST[config.inverterModel] || 0) * (config.inverterQty || 1);
  const costBaterias = (PRICE_LIST[config.batteryModel] || 0) * (config.batteryQty || 0);
  const costCombiner = (PRICE_LIST[config.combinerModel] || 0) * (config.combinerQty || 1);
  const costSoporte = (PRICE_LIST['KIT soporte techo - 2 paneles'] || 147262.5) * (config.soporteQty || 0);
  const costCable = (PRICE_LIST['Cable Fotovoltaico negro/rojo 6mm'] || PRICE_LIST['Cable Fotovoltaico negro/rojo 6mm (por metro)'] || 4779.34) * (config.cableMeters || 0);

  const bomTotal = costPaneles + costInversor + costBaterias + costCombiner + costSoporte + costCable;
  const totalInverterW = (config.inverterW || 5000) * (config.inverterQty || 1);
  const formula = optimizedPriceFormula(totalInverterW);

  const subtotal = bomTotal * formula.mult + formula.fijo1 + formula.fijo2;
  const precioContado = Math.ceil(subtotal / 10000) * 10000;
  
  const discountInfo = getClosestKitDiscount(totalInverterW, config.panelQty);
  const precioCredito = Math.round(precioContado * discountInfo.factorCredito);
  const precioReferido = Math.round(precioContado * discountInfo.factorReferido);

  const totalWp = (config.panelQty || 0) * (config.panelW || 625);
  const totalBatteryKwh = (config.batteryQty || 0) * (config.batteryKwh || 11.78);

  return {
    bom: {
      paneles: costPaneles,
      inversor: costInversor,
      baterias: costBaterias,
      combiner: costCombiner,
      soporte: costSoporte,
      cable: costCable,
      total: bomTotal
    },
    totalWp,
    totalBatteryKwh,
    totalInverterW,
    formula,
    subtotal,
    precioContado,
    precioCredito,
    precioReferido,
    factorCredito: discountInfo.factorCredito,
    factorReferido: discountInfo.factorReferido,
    pctDesc: discountInfo.pctDesc,
    ahorroReferido: precioContado - precioReferido,
    recargoCredito: precioCredito - precioContado,
    kitEquivalente: discountInfo.kitId,
    precioFinal: precioContado,
    precioConDescuento: precioReferido
  };
}
