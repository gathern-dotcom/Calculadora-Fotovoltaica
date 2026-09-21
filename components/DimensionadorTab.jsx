'use client';

import { useState, useMemo } from 'react';
import {
  fmt,
  hpToWatts,
  wattsToClosestHp,
  calcCustomKitProposal
} from '../lib/solar-engine';
import {
  HP_OPTIONS,
  KITS,
  INVERTER_MODELS_CATALOG,
  BATTERY_MODELS_CATALOG,
  COMBINER_MODELS_CATALOG
} from '../lib/constants';

export default function DimensionadorTab({
  siteParams,
  setSiteParams,
  appliances,
  setAppliances,
  calculo,
  kitResult,
  optimizedResult,
  installResult,
  projectTotals,
  onSaveCloud,
  onExportJson,
  onReset,
  saveStatus,
  advisories = [],
  onToggleAdvisory,
  onOpenCommercialCard,
  onOpenViability
}) {
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);

  // Estado para colapsar/desplegar el personalizador manual
  const [showCustomKit, setShowCustomKit] = useState(false);

  // Estado del Personalizador Manual a partir de un Kit
  const [customConfig, setCustomConfig] = useState({
    baseKitId: 'K5',
    panelW: 625,
    panelQty: 9,
    inverterModel: 'Inversor FOC Energy, 6.4KW, 48V, 120/240V',
    inverterQty: 1,
    inverterW: 6400,
    batteryModel: 'Batería LFP FOC Energy, 48V, 11 KWh',
    batteryQty: 1,
    batteryKwh: 11.0,
    combinerModel: 'Combiner Box DC Suntree 3 in 1 out',
    combinerQty: 1,
    soporteQty: 5,
    cableMeters: 74
  });

  const handleLoadBaseKit = kitId => {
    const kit = KITS.find(k => k.id === kitId);
    if (!kit) return;
    const inv =
      INVERTER_MODELS_CATALOG.find(i => i.value === kit.inversor) ||
      INVERTER_MODELS_CATALOG[0];
    const bat =
      BATTERY_MODELS_CATALOG.find(b => b.value === kit.bateriaModelo) ||
      BATTERY_MODELS_CATALOG[0];
    const comb =
      COMBINER_MODELS_CATALOG.find(c => c.value === kit.proteccionDC) ||
      COMBINER_MODELS_CATALOG[0];

    setCustomConfig({
      baseKitId: kit.id,
      panelW: kit.panelW,
      panelQty: kit.paneles,
      inverterModel: inv.value,
      inverterQty: 1,
      inverterW: inv.w,
      batteryModel: bat.value,
      batteryQty: kit.bateriaCant,
      batteryKwh: kit.bateriaKwhUnit,
      combinerModel: comb.value,
      combinerQty: 1,
      soporteQty: kit.soporte,
      cableMeters: kit.cable
    });
  };

  const customResult = useMemo(
    () => calcCustomKitProposal(customConfig),
    [customConfig]
  );

  const handleApplianceChange = (index, field, value) => {
    setAppliances(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'hp') {
        item.hp = parseFloat(value) || 0;
        if (item.hp > 0) {
          item.power = hpToWatts(item.hp);
        }
      } else if (field === 'power') {
        item.power = parseFloat(value) || 0;
        item.hp = parseFloat(wattsToClosestHp(item.power)) || 0;
      } else {
        item[field] = field === 'name' ? value : parseFloat(value) || 0;
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleAddRow = () => {
    setAppliances(prev => [...prev, { name: '', power: 0, qty: 1, hours: 0, hp: 0 }]);
  };

  const handleRemoveRow = index => {
    setAppliances(prev => prev.filter((_, i) => i !== index));
  };

  const handleAiExtract = async () => {
    if (!aiText.trim()) {
      setAiStatus({ type: 'danger', message: 'Escribe una descripción de los equipos primero.' });
      return;
    }

    setAiLoading(true);
    setAiStatus({ type: 'muted', message: 'Analizando con IA…' });

    try {
      const resp = await fetch('/api/analyze-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error desconocido');
      if (!data.equipos || !data.equipos.length)
        throw new Error('La IA no encontró equipos identificables en el texto.');

      const newRows = data.equipos.map(eq => ({
        name: eq.equipo || '',
        power: eq.potencia_w || 0,
        qty: eq.cantidad || 1,
        hours: eq.horas_dia || 0,
        hp: eq.hp || 0
      }));

      setAppliances(prev => [...prev, ...newRows]);
      setAiStatus({
        type: 'success',
        message: `✓ Se agregaron ${newRows.length} equipo(s) a la tabla.`
      });
      setAiText('');
    } catch (err) {
      setAiStatus({ type: 'danger', message: 'Error: ' + err.message });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="w-full font-sans">
      <main className="max-w-[1280px] mx-auto p-4 sm:p-7 grid grid-cols-1 lg:grid-cols-[minmax(340px,460px)_1fr] gap-6">
        
        {/* COLUMNA IZQUIERDA: ENTRADAS */}
        <div className="space-y-5">
          {/* Consumo */}
          <section className="card">
            <h2 className="section-title">Consumo eléctrico</h2>

            <div className="field-row">
              <label htmlFor="kwhMonth">
                Consumo total (kWh/mes)
                <span className="hint">Tómalo del recibo de energía — se convierte a diario automáticamente</span>
              </label>
              <input
                id="kwhMonth"
                type="number"
                min="0"
                step="1"
                value={siteParams.kwhMonth}
                onChange={e =>
                  setSiteParams(p => ({ ...p, kwhMonth: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>

            <div className="flex items-center gap-2 my-3 text-xs text-brand-muted">
              <input
                type="checkbox"
                id="useTableSum"
                checked={siteParams.useTableSum}
                onChange={e => setSiteParams(p => ({ ...p, useTableSum: e.target.checked }))}
                className="rounded border-border"
              />
              <label htmlFor="useTableSum" className="cursor-pointer">
                Usar la suma de la tabla de equipos en vez del consumo mensual, para dimensionar paneles/batería
              </label>
            </div>

            <div className="border-t border-border pt-3 mt-3">
              <p className="text-[11.5px] text-brand-muted mb-3 leading-relaxed">
                Esta tabla siempre se usa para calcular la <strong>carga simultánea</strong> (dimensiona el inversor). Ajusta los equipos reales del proyecto:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px] border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[11px] uppercase text-brand-muted font-medium">
                      <th className="py-2 pr-1">Equipo</th>
                      <th className="py-2 px-1 w-20">Motor (HP)</th>
                      <th className="py-2 px-1 w-14">Pot. (W)</th>
                      <th className="py-2 px-1 w-12">Cant.</th>
                      <th className="py-2 px-1 w-12">Hrs/día</th>
                      <th className="py-2 px-1 text-right w-16">Wh/día</th>
                      <th className="py-2 pl-1 w-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {appliances.map((app, idx) => {
                      const sub = (app.power || 0) * (app.qty || 0) * (app.hours || 0);
                      return (
                        <tr key={idx}>
                          <td className="py-1.5 pr-1">
                            <input
                              type="text"
                              value={app.name}
                              onChange={e => handleApplianceChange(idx, 'name', e.target.value)}
                              className="w-full text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <select
                              value={app.hp || '0'}
                              onChange={e => handleApplianceChange(idx, 'hp', e.target.value)}
                              className="f-hp w-full text-[11px]"
                            >
                              {HP_OPTIONS.map(o => (
                                <option key={o.v} value={o.v}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              type="number"
                              min="0"
                              value={app.power}
                              onChange={e => handleApplianceChange(idx, 'power', e.target.value)}
                              className="w-full text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              type="number"
                              min="1"
                              value={app.qty}
                              onChange={e => handleApplianceChange(idx, 'qty', e.target.value)}
                              className="w-full text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              max="24"
                              value={app.hours}
                              onChange={e => handleApplianceChange(idx, 'hours', e.target.value)}
                              className="w-full text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-1 text-right font-mono text-[11.5px] text-brand-muted whitespace-nowrap">
                            {fmt(sub)}
                          </td>
                          <td className="py-1.5 pl-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="text-brand-danger hover:font-bold text-sm leading-none"
                              title="Eliminar fila"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleAddRow}
                className="mt-3 text-xs text-brand-muted hover:text-brand-blue border border-dashed border-border hover:border-brand-blue rounded-md px-3 py-1.5 font-mono cursor-pointer transition-colors"
              >
                + Agregar equipo
              </button>
            </div>
          </section>

          {/* Parámetros del Sitio */}
          <section className="card">
            <h2 className="section-title">Parámetros del sitio y del sistema</h2>

            <div className="field-row">
              <label htmlFor="panelW">
                Panel solar
                <span className="hint">Catálogo de inventario oficial</span>
              </label>
              <select
                id="panelW"
                value={siteParams.panelW}
                onChange={e =>
                  setSiteParams(p => ({ ...p, panelW: parseFloat(e.target.value) }))
                }
              >
                <option value="585">585 W (Monofacial Luxen)</option>
                <option value="625">625 W (Monofacial Luxen)</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="battKwh">
                Batería (por unidad)
                <span className="hint">Capacidad LFP disponible en catálogo</span>
              </label>
              <select
                id="battKwh"
                value={siteParams.battKwh}
                onChange={e =>
                  setSiteParams(p => ({ ...p, battKwh: parseFloat(e.target.value) }))
                }
              >
                {siteParams.voltage === 24 ? (
                  <>
                    <option value="2.9">LP200AH (2.9 kWh · 12V)</option>
                    <option value="4.0">LP300AH (4.0 kWh · 12V)</option>
                  </>
                ) : (
                  <>
                    <option value="11.0">LC230 (11 kWh · 48V)</option>
                    <option value="16.0">LC300 (16 kWh · 48V)</option>
                  </>
                )}
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="autonomy">
                Autonomía nocturna (horas)
                <span className="hint">Horas sin sol que el banco de baterías debe cubrir</span>
              </label>
              <input
                id="autonomy"
                type="number"
                min="1"
                max="48"
                value={siteParams.autonomyHours}
                onChange={e =>
                  setSiteParams(p => ({
                    ...p,
                    autonomyHours: parseFloat(e.target.value) || 14
                  }))
                }
              />
            </div>

            <div className="field-row pt-1 border-t border-border">
              <label>
                Voltaje del sistema
                <span className="hint">Se ajusta solo según el inversor requerido</span>
              </label>
              <span className="mono text-sm font-semibold text-brand-text">
                {siteParams.voltage} V
              </span>
            </div>

            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center gap-2 text-xs text-brand-muted mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="advancedCheck"
                  checked={siteParams.showAdvanced}
                  onChange={e =>
                    setSiteParams(p => ({ ...p, showAdvanced: e.target.checked }))
                  }
                />
                <label htmlFor="advancedCheck" className="cursor-pointer">
                  Configurar parámetros avanzados
                </label>
              </div>

              {siteParams.showAdvanced && (
                <div className="space-y-3 pt-2">
                  <div className="field-row">
                    <label>
                      Horas de sol pico (HSP)
                      <span className="hint">kWh/m²/día de la región</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={siteParams.hsp}
                      onChange={e =>
                        setSiteParams(p => ({ ...p, hsp: parseFloat(e.target.value) || 3.8 }))
                      }
                    />
                  </div>
                  <div className="field-row">
                    <label>
                      Eficiencia global del sistema
                      <span className="hint">Pérdidas térmicas, ciclado litio y cableado</span>
                    </label>
                    <select
                      value={siteParams.efficiency}
                      onChange={e =>
                        setSiteParams(p => ({ ...p, efficiency: parseFloat(e.target.value) }))
                      }
                    >
                      <option value="0.85">85% — óptima teórica</option>
                      <option value="0.78">78% — aislada real en clima cálido (Recomendada)</option>
                      <option value="0.72">72% — pérdidas altas / alta nubosidad</option>
                    </select>
                  </div>
                  <div className="field-row">
                    <label>
                      Química de batería (DoD)
                      <span className="hint">Litio LFP certificado a ≥95%</span>
                    </label>
                    <select
                      value={siteParams.dod}
                      onChange={e =>
                        setSiteParams(p => ({ ...p, dod: parseFloat(e.target.value) }))
                      }
                    >
                      <option value="0.95">Litio LFP (95% DoD)</option>
                      <option value="0.90">Litio LFP (90% DoD Conservador)</option>
                      <option value="0.80">AGM/Gel (80% DoD)</option>
                    </select>
                  </div>
                  <div className="field-row">
                    <label>
                      Factor de seguridad del inversor
                      <span className="hint">Sobre la carga simultánea máxima</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      value={siteParams.safetyFactor}
                      onChange={e =>
                        setSiteParams(p => ({
                          ...p,
                          safetyFactor: parseFloat(e.target.value) || 1.25
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: RESULTADOS */}
        <div className="space-y-5">
          <section className="card">
            <h2 className="section-title">✨ Analizar equipos con IA</h2>
            <p className="text-xs text-brand-muted mb-2">
              Describe los equipos con tus palabras y deja que la IA llene la tabla:
            </p>
            <textarea
              rows="3"
              placeholder="Ej: tiene una nevera grande, dos bombillos en la sala, un televisor en las noches y una bomba de agua de 1 HP..."
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              className="w-full text-xs font-sans mb-2"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAiExtract}
                disabled={aiLoading}
                className="bg-transparent border border-border hover:border-brand-muted text-brand-text text-xs rounded-md px-3.5 py-2 font-semibold cursor-pointer transition-colors"
              >
                {aiLoading ? 'Analizando con IA…' : 'Analizar con IA'}
              </button>
              {aiStatus && (
                <span
                  className={`text-xs font-mono ${
                    aiStatus.type === 'success'
                      ? 'text-brand-success'
                      : aiStatus.type === 'danger'
                      ? 'text-brand-danger'
                      : 'text-brand-muted'
                  }`}
                >
                  {aiStatus.message}
                </span>
              )}
            </div>
          </section>

          <section className="card">
            <h2 className="section-title">Resultado del dimensionamiento</h2>

            <div className="kpi-grid">
              <div className="kpi">
                <div className="kpi-label">Consumo diario</div>
                <div className="kpi-value">{fmt(calculo.dailyWh)}<span className="unit">Wh/día</span></div>
                <div className="kpi-sub">{fmt(calculo.dailyWh / 1000, 2)} kWh/día</div>
              </div>

              <div className="kpi">
                <div className="kpi-label">Potencia FV requerida</div>
                <div className="kpi-value">{fmt(calculo.fvPowerNeeded)}<span className="unit">Wp</span></div>
                <div className="kpi-sub">Con {siteParams.hsp} HSP y {(siteParams.efficiency * 100).toFixed(0)}% de eficiencia</div>
              </div>

              <div className="kpi">
                <div className="kpi-label">Paneles solares</div>
                <div className="kpi-value">{calculo.numPaneles}<span className="unit">unidades</span></div>
                <div className="kpi-sub">De {siteParams.panelW} Wp cada uno</div>
              </div>

              <div className="kpi battery">
                <div className="kpi-label">Banco de baterías</div>
                <div className="kpi-value">{calculo.numBatteries}<span className="unit">unidades</span></div>
                <div className="kpi-sub">De {siteParams.battKwh} kWh — banco {fmt(calculo.bankKwh, 1)} kWh</div>
              </div>

              <div className="kpi col-span-2 sm:col-span-2">
                <div className="kpi-label">Inversor mínimo</div>
                <div className="kpi-value">{fmt(calculo.inverterW)}<span className="unit">W</span></div>
                <div className="kpi-sub">Redondeado al estándar del catálogo</div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* SECCIÓN INFERIOR: ASESOR, PERSONALIZADOR Y PROPUESTAS CON 3 PRECIOS */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-7 pb-8 space-y-6">
        
        {/* ASESOR DE INGENIERÍA */}
        {advisories && advisories.length > 0 && (
          <section className="card border border-brand-blue/30 bg-blue-50/30">
            <div className="flex flex-wrap items-center justify-between border-b border-blue-100 pb-3 mb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🔍</span>
                <h2 className="text-xs uppercase font-bold text-brand-blue tracking-wider m-0">
                  Observaciones y Recomendaciones de Ingeniería (Sinergy Advisor)
                </h2>
              </div>
              <span className="text-[11px] font-mono font-semibold text-brand-blue bg-white border border-blue-100 px-2.5 py-0.5 rounded">
                {advisories.filter(a => a.aplicado).length} de {advisories.length} aplicadas
              </span>
            </div>

            <div className="space-y-3">
              {advisories.map(adv => (
                <div
                  key={adv.id}
                  className={`p-4 rounded-lg border transition-all ${
                    adv.aplicado ? 'bg-white border-brand-success shadow-xs' : 'bg-white border-orange-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          adv.aplicado ? 'bg-green-100 text-brand-success' : 'bg-orange-100 text-brand-orange'
                        }`}
                      >
                        {adv.aplicado ? '✓ Recomendación Aplicada' : '⚠ Sugerencia de Confiabilidad'}
                      </span>
                      <h3 className="text-sm font-semibold text-brand-text mt-1 m-0">
                        {adv.titulo}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleAdvisory(adv.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                        adv.aplicado
                          ? 'bg-gray-100 hover:bg-gray-200 text-brand-muted border border-border'
                          : 'bg-brand-blue hover:bg-brand-blue-dark text-white'
                      }`}
                    >
                      {adv.aplicado ? '↩ Revertir a propuesta estándar' : '✓ Aplicar recomendación'}
                    </button>
                  </div>

                  <p className="text-xs text-brand-text leading-relaxed m-0 mb-2.5">
                    {adv.explicacionComercial}
                  </p>

                  <div className="bg-blue-50/50 border-l-2 border-brand-blue p-2.5 rounded text-[11.5px] text-brand-text">
                    <strong>Argumento para el cliente:</strong> {adv.argumentoVenta}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PERSONALIZADOR MANUAL COLAPSABLE */}
        <section className="card border border-dashed border-brand-blue/40 bg-gradient-to-b from-blue-50/20 to-transparent transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title mb-1 flex items-center gap-2">
                <span>🛠</span> Personalizador a la medida (Modificar todo manualmente)
              </h2>
              <p className="text-xs text-brand-muted m-0">
                Ajuste manual de componentes para cotizaciones especiales o consumos industriales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomKit(prev => !prev)}
              className="text-xs font-semibold px-3.5 py-2 rounded-md bg-white border border-brand-blue text-brand-blue hover:bg-blue-50 cursor-pointer transition-colors shadow-xs"
            >
              {showCustomKit ? '▲ Ocultar personalizador manual' : '▼ Modificar componentes manualmente'}
            </button>
          </div>

          {showCustomKit && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="text-xs text-brand-muted">
                  Selecciona un Kit base para precargar sus componentes y ajusta las cantidades que desees:
                </span>
                <div className="flex items-center gap-2">
                  <label htmlFor="baseKitSelect" className="text-xs font-semibold text-brand-text">
                    Cargar desde Kit:
                  </label>
                  <select
                    id="baseKitSelect"
                    value={customConfig.baseKitId}
                    onChange={e => handleLoadBaseKit(e.target.value)}
                    className="text-xs font-bold text-brand-blue bg-white border border-brand-blue rounded px-3 py-1.5 focus:outline-none cursor-pointer"
                  >
                    {KITS.map(k => (
                      <option key={k.id} value={k.id}>
                        {k.id} — {k.nombre} ({k.inversorW / 1000} kW)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Formulario de componentes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div className="bg-white border border-border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-brand-text">
                    <span>☀️ Paneles Solares</span>
                    <span className="text-brand-muted font-mono">{customConfig.panelQty * customConfig.panelW} Wp</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-brand-muted block mb-1">Potencia</label>
                      <select
                        value={customConfig.panelW}
                        onChange={e => setCustomConfig(p => ({ ...p, panelW: parseFloat(e.target.value) }))}
                        className="w-full text-xs"
                      >
                        <option value="585">585 W</option>
                        <option value="625">625 W</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-brand-muted block mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={customConfig.panelQty}
                        onChange={e => setCustomConfig(p => ({ ...p, panelQty: parseInt(e.target.value) || 0 }))}
                        className="w-full text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-brand-text">
                    <span>⚡ Inversor</span>
                    <span className="text-brand-muted font-mono">{customConfig.inverterW * customConfig.inverterQty} W</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-brand-muted block mb-1">Modelo</label>
                    <select
                      value={customConfig.inverterModel}
                      onChange={e => {
                        const inv = INVERTER_MODELS_CATALOG.find(i => i.value === e.target.value);
                        setCustomConfig(p => ({
                          ...p,
                          inverterModel: e.target.value,
                          inverterW: inv ? inv.w : 5000
                        }));
                      }}
                      className="w-full text-xs"
                    >
                      {INVERTER_MODELS_CATALOG.map(inv => (
                        <option key={inv.value} value={inv.value}>
                          {inv.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[11px] text-brand-muted">Cantidad inversores:</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={customConfig.inverterQty}
                      onChange={e => setCustomConfig(p => ({ ...p, inverterQty: parseInt(e.target.value) || 1 }))}
                      className="w-20 text-xs text-center"
                    />
                  </div>
                </div>

                <div className="bg-white border border-border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-brand-text">
                    <span>🔋 Baterías Litio LFP</span>
                    <span className="text-brand-orange font-mono">{(customConfig.batteryQty * customConfig.batteryKwh).toFixed(1)} kWh</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-brand-muted block mb-1">Modelo de Batería</label>
                    <select
                      value={customConfig.batteryModel}
                      onChange={e => {
                        const bat = BATTERY_MODELS_CATALOG.find(b => b.value === e.target.value);
                        setCustomConfig(p => ({
                          ...p,
                          batteryModel: e.target.value,
                          batteryKwh: bat ? bat.kwh : 11.0
                        }));
                      }}
                      className="w-full text-xs"
                    >
                      {BATTERY_MODELS_CATALOG.map(b => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[11px] text-brand-muted">Cantidad módulos:</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={customConfig.batteryQty}
                      onChange={e => setCustomConfig(p => ({ ...p, batteryQty: parseInt(e.target.value) || 0 }))}
                      className="w-20 text-xs text-center"
                    />
                  </div>
                </div>

                <div className="bg-white border border-border rounded-lg p-3 space-y-2">
                  <span className="text-xs font-semibold text-brand-text block">🛡 Protección Combiner Box</span>
                  <div>
                    <label className="text-[11px] text-brand-muted block mb-1">Modelo de Caja</label>
                    <select
                      value={customConfig.combinerModel}
                      onChange={e => setCustomConfig(p => ({ ...p, combinerModel: e.target.value }))}
                      className="w-full text-xs"
                    >
                      {COMBINER_MODELS_CATALOG.map(c => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[11px] text-brand-muted">Cantidad cajas:</label>
                    <input
                      type="number"
                      min="1"
                      value={customConfig.combinerQty}
                      onChange={e => setCustomConfig(p => ({ ...p, combinerQty: parseInt(e.target.value) || 1 }))}
                      className="w-20 text-xs text-center"
                    />
                  </div>
                </div>

                <div className="bg-white border border-border rounded-lg p-3 space-y-2">
                  <span className="text-xs font-semibold text-brand-text block">🏗 Estructura de Montaje</span>
                  <div className="field-row mb-0">
                    <label className="text-[11px] text-brand-muted">
                      Kits soporte (2 paneles c/u):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customConfig.soporteQty}
                      onChange={e => setCustomConfig(p => ({ ...p, soporteQty: parseInt(e.target.value) || 0 }))}
                      className="w-20 text-xs text-center"
                    />
                  </div>
                </div>

                <div className="bg-white border border-border rounded-lg p-3 space-y-2">
                  <span className="text-xs font-semibold text-brand-text block">🔌 Cable Fotovoltaico 6mm</span>
                  <div className="field-row mb-0">
                    <label className="text-[11px] text-brand-muted">
                      Metros totales de cable:
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={customConfig.cableMeters}
                      onChange={e => setCustomConfig(p => ({ ...p, cableMeters: parseInt(e.target.value) || 0 }))}
                      className="w-24 text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Modalidad de precios para Sistema Personalizado */}
              <div className="bg-white border border-border rounded-lg p-4 shadow-xs">
                <div className="text-[11px] font-mono uppercase font-bold text-brand-muted mb-3 tracking-wider">
                  Modalidades de Precio del Sistema Personalizado:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded border border-border">
                    <span className="text-[11px] text-brand-muted block">Precio Normal (Crédito)</span>
                    <span className="text-base font-bold text-brand-text font-mono block mt-1">
                      ${fmt(customResult.precioCredito)} COP
                    </span>
                    <span className="text-[10px] text-brand-muted block">Recargo {(customResult.factorCredito - 1) * 100}%</span>
                  </div>

                  <div className="bg-blue-50/70 p-3 rounded border border-blue-200">
                    <span className="text-[11px] text-brand-blue font-bold uppercase block">Precio de Contado</span>
                    <span className="text-lg font-bold text-brand-blue font-mono block mt-1">
                      ${fmt(customResult.precioContado)} COP
                    </span>
                    <span className="text-[10px] text-brand-muted block">Tarifa base 2026</span>
                  </div>

                  <div className="bg-green-50/70 p-3 rounded border border-green-200">
                    <span className="text-[11px] text-brand-success font-bold uppercase block">Con Código Referido</span>
                    <span className="text-lg font-bold text-brand-success font-mono block mt-1">
                      ${fmt(customResult.precioReferido)} COP
                    </span>
                    <span className="text-[10px] text-brand-success font-semibold block">
                      Ahorro: ${fmt(customResult.ahorroReferido)} COP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* COMPARATIVA: KIT RECOMENDADO Y SISTEMA OPTIMIZADO (CON LOS 3 PRECIOS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Kit Recomendado */}
          <section className="card">
            <h2 className="section-title">Kit recomendado del catálogo</h2>
            {kitResult?.kit && (
              <div className={kitResult.cumple ? 'kit-card' : 'kit-card warn'}>
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <span className="text-[11px] font-mono text-brand-muted tracking-wider">{kitResult.kit.id}</span>
                    <div className="text-[18px] font-semibold text-brand-text">{kitResult.kit.nombre}</div>
                  </div>
                  <span className={`text-[11px] font-mono font-semibold ${kitResult.cumple ? 'text-brand-orange' : 'text-brand-danger'}`}>
                    {kitResult.cumple ? '✓ Cubre el requerimiento calculado' : '⚠ Requiere cotización personalizada'}
                  </span>
                </div>

                <ul className="kit-specs">
                  <li><span className="k">Paneles solares</span><span className="v">{kitResult.kit.paneles} un · {kitResult.kit.panelW} W · {fmt(kitResult.kit.totalWp)} Wp total</span></li>
                  <li><span className="k">Inversor</span><span className="v">{kitResult.kit.inversor}</span></li>
                  <li><span className="k">Baterías</span><span className="v">{kitResult.kit.bateriaCant} un · {kitResult.kit.bateriaModelo} · {fmt(kitResult.kit.totalBateriaKwh, 1)} kWh total</span></li>
                  <li><span className="k">Protección DC</span><span className="v">{kitResult.kit.proteccionDC}</span></li>
                  <li><span className="k">Soporte techo</span><span className="v">{kitResult.kit.soporte} kits (2 paneles c/u)</span></li>
                  <li><span className="k">Cable fotovoltaico</span><span className="v">{kitResult.kit.cable} m</span></li>
                </ul>

                {/* LAS 3 MODALIDADES DE PRECIO DEL KIT */}
                {kitResult.pricing?.precioContado && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="text-[11px] font-mono uppercase font-bold text-brand-muted mb-2 tracking-wider">
                      Modalidades de Pago Oficiales:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="bg-gray-50 p-2.5 rounded border border-border flex flex-col justify-between">
                        <span className="text-[11px] font-semibold text-brand-muted">Normal (Crédito)</span>
                        <div className="text-sm font-bold text-brand-text font-mono mt-1">
                          ${fmt(kitResult.pricing.precioCredito)} COP
                        </div>
                        <span className="text-[9.5px] text-brand-muted">Financiado</span>
                      </div>

                      <div className="bg-blue-50/70 p-2.5 rounded border border-blue-200 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-brand-blue uppercase">Contado</span>
                        <div className="text-base font-bold text-brand-blue font-mono mt-1">
                          ${fmt(kitResult.pricing.precioContado)} COP
                        </div>
                        <span className="text-[9.5px] text-brand-muted">Tarifa oficial 2026</span>
                      </div>

                      <div className="bg-green-50/70 p-2.5 rounded border border-green-200 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-brand-success uppercase">Con Referido</span>
                          <span className="text-[9px] bg-brand-success text-white px-1 py-0.5 rounded font-mono">
                            -{kitResult.pricing.pctDesc}%
                          </span>
                        </div>
                        <div className="text-base font-bold text-brand-success font-mono mt-1">
                          ${fmt(kitResult.pricing.precioReferido)} COP
                        </div>
                        <span className="text-[9.5px] text-brand-success font-semibold">
                          Ahorro: ${fmt(kitResult.pricing.ahorroReferido)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Sistema Optimizado */}
          <section className="card">
            <h2 className="section-title">Sistema optimizado — cálculo de ingeniería</h2>
            {optimizedResult ? (
              <div className="kit-card">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <span className="text-[11px] font-mono text-brand-muted tracking-wider">OPT</span>
                    <div className="text-[18px] font-semibold text-brand-text">Sistema optimizado</div>
                  </div>
                  <span className="text-[11px] font-mono text-brand-orange font-semibold">
                    ✓ Solución personalizada
                  </span>
                </div>

                <ul className="kit-specs">
                  <li><span className="k">Paneles solares</span><span className="v">{optimizedResult.totalPanels} un · {siteParams.panelW} W · {fmt(optimizedResult.totalPanels * siteParams.panelW)} Wp</span></li>
                  <li><span className="k">Inversores</span><span className="v">{optimizedResult.qty} × {optimizedResult.inverter?.brand} {optimizedResult.inverter?.w / 1000} kW · {fmt(optimizedResult.totalInverterW)} W total</span></li>
                  {optimizedResult.configs?.map((c, i) => (
                    <li key={i}><span className="k">Inversor {i + 1}</span><span className="v">{c.panels} paneles · {c.inverter?.type === 'foc' ? c.layout : `MPPT: ${c.layoutText}`}</span></li>
                  ))}
                  <li><span className="k">Baterías</span><span className="v">{calculo.batteryOpt?.qty} un · {calculo.batteryOpt?.modelKey} · {fmt(calculo.batteryOpt?.totalKwh, 1)} kWh</span></li>
                </ul>

                {/* LAS 3 MODALIDADES DE PRECIO DEL SISTEMA OPTIMIZADO */}
                {optimizedResult.pricing?.precioContado && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="text-[11px] font-mono uppercase font-bold text-brand-muted mb-2 tracking-wider">
                      Modalidades de Pago Oficiales:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="bg-gray-50 p-2.5 rounded border border-border flex flex-col justify-between">
                        <span className="text-[11px] font-semibold text-brand-muted">Normal (Crédito)</span>
                        <div className="text-sm font-bold text-brand-text font-mono mt-1">
                          ${fmt(optimizedResult.pricing.precioCredito)} COP
                        </div>
                        <span className="text-[9.5px] text-brand-muted">Financiado</span>
                      </div>

                      <div className="bg-blue-50/70 p-2.5 rounded border border-blue-200 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-brand-blue uppercase">Contado</span>
                        <div className="text-base font-bold text-brand-blue font-mono mt-1">
                          ${fmt(optimizedResult.pricing.precioContado)} COP
                        </div>
                        <span className="text-[9.5px] text-brand-muted">Tarifa oficial 2026</span>
                      </div>

                      <div className="bg-green-50/70 p-2.5 rounded border border-green-200 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-brand-success uppercase">Con Referido</span>
                          <span className="text-[9px] bg-brand-success text-white px-1 py-0.5 rounded font-mono">
                            -{optimizedResult.pricing.pctDesc}%
                          </span>
                        </div>
                        <div className="text-base font-bold text-brand-success font-mono mt-1">
                          ${fmt(optimizedResult.pricing.precioReferido)} COP
                        </div>
                        <span className="text-[9.5px] text-brand-success font-semibold">
                          Ahorro: ${fmt(optimizedResult.pricing.ahorroReferido)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-brand-muted py-4">No se encontró una configuración válida con las reglas actuales.</p>
            )}
          </section>
        </div>

        {/* Resumen Económico */}
        <section className="card">
          <h2 className="section-title">Costo de instalación y análisis de margen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-[13px] font-semibold mb-2 text-brand-text">Desglose de Instalación y Viáticos</h3>
              <ul className="kit-specs">
                <li><span className="k">Costo directo</span><span className="v">${fmt(installResult.costoDirecto)}</span></li>
                <li><span className="k">Costo ajustado</span><span className="v">${fmt(installResult.costoAjustado)}</span></li>
                <li><span className="k">Precio instalación</span><span className="v font-bold text-brand-blue">${fmt(installResult.precioFinal)} COP</span></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold mb-2 text-brand-text">Resumen Económico del Proyecto</h3>
              <ul className="kit-specs">
                <li><span className="k">Precio venta total</span><span className="v font-bold text-base text-brand-blue">${fmt(projectTotals.precioVentaTotal)} COP</span></li>
                <li><span className="k">Costo total proyecto</span><span className="v">${fmt(projectTotals.costoTotalProyecto)}</span></li>
                <li><span className="k">Margen bruto total</span><span className="v font-semibold">{fmt(projectTotals.margenBrutoPct, 1)}% (${fmt(projectTotals.margenBrutoCOP)})</span></li>
                <li><span className="k">Estado rentabilidad</span><span className="v"><span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold ${projectTotals.status === 'approved' ? 'bg-green-100 text-brand-success' : projectTotals.status === 'review' ? 'bg-orange-100 text-brand-orange' : 'bg-red-100 text-brand-danger'}`}>{projectTotals.statusText}</span></span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Acciones */}
        <section className="card">
          <div className="flex flex-wrap gap-2.5 items-center justify-between">
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={onSaveCloud}
                className="bg-brand-blue hover:bg-brand-blue-dark text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                Guardar proyecto
              </button>
              <button
                type="button"
                onClick={onOpenCommercialCard}
                className="bg-brand-orange hover:bg-[#E07000] text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                ✨ Generar Ficha Comercial (WhatsApp)
              </button>
              <button
                type="button"
                onClick={onOpenViability}
                className="bg-transparent border border-border hover:border-brand-muted text-brand-text text-[13px] font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                ✉ Solicitar Viabilidad
              </button>
              <button
                type="button"
                onClick={onExportJson}
                className="bg-transparent border border-border hover:border-brand-muted text-brand-text text-[13px] font-semibold px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                Exportar copia local (JSON)
              </button>
            </div>

            <button
              type="button"
              onClick={onReset}
              className="text-xs text-brand-muted hover:text-brand-danger font-semibold cursor-pointer"
            >
              Restablecer valores
            </button>
          </div>

          {saveStatus &&"
            >
              Restablecer valores
            </button>
          </div>

          {saveStatus && (
            <p className={`mt-3 text-xs font-mono font-semibold ${saveStatus.type === 'success' ? 'text-brand-success' : 'text-brand-danger'}`}>
              {saveStatus.message}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
