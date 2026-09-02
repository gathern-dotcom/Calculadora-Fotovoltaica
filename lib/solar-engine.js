// =========================================================================
// MOTOR TÉCNICO Y ECONÓMICO FV — SINERGY SOLUCIONES INTEGRALES
// =========================================================================

import {
  KITS,
  PRICE_LIST,
  PRICE_FORMULAS,
  INVERTER_PRICES,
  BATTERY_OPTIONS_BY_VOLTAGE,
  OPTIMIZED_INVERTERS,
  HP_OPTIONS,
  CABLE_METERS_PER_PANEL
} from './constants';

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
    ? PRICE_LIST['Luxen, Monofacial 585/590W'] || 295661
    : PRICE_LIST['Luxen, Monofacial 625W'] || 318000;
}

export function batteryPriceFor(kit) {
  const is24V = kit.bateriaModelo.includes('12.8V') || kit.bateriaModelo.includes('12V');
  if (is24V) {
    return kit.bateriaKwhUnit >= 3.5
      ? PRICE_LIST['Batería LFP FOC Energy, 12V, 4 kWh'] || 1720000
      : PRICE_LIST['Batería LFP FOC Energy, 12V, 2.9 kWh'] || 1450000;
  }
  return kit.bateriaKwhUnit >= 15
    ? PRICE_LIST['Batería LFP FOC Energy, 48V, 16 kWh'] || 6300000
    : PRICE_LIST['Batería LFP FOC Energy, 48V, 11 kWh'] || 5800000;
}

export function calcKitBOM(kit) {
  const paneles = panelPriceFor(kit.panelW) * kit.paneles;
  const inversor = INVERTER_PRICES[kit.inversorW] || 0;
  const baterias = batteryPriceFor(kit) * kit.bateriaCant;
  const proteccion = PRICE_LIST[kit.proteccionDC] || 0;
  const soporte = (PRICE_LIST['KIT soporte techo - 2 paneles'] || 157080) * kit.soporte;
  const cable = (PRICE_LIST['Cable Fotovoltaico negro/rojo 6mm (por metro)'] || 4857) * kit.cable;
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
  const formula = PRICE_FORMULAS[kit.id];
  const bom = calcKitBOM(kit);
  if (!formula) return { bom, precioConDescuento: null, precioFinal: null };
  const precioConDescuento =
    Math.ceil((bom.total * formula.multiplicador + formula.suma) / 10000) * 10000;
  const precioFinal = Math.round(precioConDescuento * formula.multiplicadorFinal);
  return { bom, precioConDescuento, precioFinal };
}

export function recommendKit(neededWp, neededBankKwh, neededInverterW) {
  const candidato = KITS.find(
    k =>
      k.totalWp >= neededWp &&
      k.totalBateriaKwh >= neededBankKwh &&
      k.inversorW >= neededInverterW
  );
  if (candidato) {
    return { kit: candidato, cumple: true };
  }
  const masGrande = [...KITS].sort((a, b) => b.totalWp - a.totalWp)[0];
  return { kit: masGrande, cumple: false };
}

export function calcManualBattery(bankKwh, voltage, battKwh, requiredInverterW = 0) {
  let qty, modelKey;
  if (voltage === 24) {
    const perModuleKwh = battKwh * 2;
    const numModulesEnergy = Math.max(1, Math.ceil(bankKwh / perModuleKwh));
    // En 24V (pares de 12.8V a 100A máx BMS), cada par entrega máx 2.56 kW continuos
    const numModulesPower = requiredInverterW > 0 ? Math.ceil(requiredInverterW / 2560) : 1;
    const numModules = Math.max(numModulesEnergy, numModulesPower);
    qty = numModules * 2;
    modelKey = battKwh >= 3.5
      ? 'Batería LFP FOC Energy, 12V, 4 kWh'
      : 'Batería LFP FOC Energy, 12V, 2.9 kWh';
  } else {
    const qtyEnergy = Math.max(1, Math.ceil(bankKwh / battKwh));
    // En 51.2V LFP a tasa 0.5C recomendada: pack 11.78kWh da 5.0kW; pack 16kWh da 8.0kW
    const powerPerPack = battKwh >= 15 ? 8038 : 5000;
    const qtyPower = requiredInverterW > 0 ? Math.ceil(requiredInverterW / powerPerPack) : 1;
    qty = Math.max(qtyEnergy, qtyPower);
    modelKey = battKwh >= 15
      ? 'Batería LFP FOC Energy, 48V, 16 kWh'
      : 'Batería LFP FOC Energy, 48V, 11 kWh';
  }
  const unitPrice = PRICE_LIST[modelKey] || 0;
  return { qty, modelKey, unitPrice, total: unitPrice * qty, totalKwh: qty * battKwh };
}

