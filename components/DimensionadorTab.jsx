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

// Factores oficiales de descuento por Kit
const KIT_DISCOUNT_FACTORS = {
  K1: 0.900,
  K2: 0.910,
  K3: 0.920,
  K4: 0.920,
  K5: 0.925,
  K6: 0.930,
  K7: 0.940,
  K8: 0.945,
  K9: 0.950,
  K10: 0.954
};

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

  // Estado del Personalizador Manual a partir de un Kit
  const [customConfig, setCustomConfig] = useState({
    baseKitId: 'K5',
    panelW: 625,
    panelQty: 10,
    inverterModel: 'Inversor FOC Energy, 6.4KW, 48V, 120/240V',
    inverterQty: 1,
    inverterW: 6400,
    batteryModel: 'Batería LFP FOC Energy, 48V, 11 kWh',
    batteryQty: 1,
    batteryKwh: 11.78,
    combinerModel: 'Combiner Box DC Suntree 5 in 1 out',
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
      batteryKwh: bat.kwh,
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

  const customDiscountFactor = KIT_DISCOUNT_FACTORS[customConfig.baseKitId] || 1;
  const customDiscountPct = Math.round((1 - customDiscountFactor) * 1000) / 10;
  const customDiscountedPrice =
    customResult.precioConDescuento ||
    Math.round((customResult.precioFinal * customDiscountFactor) / 10000) * 10000;

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
      {/* SECCIÓN PRINCIPAL EN GRID 2 COLUMNAS */}
      <main className="max-w-[1280px] mx-auto p-4 sm:p-7 grid grid-cols-1 lg:grid-cols-[minmax(340px,460px)_1fr] gap-6">
        
        {/* COLUMNA IZQUIERDA: ENTRADAS */}
        <div className="space-y-5">
          {/* Tarjeta de Consumo */}
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
                Esta tabla siempre se usa para calcular la <strong>carga simultánea</strong> (dimensiona el inversor), sin importar el interruptor de arriba. Ajusta los equipos a los reales del proyecto para que el inversor quede bien calculado.
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

          {/* Tarjeta de Parámetros del Sitio */}
          <section className="card">
            <h2 className="section-title">Parámetros del sitio y del sistema</h2>

            <div className="field-row">
              <label htmlFor="panelW">
                Panel solar
                <span className="hint">Según disponibilidad de inventario actual</span>
              </label>
              <select
                id="panelW"
                value={siteParams.panelW}
                onChange={e =>
                  setSiteParams(p => ({ ...p, panelW: parseFloat(e.target.value) }))
                }
              >
                <option value="585">585 W</option>
                <option value="625">625 W</option>
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

            {/* Parámetros Avanzados */}
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
                      <span className="hint">kWh/m²/día de tu zona</span>
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
                      <span className="hint">Pérdidas térmicas, MPPT, ciclado litio y cableado</span>
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
                      <span className="hint">Catálogo Sinergy usa LFP certificado a ≥95%</span>
                    </label>
                    <select
                      value={siteParams.dod}
                      onChange={e =>
                        setSiteParams(p => ({ ...p, dod: parseFloat(e.target.value) }))
                      }
                    >
                      <option value="0.95">Litio LFP (95% DoD Datasheet)</option>
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

        {/* COLUMNA DERECHA: ASISTENTE IA Y RESULTADOS */}
        <div className="space-y-5">
          
          {/* Asistente IA */}
          <section className="card">
            <h2 className="section-title">✨ Analizar equipos con IA</h2>
            <p className="text-xs text-brand-muted mb-2">
              Describe los equipos con tus palabras y deja que la IA llene la tabla:
            </p>
            <textarea
              rows="3"
              placeholder="Ej: tiene una nevera grande, dos bombillos en la sala, un televisor que usa en las noches, y una bomba de agua que enciende una hora al día..."
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

          {/* Resultado del Dimensionamiento */}
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
                <div className="kpi-sub">Redondeado al estándar del catálogo (según carga simultánea)</div>
              </div>
            </div>

            {/* Esquema SVG con las 5 etapas (Incluye Inversor) */}
            <div className="mt-5 pt-4 border-t border-border">
              <svg viewBox="0 0 700 160" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
                {/* Líneas de flujo animadas */}
                <line x1="85" y1="60" x2="162" y2="60" stroke="#C9C9C9" strokeWidth="2" className="flow-dash" />
                <line x1="235" y1="60" x2="310" y2="60" stroke="#C9C9C9" strokeWidth="2" className="flow-dash" />
                <line x1="380" y1="60" x2="455" y2="60" stroke="#C9C9C9" strokeWidth="2" className="flow-dash" />
                <line x1="525" y1="60" x2="600" y2="60" stroke="#C9C9C9" strokeWidth="2" className="flow-dash" />

                {/* 1. SOL */}
                <g id="sunIcon">
                  <circle cx="50" cy="55" r="26" fill="#FFE600" opacity="0.25" />
                  <circle cx="50" cy="55" r="20" fill="#FFE600" opacity="0.6" />
                  <circle cx="50" cy="55" r="15" fill="#FF8000" />
                  <g stroke="#FF8000" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="50" y1="26" x2="50" y2="20" />
                    <line x1="50" y1="84" x2="50" y2="90" />
                    <line x1="21" y1="55" x2="15" y2="55" />
                    <line x1="79" y1="55" x2="85" y2="55" />
                    <line x1="29" y1="34" x2="25" y2="30" />
                    <line x1="71" y1="76" x2="75" y2="80" />
                    <line x1="29" y1="76" x2="25" y2="80" />
                    <line x1="71" y1="34" x2="75" y2="30" />
                  </g>
                </g>
                <text x="50" y="105" textAnchor="middle" className="text-[11px] font-mono fill-brand-muted">SOL</text>
                <text x="50" y="122" textAnchor="middle" className="text-[13px] font-semibold fill-brand-text">{siteParams.hsp} HSP</text>

                {/* 2. PANELES */}
                <g>
                  <rect x="171" y="36" width="58" height="46" rx="3" fill="#F8FAFC" stroke="#0040CC" strokeWidth="1.5" />
                  <line x1="190.3" y1="36" x2="190.3" y2="82" stroke="#CBD5E1" strokeWidth="1" />
                  <line x1="209.6" y1="36" x2="209.6" y2="82" stroke="#CBD5E1" strokeWidth="1" />
                  <line x1="171" y1="50.6" x2="229" y2="50.6" stroke="#CBD5E1" strokeWidth="1" />
                  <line x1="171" y1="65.3" x2="229" y2="65.3" stroke="#CBD5E1" strokeWidth="1" />
                </g>
                <text x="200" y="105" textAnchor="middle" className="text-[11px] font-mono fill-brand-muted">PANELES</text>
                <text x="200" y="122" textAnchor="middle" className="text-[13px] font-semibold fill-brand-text">{calculo.numPaneles} un.</text>

                {/* 3. BATERÍAS */}
                <g>
                  <rect x="339" y="33" width="6" height="7" fill="#FF8000" />
                  <rect x="317" y="40" width="56" height="38" rx="3" fill="#F8FAFC" stroke="#FF8000" strokeWidth="1.5" />
                  <rect x="323" y="46" width="12" height="26" fill="#FF8000" opacity="0.85" rx="1" />
                  <rect x="339" y="46" width="12" height="26" fill="#FF8000" opacity="0.55" rx="1" />
                  <rect x="355" y="46" width="12" height="26" fill="#FF8000" opacity="0.3" rx="1" />
                </g>
                <text x="345" y="105" textAnchor="middle" className="text-[11px] font-mono fill-brand-muted">BATERÍAS</text>
                <text x="345" y="122" textAnchor="middle" className="text-[13px] font-semibold fill-brand-orange">{calculo.numBatteries} un.</text>

                {/* 4. INVERSOR */}
                <g>
                  <rect x="462" y="36" width="56" height="46" rx="4" fill="#F8FAFC" stroke="#0040CC" strokeWidth="1.5" />
                  <rect x="470" y="43" width="40" height="13" rx="2" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="490" y="52.5" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#0040CC" fontWeight="bold">AC 120/240V</text>
                  <path d="M473 68 Q479 61 485 68 T497 68" fill="none" stroke="#FF8000" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="508" cy="68" r="2.5" fill="#149E60" />
                </g>
                <text x="490" y="105" textAnchor="middle" className="text-[11px] font-mono fill-brand-muted">INVERSOR</text>
                <text x="490" y="122" textAnchor="middle" className="text-[13px] font-semibold fill-brand-blue">{fmt(calculo.inverterW)} W</text>

                {/* 5. CARGA */}
                <g id="loadBulb">
                  <circle cx="635" cy="55" r="16" fill="none" stroke="#8C8C8C" strokeWidth="1.5" id="bulbGlow" />
                  <path d="M626 50a9 9 0 1 1 18 0c0 5-4 7-5 11h-8c-1-4-5-6-5-11z" fill="#ECECEC" stroke="#8C8C8C" strokeWidth="1.3" id="bulbBody" />
                  <path d="M631 55 l3 -6 l2 4 l3 -5" fill="none" stroke="#8C8C8C" strokeWidth="1" strokeLinecap="round" id="bulbFilament" />
                  <rect x="630" y="61" width="10" height="3" rx="1" fill="#C9C9C9" />
                  <rect x="631.5" y="64" width="7" height="2.5" rx="1" fill="#C9C9C9" />
                </g>
                <text x="635" y="105" textAnchor="middle" className="text-[11px] font-mono fill-brand-muted">CARGA</text>
                <text x="635" y="122" textAnchor="middle" className="text-[13px] font-semibold fill-brand-text">{fmt(calculo.peakLoadW)} W</text>
              </svg>
            </div>
          </section>
        </div>
      </main>

      {/* SECCIÓN INFERIOR: ASESOR DE INGENIERÍA, PROPUESTAS Y ACCIONES */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-7 pb-8 space-y-6">
        
        {/* ASESOR DE INGENIERÍA EN VIVO (OBSERVACIONES TÉCNICAS INTERACTIVAS) */}
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
                    adv.aplicado
                      ? 'bg-white border-brand-success shadow-xs'
                      : 'bg-white border-orange-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          adv.aplicado ? 'bg-green-100 text-brand-success' : 'bg-orange-100 text-brand-orange'
                        }`}
                      >
                        {adv.aplicado ? '✓ Recomendación Aplicada a la Cotización' : '⚠ Sugerencia de Confiabilidad'}
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
                      {adv.aplicado ? '↩ Revertir a propuesta estándar' : '✓ Aplicar recomendación de ingeniería'}
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

        {/* ======================================================== */}
        {/* PERSONALIZADOR MANUAL A PARTIR DE UN KIT                 */}
        {/* ======================================================== */}
        <section className="card border-2 border-dashed border-brand-blue/40 bg-gradient-to-b from-blue-50/20 to-transparent">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-4">
            <div>
              <h2 className="section-title mb-1">🛠 Personalizador a la medida (Modificar todo manualmente)</h2>
              <p className="text-xs text-brand-muted m-0">
                Selecciona un Kit del catálogo para precargar sus componentes y modifica manualmente las cantidades que desees:
              </p>
            </div>
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

          {/* Formulario de selección y ajuste de componentes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            
            {/* 1. Paneles */}
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

            {/* 2. Inversor */}
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

            {/* 3. Baterías LFP */}
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
                      batteryKwh: bat ? bat.kwh : 11.78
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

            {/* 4. Combiner Box */}
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

            {/* 5. Soportes de Techo */}
            <div className="bg-white border border-border rounded-lg p-3 space-y-2">
              <span className="text-xs font-semibold text-brand-text block">🏗 Estructura de Montaje</span>
              <div className="field-row mb-0">
                <label className="text-[11px] text-brand-muted">
                  Kits soporte (2 paneles c/u):
                  <span className="hint">Sugerido para {customConfig.panelQty} paneles: {Math.ceil(customConfig.panelQty / 2)} kits</span>
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

            {/* 6. Cableado Solar */}
            <div className="bg-white border border-border rounded-lg p-3 space-y-2">
              <span className="text-xs font-semibold text-brand-text block">🔌 Cable Fotovoltaico 6mm</span>
              <div className="field-row mb-0">
                <label className="text-[11px] text-brand-muted">
                  Metros totales de cable:
                  <span className="hint">Positivo + Negativo</span>
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

          {/* Resumen del Sistema Personalizado */}
          <div className="bg-white border border-border rounded-lg p-4 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <span className="text-[11px] font-mono text-brand-muted uppercase block">Costo BOM Equipos (U10)</span>
                <span className="text-lg font-bold text-brand-text">${fmt(customResult.bom.total)} COP</span>
                <span className="text-[11px] text-brand-muted block mt-0.5">Suma directa con precios mayoristas</span>
              </div>

              <div>
                <span className="text-[11px] font-mono text-brand-muted uppercase block">Fórmula de Escala Aplicada</span>
                <span className="text-xs font-bold text-brand-text font-mono">
                  U10 × {customResult.formula.mult} + ${fmt(customResult.formula.fijo1 + customResult.formula.fijo2)}
                </span>
                <span className="text-[11px] text-brand-muted block mt-0.5">Asignada por potencia de {customResult.totalInverterW / 1000} kW</span>
              </div>

              <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100 flex flex-col justify-center space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-mono text-brand-muted uppercase">Precio Lista:</span>
                  <span className="text-xs font-semibold text-brand-muted line-through">${fmt(customResult.precioFinal)} COP</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-mono text-brand-blue uppercase font-bold">Con Descuento ({customDiscountPct}%):</span>
                  <span className="text-xl font-bold text-brand-blue font-mono">${fmt(customDiscountedPrice)} COP</span>
                </div>
                <span className="text-[10.5px] text-brand-muted block">Redondeado a $10.000 COP</span>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARATIVA: KIT RECOMENDADO Y SISTEMA OPTIMIZADO */}
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
                  <li><span className="k">Soporte techo</span><span className="v">{kitResult.kit.soporte} un (2 paneles c/u)</span></li>
                  <li><span className="k">Cable fotovoltaico</span><span className="v">{kitResult.kit.cable} m</span></li>
                </ul>

                {kitResult.pricing?.precioFinal && (() => {
                  const factor = KIT_DISCOUNT_FACTORS[kitResult.kit.id] || 1;
                  const pct = Math.round((1 - factor) * 1000) / 10;
                  const precioDesc =
                    kitResult.pricing.precioConDescuento ||
                    Math.round((kitResult.pricing.precioFinal * factor) / 10000) * 10000;
                  const ahorro = kitResult.pricing.precioFinal - precioDesc;

                  return (
                    <ul className="kit-specs mt-3 pt-2 border-t border-border space-y-1">
                      <li>
                        <span className="k">Precio de lista oficial</span>
                        <span className="v text-brand-muted line-through text-xs">${fmt(kitResult.pricing.precioFinal)} COP</span>
                      </li>
                      <li>
                        <span className="k font-semibold text-brand-success">Precio con descuento ({pct}%)</span>
                        <span className="v text-brand-success font-bold text-base">${fmt(precioDesc)} COP</span>
                      </li>
                      {ahorro > 0 && (
                        <li>
                          <span className="k text-[11px] text-brand-muted">Ahorro comercial</span>
                          <span className="v text-brand-muted font-mono text-xs">-${fmt(ahorro)} COP</span>
                        </li>
                      )}
                    </ul>
                  );
                })()}
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

                {optimizedResult.pricing?.precioFinal && (
                  <ul className="kit-specs mt-3 pt-2 border-t border-border">
                    <li><span className="k">Precio final (llave en mano)</span><span className="v text-brand-blue font-bold text-sm">${fmt(optimizedResult.pricing.precioFinal)} COP</span></li>
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-xs text-brand-muted py-4">No se encontró una configuración válida con las reglas actuales.</p>
            )}
          </section>
        </div>

        {/* Resumen Económico de Instalación */}
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

