'use client';

import { useState, useMemo } from 'react';
import Header from '../components/Header';
import TabsNav from '../components/TabsNav';
import DimensionadorTab from '../components/DimensionadorTab';
import ParametrosTab from '../components/ParametrosTab';
import ProyectosTab from '../components/ProyectosTab';
import InventarioTab from '../components/InventarioTab';
import CommercialCardModal from '../components/CommercialCardModal';
import ViabilityModal from '../components/ViabilityModal';

import {
  DEFAULT_APPLIANCES,
  DEFAULT_INSTALL_PROJECT_PARAMS,
  DEFAULT_BUSINESS_PARAMS
} from '../lib/constants';

import {
  calcKitPricing,
  recommendKit,
  findOptimizedSolution,
  calcOptimizedBOM,
  calcOptimizedPrice,
  calcManualBattery,
  findCheapestBattery,
  calcInstallCost,
  calcProjectTotals
} from '../lib/solar-engine';

import { supabase } from '../lib/supabase';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dimensionador');

  // Estado: Metadatos del Cliente
  const [projectMeta, setProjectMeta] = useState({
    cliente: '',
    telefono: '',
    cedula: '',
    niu: '',
    ubicacion: ''
  });

  // Estado: Parámetros del Sitio y del Sistema
  const [siteParams, setSiteParams] = useState({
    kwhMonth: 0,
    useTableSum: false,
    panelW: 625,
    battKwh: 11,
    autonomyHours: 14,
    voltageOverride: 'auto',
    voltage: 48,
    showAdvanced: false,
    hsp: 3.6,
    efficiency: 0.85,
    dod: 0.9,
    safetyFactor: 1.25,
    manualSelection: false,
    manualInverterW: 5000,
    manualBatteryQty: 0
  });

  // Estado: Lista de Equipos
  const [appliances, setAppliances] = useState(DEFAULT_APPLIANCES);

  // Estado: Parámetros de Instalación (Proyecto y Negocio)
  const [projectInstallParams, setProjectInstallParams] = useState(DEFAULT_INSTALL_PROJECT_PARAMS);
  const [businessParams, setBusinessParams] = useState(DEFAULT_BUSINESS_PARAMS);

  // Estado: Modales y Estado de Guardado
  const [isCommercialCardOpen, setIsCommercialCardOpen] = useState(false);
  const [isViabilityOpen, setIsViabilityOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // ==================== MOTOR DE CÁLCULO REACTIVO ====================
  const calculationData = useMemo(() => {
    let dailyWh = 0;
    let peakLoadW = 0;

    appliances.forEach(app => {
      const p = parseFloat(app.power) || 0;
      const q = parseFloat(app.qty) || 0;
      const h = parseFloat(app.hours) || 0;
      dailyWh += p * q * h;
      peakLoadW += p * q;
    });

    if (!siteParams.useTableSum) {
      dailyWh = ((parseFloat(siteParams.kwhMonth) || 0) * 1000) / 30;
    }

    const hsp = siteParams.hsp || 3.6;
    const eff = siteParams.efficiency || 0.85;
    const dod = siteParams.dod || 0.9;
    const panelW = siteParams.panelW || 625;
    const safety = siteParams.safetyFactor || 1.25;

    const adjustedWh = eff > 0 ? dailyWh / eff : 0;
    const fvPowerNeeded = hsp > 0 ? adjustedWh / hsp : 0;
    const numPaneles = panelW > 0 ? Math.ceil(fvPowerNeeded / panelW) : 0;

    const rawInverterW = peakLoadW * safety;
    const INVERTER_SIZES = [3000, 5000, 6400, 8000, 10000, 12000, 15000];
    const standardFromLoad =
      INVERTER_SIZES.find(size => size >= rawInverterW) ||
      INVERTER_SIZES[INVERTER_SIZES.length - 1];

    const INVERTER_PV_CAPACITY = [
      { w: 3000, maxKwp: 2.5 },
      { w: 5000, maxKwp: 6.25 },
      { w: 6400, maxKwp: 7.5 },
      { w: 8000, maxKwp: 12 },
      { w: 10000, maxKwp: 15 },
      { w: 12000, maxKwp: 18 },
      { w: 15000, maxKwp: 22.5 }
    ];
    const fvKwp = fvPowerNeeded / 1000;
    const standardFromPV = (
      INVERTER_PV_CAPACITY.find(x => x.maxKwp >= fvKwp) ||
      INVERTER_PV_CAPACITY[INVERTER_PV_CAPACITY.length - 1]
    ).w;

    const inverterW = Math.max(standardFromLoad, standardFromPV);
    const voltage =
      siteParams.voltageOverride === 'auto'
        ? inverterW <= 4000
          ? 24
          : 48
        : parseFloat(siteParams.voltageOverride) || 48;

    const autonomyDays = (siteParams.autonomyHours || 14) / 24;
    const bankWh = dod > 0 ? (dailyWh * autonomyDays) / dod : 0;
    const bankKwh = bankWh / 1000;

    const battKwh = siteParams.battKwh || (voltage === 24 ? 2.9 : 11);
    const numBatteries =
      siteParams.manualBatteryQty > 0
        ? siteParams.manualBatteryQty
        : battKwh > 0
        ? Math.ceil(bankKwh / battKwh)
        : 0;

    // 1. Kit Recomendado
    const kitResult = recommendKit(fvPowerNeeded, bankKwh, inverterW);
    const kitPricing = kitResult?.kit ? calcKitPricing(kitResult.kit) : null;

    // 2. Sistema Optimizado
    const manualW = siteParams.manualSelection ? siteParams.manualInverterW : null;
    const optimized = findOptimizedSolution(numPanels, manualW, rawInverterW);
    const batteryOpt =
      siteParams.manualBatteryQty > 0
        ? (() => {
            const manualResult = calcManualBattery(bankKwh, voltage, battKwh);
            return {
              ...manualResult,
              qty: siteParams.manualBatteryQty,
              totalKwh: siteParams.manualBatteryQty * battKwh,
              total: manualResult.unitPrice * siteParams.manualBatteryQty
            };
          })()
        : findCheapestBattery(bankKwh, voltage);

    let optimizedPricing = null;
    let optimizedBOM = null;
    if (optimized) {
      optimizedBOM = calcOptimizedBOM(optimized, panelW, batteryOpt);
      optimizedPricing = calcOptimizedPrice(optimizedBOM, optimized);
    }

    // 3. Instalación y Totales del Proyecto
    const installResult = calcInstallCost(projectInstallParams, businessParams);
    const bomEquipos = kitPricing ? kitPricing.bom.total : optimizedBOM?.total || 0;
    const precioEquiposFinal =
      kitPricing?.precioFinal || optimizedPricing?.precioFinal || 0;

    const projectTotals = calcProjectTotals(
      bomEquipos,
      precioEquiposFinal,
      installResult,
      businessParams
    );

    return {
      calculo: {
        dailyWh,
        peakLoadW,
        fvPowerNeeded,
        numPaneles,
        bankKwh,
        numBatteries,
        inverterW,
        voltage,
        batteryOpt,
        panelW,
        battKwh
      },
      kitResult: { ...kitResult, pricing: kitPricing },
      optimizedResult: optimized ? { ...optimized, bom: optimizedBOM, pricing: optimizedPricing } : null,
      installResult,
      projectTotals
    };
  }, [appliances, siteParams, projectInstallParams, businessParams]);

  // Guardar en Supabase
  const handleSaveCloud = async () => {
    try {
      setSaveStatus({ type: 'muted', message: 'Guardando en Supabase…' });

      const payload = {
        cliente: projectMeta.cliente || null,
        telefono: projectMeta.telefono || null,
        cedula: projectMeta.cedula || null,
        niu: projectMeta.niu || null,
        ubicacion: projectMeta.ubicacion || null,
        parametros: {
          ...siteParams,
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
          margen_bruto_total_pct: calculationData.projectTotals.margenBrutoPct
        },
        kit_recomendado: calculationData.kitResult?.kit
          ? `${calculationData.kitResult.kit.id} — ${calculationData.kitResult.kit.nombre}`
          : null,
        kit_cumple: calculationData.kitResult?.cumple || null,
        precio_equipos: calculationData.kitResult?.pricing?.bom?.total || null,
        precio_con_descuento: calculationData.kitResult?.pricing?.precioConDescuento || null,
        precio_final: calculationData.kitResult?.pricing?.precioFinal || null,
        sistema_optimizado: calculationData.optimizedResult
          ? {
              paneles: calculationData.optimizedResult.totalPanels,
              marca: calculationData.optimizedResult.inverter?.brand,
              inversor_w: calculationData.optimizedResult.inverter?.w,
              cantidad_inversores: calculationData.optimizedResult.qty,
              distribucion: calculationData.optimizedResult.configs?.map(c =>
                c.inverter?.type === 'foc' ? c.layout : c.layoutText
              ),
              precio_equipos: calculationData.optimizedResult.bom?.total,
              precio_final: calculationData.optimizedResult.pricing?.precioFinal
            }
          : null,
        instalacion: calculationData.installResult
      };

      const { error } = await supabase.from('proyectos').insert(payload);
      if (error) throw error;

      setSaveStatus({
        type: 'success',
        message: '✓ Proyecto guardado exitosamente en la base de datos de Supabase.'
      });
    } catch (err) {
      console.error('Error al guardar en Supabase:', err);
      setSaveStatus({
        type: 'danger',
        message: 'Error al guardar en Supabase: ' + err.message
      });
    }
  };

  // Exportar JSON Local
  const handleExportJson = () => {
    const project = {
      cliente: projectMeta.cliente,
      telefono: projectMeta.telefono,
      cedula: projectMeta.cedula,
      niu: projectMeta.niu,
      ubicacion: projectMeta.ubicacion,
      fecha: new Date().toISOString(),
      siteParams,
      equipos: appliances,
      calculo: calculationData.calculo,
      kitRecomendado: calculationData.kitResult,
      sistemaOptimizado: calculationData.optimizedResult,
      instalacion: calculationData.installResult,
      totales: calculationData.projectTotals
    };

    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (projectMeta.cliente || 'proyecto').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `proyecto-sinergy-${safeName}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Restablecer formulario
  const handleReset = () => {
    if (!confirm('¿Deseas restablecer todos los valores al estado por defecto?')) return;
    setAppliances(DEFAULT_APPLIANCES);
    setProjectMeta({ cliente: '', telefono: '', cedula: '', niu: '', ubicacion: '' });
    setSiteParams({
      kwhMonth: 0,
      useTableSum: false,
      panelW: 625,
      battKwh: 11,
      autonomyHours: 14,
      voltageOverride: 'auto',
      voltage: 48,
      showAdvanced: false,
      hsp: 3.6,
      efficiency: 0.85,
      dod: 0.9,
      safetyFactor: 1.25,
      manualSelection: false,
      manualInverterW: 5000,
      manualBatteryQty: 0
    });
    setSaveStatus(null);
  };

  // Cargar proyecto desde Base de Datos
  const handleLoadProjectToDimensioner = p => {
    setProjectMeta({
      cliente: p.cliente || '',
      telefono: p.telefono || '',
      cedula: p.cedula || '',
      niu: p.niu || '',
      ubicacion: p.ubicacion || ''
    });

    if (p.parametros) {
      setSiteParams(prev => ({
        ...prev,
        ...p.parametros,
        kwhMonth: p.parametros.kwhMonth || 0
      }));
      if (p.parametros.instalacion) {
        setProjectInstallParams(p.parametros.instalacion);
      }
      if (p.parametros.tarifas) {
        setBusinessParams(p.parametros.tarifas);
      }
    }

    if (Array.isArray(p.equipos) && p.equipos.length > 0) {
      setAppliances(p.equipos);
    }
  };

  return (
    <div className="min-h-screen bg-white text-brand-text flex flex-col font-sans">
      <Header projectMeta={projectMeta} setProjectMeta={setProjectMeta} />
      <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1">
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
            onOpenCommercialCard={() => setIsCommercialCardOpen(true)}
            onOpenViability={() => setIsViabilityOpen(true)}
          />
        )}

        {activeTab === 'parametros' && (
          <ParametrosTab
            projectInstallParams={projectInstallParams}
            setProjectInstallParams={setProjectInstallParams}
            businessParams={businessParams}
            setBusinessParams={setBusinessParams}
            onResetDefaults={() => {
              setProjectInstallParams(DEFAULT_INSTALL_PROJECT_PARAMS);
              setBusinessParams(DEFAULT_BUSINESS_PARAMS);
            }}
          />
        )}

        {activeTab === 'proyectos' && (
          <ProyectosTab
            onLoadProjectToDimensioner={handleLoadProjectToDimensioner}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'inventario' && (
          <InventarioTab
            currentProjectReqs={{
              numPaneles: calculationData.calculo.numPaneles,
              panelW: siteParams.panelW,
              numBaterias: calculationData.calculo.numBatteries,
              battKwh: siteParams.battKwh,
              inverterW: calculationData.calculo.inverterW
            }}
          />
        )}
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-brand-muted font-mono">
        Dimensionador FV — Sinergy Soluciones Integrales · Plataforma de Ingeniería y Preventa Solar Off-Grid
      </footer>

      {/* MODAL FICHA COMERCIAL PNG */}
      <CommercialCardModal
        isOpen={isCommercialCardOpen}
        onClose={() => setIsCommercialCardOpen(false)}
        projectData={{
          cliente: projectMeta.cliente,
          telefono: projectMeta.telefono,
          cedula: projectMeta.cedula,
          niu: projectMeta.niu,
          ubicacion: projectMeta.ubicacion,
          fecha: new Date().toISOString(),
          calculo: calculationData.calculo,
          kitResult: calculationData.kitResult,
          optimizedResult: calculationData.optimizedResult,
          installResult: calculationData.installResult,
          projectTotals: calculationData.projectTotals
        }}
      />

      {/* MODAL SOLICITUD DE VIABILIDAD */}
      <ViabilityModal
        isOpen={isViabilityOpen}
        onClose={() => setIsViabilityOpen(false)}
        projectData={{
          cliente: projectMeta.cliente,
          telefono: projectMeta.telefono,
          cedula: projectMeta.cedula,
          niu: projectMeta.niu,
          ubicacion: projectMeta.ubicacion,
          calculo: calculationData.calculo,
          kitResult: calculationData.kitResult,
          optimizedResult: calculationData.optimizedResult,
          projectTotals: calculationData.projectTotals,
          appliances
        }}
      />
    </div>
  );
}
