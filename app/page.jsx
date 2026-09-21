'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import DimensionadorTab from '../components/DimensionadorTab';
import ParametrosTab from '../components/ParametrosTab';
import ProyectosTab from '../components/ProyectosTab';
import {
  DEFAULT_BUSINESS_PARAMS,
  DEFAULT_INSTALL_PROJECT_PARAMS,
  DEFAULT_APPLIANCES
} from '../lib/constants';
import {
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

export default function Home() {
  // Pestaña activa: 'dimensionador' | 'parametros' | 'proyectos'
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
    // 1. Consumo diario Wh y Carga Simultánea W
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

    // 2. Inversor preliminar
    const rawInverterW = Math.round(peakLoadW * (siteParams.safetyFactor || 1.25));
    let candidateInvW = 3000;
    if (rawInverterW <= 3000) candidateInvW = 3000;
    else if (rawInverterW <= 5000) candidateInvW = 5000;
    else if (rawInverterW <= 6400) candidateInvW = 6400;
    else if (rawInverterW <= 8000) candidateInvW = 8000;
    else if (rawInverterW <= 10000) candidateInvW = 10000;
    else if (rawInverterW <= 12000) candidateInvW = 12000;
    else candidateInvW = 15000;

    // Upgrade por arranque de motores si está aplicado
    let inverterW = candidateInvW;
    if (appliedAdvisories['motor-inrush']) {
      inverterW = candidateInvW <= 3000 ? 5000 : candidateInvW <= 5000 ? 6400 : 8000;
    }

    // 3. Voltaje del sistema
    const voltage =
      siteParams.voltageOverride === 'auto'
        ? inverterW <= 4000
          ? 24
          : 48
        : parseFloat(siteParams.voltageOverride) || 48;

    // 4. Potencia FV y número de paneles
    const fvPowerNeeded =
      dailyWh / ((siteParams.hsp || 3.8) * (siteParams.efficiency || 0.78));

    let numPaneles = Math.max(1, Math.ceil(fvPowerNeeded / siteParams.panelW));
    if (appliedAdvisories['reserva-nubosidad']) {
      numPaneles += 2;
    }

    // 5. Dimensionamiento del banco de baterías
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

    // 6. Selección de Kit Recomendado del catálogo
    const kitResult = recommendKit(numPaneles * siteParams.panelW, bankKwh, inverterW);
    if (kitResult?.kit) {
      kitResult.pricing = calcKitPricing(kitResult.kit);
    }

    // 7. Sistema Optimizado (Ingeniería a la medida)
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

    // 8. Costos de Instalación y Viáticos
    const installResult = calcInstallCost(projectInstallParams, businessParams);

    // 9. Consolidado Financiero del Proyecto
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

  // Actualizar voltaje en siteParams si está en 'auto'
  useEffect(() => {
    if (siteParams.voltageOverride === 'auto' && calculationData.calculo.voltage !== siteParams.voltage) {
      setSiteParams(p => ({ ...p, voltage: calculationData.calculo.voltage }));
    }
  }, [calculationData.calculo.voltage, siteParams.voltageOverride, siteParams.voltage]);

  // Asesor de ingeniería
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
        // CAMPOS DE SEGUIMIENTO COMERCIAL (CRM)
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
          ? `${calculationData.kitResult.kit.id} — ${calculationData.kitResult.kit.nombre}`
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
    a.download = `Proyecto_FV_${(projectMeta.cliente || 'Sinergy').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
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

  // Enlace directo a WhatsApp con ficha técnica y comercial
  const handleOpenCommercialCard = () => {
    const kit = calculationData.kitResult?.kit;
    const precio = calculationData.kitResult?.pricing?.precioContado || calculationData.kitResult?.pricing?.precioFinal;
    const texto = encodeURIComponent(
      `*PROPUESTA COMERCIAL — SINERGY SOLUCIONES INTEGRALES*\n\n` +
      `👤 *Cliente:* ${projectMeta.cliente || 'Estimado cliente'}\n` +
      `📍 *Ubicación:* ${projectMeta.ubicacion || 'Colombia'}\n` +
      `☀️ *Kit Recomendado:* ${kit ? `${kit.id} —${kit.nombre}` : 'Personalizado'}\n` +
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

  // Solicitud de Viabilidad
  const handleOpenViability = () => {
    const nombre = projectMeta.cliente || 'Cliente';
    const kit = calculationData.kitResult?.kit?.nombre || 'Personalizado';
    alert(`✓ Solicitud de Viabilidad generada para ${nombre}.\nKit: ${kit} (${calculationData.calculo.inverterW}W).\nSe enviará a verificación técnica.`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-brand-text flex flex-col font-sans">
      {/* Encabezado con navegación de pestañas */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projectMeta={projectMeta}
        setProjectMeta={setProjectMeta}
      />

      {/* Contenido según la pestaña activa */}
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