export function findCheapestBattery(bankKwh, voltage, requiredInverterW = 0) {
  const options = BATTERY_OPTIONS_BY_VOLTAGE[voltage] || BATTERY_OPTIONS_BY_VOLTAGE[48];
  let best = null;
  options.forEach(battKwh => {
    const result = calcManualBattery(bankKwh, voltage, battKwh, requiredInverterW);
    if (!result.unitPrice) return;
    if (
      !best ||
      result.total < best.total ||
      (result.total === best.total && result.qty < best.qty)
    ) {
      best = { ...result, battKwh };
    }
  });
  return best || calcManualBattery(bankKwh, voltage, options[options.length - 1], requiredInverterW);
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
    warning:
      n > 5
        ? `Se requieren ${n} strings; la caja 5 en 1 es la mayor disponible en catálogo.`
        : null
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
  return PRICE_FORMULAS[map[inverterW]] || null;
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
  const soporte = (PRICE_LIST['KIT soporte techo - 2 paneles'] || 157080) * soporteQty;
  const cable =
    (PRICE_LIST['Cable Fotovoltaico negro/rojo 6mm (por metro)'] || 4857) * cableMeters;

  return {
    paneles: { qty: solution.totalPanels, total: paneles },
    inversores: inverterLines,
    baterias: batteryResult,
    protecciones: protectionLines,
    soporte: { qty: soporteQty, total: soporte },
    cable: { metros: cableMeters, total: cable },
    total:
      paneles +
      inversores +
      proteccion +
      batteryResult.total +
      soporte +
      cable
  };
}

export function calcOptimizedPrice(bom, solution) {
  const formula = optimizedPriceFormula(solution.inverter.w);
  if (!formula) return { precioConDescuento: null, precioFinal: null };
  const precioConDescuento =
    Math.ceil((bom.total * formula.multiplicador + formula.suma) / 10000) * 10000;
  const precioFinal = Math.round(precioConDescuento * formula.multiplicadorFinal);
  return { precioConDescuento, precioFinal };
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

export function calcProjectTotals(
  equiposBOM,
  equiposPrecioFinal,
  installResult,
  businessParams
) {
  const costoTotalProyecto = (equiposBOM || 0) + installResult.costoAjustado;
  const precioTotalEquipos = equiposPrecioFinal || 0;
  const precioVentaTotal = precioTotalEquipos + installResult.precioFinal;

  const margenBrutoCOP = precioVentaTotal - costoTotalProyecto;
  const margenBrutoPct =
    precioVentaTotal > 0 ? (margenBrutoCOP / precioVentaTotal) * 100 : 0;

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

// =========================================================================
// ASESOR DE INGENIERÍA EN VIVO (OBSERVACIONES TÉCNICAS Y RECOMENDACIONES)
// =========================================================================

export function generateEngineeringAdvisories(
  appliances = [],
  calculo = {},
  currentInverterW = 0,
  appliedAdvisories = {}
) {
  const advisories = [];

  // 1. Chequeo de motores inductivos y bombas (Pico de arranque LRA)
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
      const siguienteInv =
        currentInverterW <= 3000 ? 5000 : currentInverterW <= 5000 ? 6400 : 8000;

      advisories.push({
        id: 'motor-inrush',
        titulo: `Arranque de motor detectado (${maxMotor.name || 'Motor'} de ${hp} HP)`,
        explicacionComercial: `Los motores al arrancar demandan entre 4 y 5 veces su potencia nominal durante 2 segundos (~${fmt(pArranqueEst)} W de sobrepico). Con el inversor estándar de ${fmt(currentInverterW)} W, si el motor arranca mientras hay otras cargas activas (como neveras o iluminación), el inversor puede entrar en protección por sobrecarga y apagar el circuito.`,
        argumentoVenta: `«Para garantizar que su ${maxMotor.name || 'bomba'} de ${hp} HP prenda con total suavidad sin hacer titilar los bombillos ni apagar la casa, la ingeniería de Sinergy recomienda un inversor de ${fmt(siguienteInv)} W».`,
        inversorSugerido: siguienteInv,
        aplicado: !!appliedAdvisories['motor-inrush']
      });
    }
  }

  // 2. Chequeo de C-rate de batería (Tasa de descarga continua máxima)
  if (calculo.voltage === 48 && currentInverterW >= 8000) {
    const batQty = calculo.numBatteries || 1;
    const battKwh = calculo.battKwh || 11.78;
    const kwPorBat = battKwh >= 15 ? 8.0 : 5.0;
    const potenciaBancoKw = batQty * kwPorBat;

    if (potenciaBancoKw < currentInverterW / 1000) {
      const batReqCrate = Math.ceil(currentInverterW / 1000 / kwPorBat);
      advisories.push({
        id: 'battery-crate',
        titulo: `Capacidad de descarga continua del banco de litio (${currentInverterW / 1000} kW)`,
        explicacionComercial: `El inversor de ${currentInverterW / 1000} kW tiene una potencia superior a lo que ${batQty} batería(s) pueden suministrar de forma continua a tasa 0.5C. Para cuidar la vida útil de las celdas y evitar que el BMS de la batería se bloquee por sobrecorriente en consumos máximos, se recomienda ampliar el banco.`,
        argumentoVenta: `«Para que el banco de baterías trabaje holgado y alcance más de 10 años de vida útil, recomendamos complementar con ${batReqCrate - batQty} módulo(s) de batería adicional(es)».`,
        bateriasSugeridas: batReqCrate,
        aplicado: !!appliedAdvisories['battery-crate']
      });
    }
  }

  return advisories;
}
