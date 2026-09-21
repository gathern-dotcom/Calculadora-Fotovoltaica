'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import DimensionadorTab from '../components/DimensionadorTab';
import ParametrosTab from '../components/ParametrosTab';
import ProyectosTab from '../components/ProyectosTab';
import {
  KITS,
  DEFAULT_BUSINESS_PARAMS,
  DEFAULT_INSTALL_PROJECT_PARAMS,
  DEFAULT_APPLIANCES
} from '../lib/constants';
import {
  fmt,
  calcManualBattery,
  findCheapestBattery,
  findOptimizedSolution,
  calcOptimizedBOM,
  calcOptimizedPrice,
  calcKitPricing,
  recommendKit,
  calcInstallCost,
  calcProjectTotals,
  generateEngineeringAdvisories
} from '../lib/solar-engine';

// =========================================================================
// VISTA INTEGRADA DE CATÁLOGO DE KITS (10 KITS CON SUS 3 PRECIOS)
// =========================================================================
function CatalogoView() {
  return (
    <div className="max-w-[1280px] mx-auto p-4 sm:p-7 space-y-6 font-sans">
      <div className="border-b border-border pb-3">
        <h1 className="text-xl font-bold text-brand-text flex items-center gap-2">
          <span>📦</span> Catálogo Oficial de Kits Fotovoltaicos (Septiembre 2026)
        </h1>
        <p className="text-xs text-brand-muted m-0 mt-1">
          Kits solares aislados completos con precios oficiales de contado, financiado (crédito) y tarifa con código de referido.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {KITS.map(kit => {
          const pricing = calcKitPricing(kit);
          return (
            <div key={kit.id} className="kit-card bg-white border border-border rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-baseline border-b border-border pb-2">
                <div>
                  <span className="text-[11px] font-mono font-bold text-brand-blue uppercase tracking-wider">{kit.id}</span>
                  <h3 className="text-base font-bold text-brand-text m-0">{kit.nombre}</h3>
                </div>
                <span className="text-xs font-mono font-semibold text-brand-orange bg-orange-50 px-2 py-0.5 rounded">
                  {kit.inversorW / 1000} kW
                </span>
              </div>

              <ul className="kit-specs text-xs space-y-1.5 text-brand-text">
                <li><span className="k text-brand-muted">Paneles solares:</span> <span className="v font-semibold">{kit.paneles} un · {kit.panelW}W ({fmt(kit.totalWp)} Wp)</span></li>
                <li><span className="k text-brand-muted">Inversor:</span> <span className="v font-semibold">{kit.inversor}</span></li>
                <li><span className="k text-brand-muted">Baterías LFP:</span> <span className="v font-semibold">{kit.bateriaCant} un · {kit.bateriaModelo} ({fmt(kit.totalBateriaKwh, 1)} kWh)</span></li>
                <li><span className="k text-brand-muted">Protección DC:</span> <span className="v">{kit.proteccionDC}</span></li>
                <li><span className="k text-brand-muted">Estructura:</span> <span className="v">{kit.soporte} kits soporte techo</span></li>
                <li><span className="k text-brand-muted">Cableado:</span> <span className="v">{kit.cable} metros 6mm</span></li>
              </ul>

              {/* 3 Modalidades de Precio Oficiales */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="bg-gray-50 p-2 rounded border border-border flex justify-between items-center text-xs">
                  <span className="text-brand-muted font-medium">Normal (Crédito):</span>
                  <span className="font-mono font-bold text-brand-text">${fmt(pricing.precioCredito)} COP</span>
                </div>
                <div className="bg-blue-50/70 p-2.5 rounded border border-blue-200 flex justify-between items-center text-xs">
                  <span className="text-brand-blue font-bold uppercase">De Contado:</span>
                  <span className="font-mono font-bold text-brand-blue text-sm">${fmt(pricing.precioContado)} COP</span>
                </div>
                <div className="bg-green-50/80 p-2.5 rounded border border-green-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-brand-success font-bold uppercase block">Con Referido:</span>
                    <span className="text-[10px] text-brand-success">Ahorro: ${fmt(pricing.ahorroReferido)}</span>
                  </div>
                  <span className="font-mono font-bold text-brand-success text-sm">${fmt(pricing.precioReferido)} COP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  // Pestaña activa: 'dimensionador' | 'catalogo' | 'parametros' | 'proyectos'
  const [activeTab, setActiveTab] = useState('dimensionador');

  // Metadatos del cliente
  const [projectMeta, setProjectMeta] = useState({
    cliente: '',
    telefono: '',
    cedula: '',
    niu: '',
    ubicacion: ''
  });

  // Lista de electrodomésticos
  const [appliances, setAppliances] = useState(DEFAULT_APPLIANCES);

  // Parámetros técnicos del sitio
  const [siteParams, setSiteParams] = useState({
    kwhMonth: 300,
    useTableSum: false,
    panelW: 625,
    battKwh: 11.0,
    autonomyHours: 14,
    voltage: 48,
    voltageOverride: 'auto',
    hsp: 3.8,
    efficiency: 0.78,
    dod: 0.95,
    safetyFactor: 1.25,
    showAdvanced: false
  });

  // Parámetros de negocio e instalación
  const [businessParams, setBusinessParams] = useState(DEFAULT_BUSINESS_PARAMS);
  const [projectInstallParams, setProjectInstallParams] = useState(DEFAULT_INSTALL_PROJECT_PARAMS);

  // Observaciones técnicas aplicadas (Sinergy Advisor)
  const [appliedAdvisories, setAppliedAdvisories] = useState({});

  // Lista de proyectos guardados en Supabase
  const [proyectos, setProyectos] = useState([]);
  const [loadingProyectos, setLoadingProyectos] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // =========================================================================
  // MOTOR DE CÁLCULO EN TIEMPO REAL (REACTIVO)
  // =========================================================================
  const calculationData = useMemo(() => {
    let tableDailyWh = 0;
    let simultaneousW = 0;

    appliances.forEach(a => {
      const p = parseFloat(a.power) || 0;
      const q = parseFloat(a.qty) || 0;
      const h = parseFloat(a.hours) || 0;
      tableDailyWh += p * q * h;
      simultaneousW += p * q;
    });

    const dailyWh = siteParams.useTableSum
      ? tableDailyWh
      : (siteParams.kwhMonth / 30) * 1000;

    const peakLoadW = simultaneousW;

    const rawInverterW = Math.round(peakLoadW * (siteParams.safetyFactor || 1.25));
    let candidateInvW = 3000;
    if (rawInverterW <= 3000) candidateInvW = 3000;
    else if (rawInverterW <= 5000) candidateInvW = 5000;
    else if (rawInverterW <= 6400) candidateInvW = 6400;
    else if (rawInverterW <= 8000) candidateInvW = 8000;
    else if (rawInverterW <= 10000) candidateInvW = 10000;
    else if (rawInverterW <= 12000) candidateInvW = 12000;
    else candidateInvW = 15000;

    let inverterW = candidateInvW;
    if (appliedAdvisories['motor-inrush']) {
      inverterW = candidateInvW <= 3000 ? 5000 : candidateInvW <= 5000 ? 6400 : 8000;
    }

    const voltage =
      siteParams.voltageOverride === 'auto'
        ? inverterW <= 4000
          ? 24
          : 48
        : parseFloat(siteParams.voltageOverride) || 48;

    const fvPowerNeeded =
      dailyWh / ((siteParams.hsp || 3.8) * (siteParams.efficiency || 0.78));

    let numPaneles = Math.max(1, Math.ceil(fvPowerNeeded / siteParams.panelW));
    if (appliedAdvisories['reserva-nubosidad']) {
      numPaneles += 2;
    }

    const hourlyWh = dailyWh / 24;
    const nightWh = hourlyWh * (siteParams.autonomyHours || 14);
    const bankKwh = nightWh / 1000 / (siteParams.dod || 0.95);

    let batteryCalc = calcManualBattery(bankKwh, voltage, siteParams.battKwh, inverterW);
    if (appliedAdvisories['battery-crate']) {
      const kwPorBat = siteParams.battKwh >= 15 ? 7.5 : 5.1;
      const reqCrate = Math.ceil(inverterW / 1000 / kwPorBat);
      if (batteryCalc.qty < reqCrate) {
        batteryCalc = {
          ...batteryCalc,
          qty: reqCrate,
          total: batteryCalc.unitPrice * reqCrate,
          totalKwh: reqCrate * siteParams.battKwh
        };
      }
    }
    const numBatteries = batteryCalc.qty;

    const kitResult = recommendKit(numPaneles * siteParams.panelW, bankKwh, inverterW);
    if (kitResult?.kit) {
      kitResult.pricing = calcKitPricing(kitResult.kit);
    }

    const optimizedSolution = findOptimizedSolution(numPaneles, null, inverterW);
    let optimizedResult = null;
    if (optimizedSolution) {
      const batteryOpt = findCheapestBattery(bankKwh, voltage, inverterW);
      const bomOpt = calcOptimizedBOM(optimizedSolution, siteParams.panelW, batteryOpt);
      const pricingOpt = calcOptimizedPrice(bomOpt, optimizedSolution);
      optimizedResult = {
        ...optimizedSolution,
        bom: bomOpt,
        pricing: pricingOpt,
        batteryOpt
      };
    }

    const installResult = calcInstallCost(projectInstallParams, businessParams);

    const equiposPrecioFinal = kitResult?.pricing?.precioContado || kitResult?.pricing?.precioFinal || 0;
    const equiposBOM = kitResult?.pricing?.bom?.total || 0;
    const projectTotals = calcProjectTotals(
      equiposBOM,
      equiposPrecioFinal,
      installResult,
      businessParams
    );

    const calculo = {
      dailyWh,
      peakLoadW,
      fvPowerNeeded,
      numPaneles,
      bankKwh,
      numBatteries,
      inverterW,
      voltage,
      batteryOpt: optimizedResult?.batteryOpt || batteryCalc
    };

    return {
      calculo,
      kitResult,
      optimizedResult,
      installResult,
      projectTotals
    };
  }, [
    appliances,
    siteParams,
    businessParams,
    projectInstallParams,
    appliedAdvisories
  ]);

  useEffect(() => {
    if (siteParams.voltageOverride === 'auto' && calculationData.calculo.voltage !== siteParams.voltage) {
      setSiteParams(p => ({ ...p, voltage: calculationData.calculo.voltage }));
    }
  }, [calculationData.calculo.voltage, siteParams.voltageOverride, siteParams.voltage]);

  const advisories = useMemo(() => {
    return generateEngineeringAdvisories(
      appliances,
      calculationData.calculo,
      calculationData.calculo.inverterW,
      appliedAdvisories
    );
  }, [appliances, calculationData.calculo, appliedAdvisories]);

  const handleToggleAdvisory = advisoryId => {
    setAppliedAdvisories(prev => ({
      ...prev,
      [advisoryId]: !prev[advisoryId]
    }));
  };

  // =========================================================================
  // SUPABASE: CONSULTAR, GUARDAR, CARGAR Y ELIMINAR PROYECTOS
  // =========================================================================
  const fetchProyectos = async () => {
    setLoadingProyectos(true);
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) throw error;
      if (data) setProyectos(data);
    } catch (err) {
      console.error('Error al consultar proyectos en Supabase:', err);
    } finally {
      setLoadingProyectos(false);
    }
  };

  useEffect(() => {
    fetchProyectos();
  }, []);

  const handleSaveCloud = async () => {
    setSaveStatus({ type: 'muted', message: 'Guardando proyecto en Supabase…' });

    try {
      const payload = {
        cliente: projectMeta.cliente || null,
        telefono: projectMeta.telefono || null,
        cedula: projectMeta.cedula || null,
        niu: projectMeta.niu || null,
        ubicacion: projectMeta.ubicacion || null,
        estado: 'cotizado',
        fecha_proximo_contacto: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        notas_seguimiento: '',
        parametros: {
          ...siteParams,
          voltage: calculationData.calculo.voltage,
          instalacion: projectInstallParams,
          tarifas: businessParams
        },
        equipos: appliances,
        resultados: {
          consumo_diario_wh: calculationData.calculo.dailyWh,
          potencia_fv_wp: calculationData.calculo.fvPowerNeeded,
          num_paneles: calculationData.calculo.numPaneles,
          num_baterias: calculationData.calculo.numBatteries,
          inversor_w: calculationData.calculo.inverterW,
          precio_instalacion: calculationData.installResult.precioFinal,
          precio_total_proyecto: calculationData.projectTotals.precioVentaTotal,
          margen_bruto_total_pct: calculationData.projectTotals.margenBrutoPct,
          sistema_optimizado_detalle: calculationData.optimizedResult || null,
          instalacion_detalle: calculationData.installResult || null
        },
        kit_recomendado: calculationData.kitResult?.kit
          ? `${calculationData.kitResult.kit.id} —${calculationData.kitResult.kit.nombre}`
          : null,
        kit_cumple: calculationData.kitResult?.cumple || null,
        precio_equipos: calculationData.kitResult?.pricing?.bom?.total || null,
        precio_con_descuento: calculationData.kitResult?.pricing?.precioReferido || calculationData.kitResult?.pricing?.precioConDescuento || null,
        precio_final: calculationData.kitResult?.pricing?.precioContado || calculationData.kitResult?.pricing?.precioFinal || null
      };

      const { error } = await supabase.from('proyectos').insert(payload);
      if (error) throw error;

      setSaveStatus({ type: 'success', message: '✓ Proyecto guardado exitosamente en Supabase con seguimiento activo.' });
      fetchProyectos();
    } catch (err) {
      setSaveStatus({ type: 'danger', message: 'Error al guardar en Supabase: ' + err.message });
    }
  };

  const handleLoadProject = project => {
    if (project.parametros) {
      setSiteParams(prev => ({
        ...prev,
        ...project.parametros
      }));
      if (project.parametros.instalacion) {
        setProjectInstallParams(project.parametros.instalacion);
      }
      if (project.parametros.tarifas) {
        setBusinessParams(project.parametros.tarifas);
      }
    }
    if (project.equipos && Array.isArray(project.equipos)) {
      setAppliances(project.equipos);
    }
    setProjectMeta({
      cliente: project.cliente || '',
      telefono: project.telefono || '',
      cedula: project.cedula || '',
      niu: project.niu || '',
      ubicacion: project.ubicacion || ''
    });
    setActiveTab('dimensionador');
    alert(`✓ Proyecto cargado: ${project.cliente || 'Sin nombre'}`);
  };

  const handleDeleteProject = async id => {
    if (!confirm('¿Seguro que deseas eliminar este proyecto de la base de datos?')) return;
    try {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
      if (error) throw error;
      setProyectos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Error al eliminar proyecto: ' + err.message);
    }
  };

  const handleExportJson = () => {
    const exportData = {
      metadata: projectMeta,
      siteParams,
      appliances,
      calculation: calculationData,
      businessParams,
      projectInstallParams,
      fechaExport: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Proyecto_FV_${(projectMeta.cliente \vert{}\vert{} 'Sinergy').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (!confirm('¿Restablecer todos los parámetros del dimensionador al valor inicial?')) return;
    setAppliances(DEFAULT_APPLIANCES);
    setSiteParams({
      kwhMonth: 300,
      useTableSum: false,
      panelW: 625,
      battKwh: 11.0,
      autonomyHours: 14,
      voltage: 48,
      voltageOverride: 'auto',
      hsp: 3.8,
      efficiency: 0.78,
      dod: 0.95,
      safetyFactor: 1.25,
      showAdvanced: false
    });
    setAppliedAdvisories({});
    setProjectMeta({
      cliente: '',
      telefono: '',
      cedula: '',
      niu: '',
      ubicacion: ''
    });
    setSaveStatus(null);
  };

  const handleOpenCommercialCard = () => {
    const kit = calculationData.kitResult?.kit;
    const precio = calculationData.kitResult?.pricing?.precioContado || calculationData.kitResult?.pricing?.precioFinal;
    const texto = encodeURIComponent(
      `*PROPUESTA COMERCIAL — SINERGY SOLUCIONES INTEGRALES*\n\n` +
      `👤 *Cliente:* ${projectMeta.cliente || 'Estimado cliente'}\n` +
      `📍 *Ubicación:* ${projectMeta.ubicacion || 'Colombia'}\n` +
      `☀️ *Kit Recomendado:* ${kit ? `${kit.id} — ${kit.nombre}` : 'Personalizado'}\n` +
      `⚡ *Potencia FV:* ${calculationData.calculo.numPaneles} paneles (${calculationData.calculo.numPaneles * siteParams.panelW} Wp)\n` +
      `🔋 *Baterías:* ${calculationData.calculo.numBatteries} unidades (${calculationData.calculo.bankKwh.toFixed(1)} kWh)\n` +
      `🔌 *Inversor:* ${calculationData.calculo.inverterW / 1000} kW (120/240V)\n\n` +
      `💰 *Precio de Contado:* $${Number(precio || 0).toLocaleString('es-CO')} COP\n\n` +
      `_Propuesta válida por 15 días. Incluye soporte, cableado y protecciones DC._`
    );
    const phone = (projectMeta.telefono || '').replace(/\D/g, '');
    const cleanPhone = phone ? (phone.startsWith('57') ? phone : `57${phone}`) : '';
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${texto}` : `https://wa.me/?text=${texto}`;
    window.open(url, '_blank');
  };

  const handleOpenViability = () => {
    const nombre = projectMeta.cliente || 'Cliente';
    const kit = calculationData.kitResult?.kit?.nombre || 'Personalizado';
    alert(`✓ Solicitud de Viabilidad generada para ${nombre}.\nKit: ${kit} (${calculationData.calculo.inverterW}W).\nSe enviará a verificación técnica.`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-brand-text flex flex-col font-sans">
      {/* Encabezado con datos del cliente */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projectMeta={projectMeta}
        setProjectMeta={setProjectMeta}
      />

      {/* ======================================================== */}
      {/* BARRA DE PESTAÑAS (TABS VISIBLES Y SIEMPRE DISPONIBLES)  */}
      {/* ======================================================== */}
      <div className="bg-white border-b border-border sticky top-0 z-20 shadow-2xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-7 flex items-center justify-between overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-3 py-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('dimensionador')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'dimensionador'
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'text-brand-muted hover:text-brand-text hover:bg-gray-100'
              }`}
            >
              <span>⚡</span> Dimensionador Solar
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'catalogo'
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'text-brand-muted hover:text-brand-text hover:bg-gray-100'
              }`}
            >
              <span>📦</span> Catálogo de Kits (10 Kits)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('parametros')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'parametros'
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'text-brand-muted hover:text-brand-text hover:bg-gray-100'
              }`}
            >
              <span>⚙️</span> Parámetros e Instalación
            </button>

            <              }`}
            >
              <span>⚙️</span> Parámetros e Instalación
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('proyectos')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'proyectos'
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'text-brand-muted hover:text-brand-text hover:bg-gray-100'
              }`}
            >
              <span>📁</span> Proyectos y CRM
              {proyectos.length > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  activeTab === 'proyectos' ? 'bg-white text-brand-blue font-bold' : 'bg-brand-blue text-white'
                }`}>
                  {proyectos.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="flex-1">
        {activeTab === 'dimensionador' && (
          <DimensionadorTab
            siteParams={siteParams}
            setSiteParams={setSiteParams}
            appliances={appliances}
            setAppliances={setAppliances}
            calculo={calculationData.calculo}
            kitResult={calculationData.kitResult}
            optimizedResult={calculationData.optimizedResult}
            installResult={calculationData.installResult}
            projectTotals={calculationData.projectTotals}
            onSaveCloud={handleSaveCloud}
            onExportJson={handleExportJson}
            onReset={handleReset}
            saveStatus={saveStatus}
            advisories={advisories}
            onToggleAdvisory={handleToggleAdvisory}
            onOpenCommercialCard={handleOpenCommercialCard}
            onOpenViability={handleOpenViability}
          />
        )}

        {activeTab === 'catalogo' && <CatalogoView />}

        {activeTab === 'parametros' && (
          <ParametrosTab
            businessParams={businessParams}
            setBusinessParams={setBusinessParams}
            projectInstallParams={projectInstallParams}
            setProjectInstallParams={setProjectInstallParams}
            installResult={calculationData.installResult}
            projectTotals={calculationData.projectTotals}
          />
        )}

        {activeTab === 'proyectos' && (
          <ProyectosTab
            proyectos={proyectos}
            loadingProyectos={loadingProyectos}
            onRefresh={fetchProyectos}
            onLoadProject={handleLoadProject}
            onDeleteProject={handleDeleteProject}
          />
        )}
      </div>
    </div>
  );
}
