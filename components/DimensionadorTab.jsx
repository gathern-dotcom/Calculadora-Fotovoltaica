'use client';

import { useState } from 'react';
import {
  fmt,
  hpToWatts,
  wattsToClosestHp
} from '../lib/solar-engine';
import { HP_OPTIONS } from '../lib/constants';

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
  onOpenCommercialCard,
  onOpenViability
}) {
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);

  // Manejo de tabla de equipos
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

  // Manejo de Extracción IA
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
    <div className="max-w-[1360px] mx-auto p-4 sm:p-6 space-y-6">
      {/* GRID SUPERIOR: ENTRADAS Y RESULTADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: CONSUMO Y PARÁMETROS */}
        <div className="lg:col-span-5 space-y-5">
          {/* Tarjeta de Consumo */}
          <section className="bg-brand-panel border border-border rounded-xl p-5 shadow-xs">
            <h2 className="text-xs uppercase font-bold text-brand-muted tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-brand-blue rounded-xs inline-block"></span>
              Consumo Eléctrico
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center mb-3">
              <label htmlFor="kwhMonth" className="text-xs font-semibold text-brand-text">
                Consumo total (kWh/mes)
                <span className="block text-[11px] font-normal text-brand-muted">
                  Del recibo de luz
                </span>
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
                className="bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono text-right focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="flex items-center gap-2 mb-4 text-xs text-brand-muted">
              <input
                type="checkbox"
                id="useTableSum"
                checked={siteParams.useTableSum}
                onChange={e => setSiteParams(p => ({ ...p, useTableSum: e.target.checked }))}
                className="rounded border-border"
              />
              <label htmlFor="useTableSum" className="cursor-pointer">
                Usar suma de la tabla de equipos en vez del consumo mensual
              </label>
            </div>

            {/* Tabla de Equipos */}
            <div className="border-t border-border pt-4">
              <p className="text-[11px] text-brand-muted mb-3 leading-relaxed">
                Esta tabla alimenta el cálculo de la <strong>carga simultánea</strong> (dimensiona el inversor).
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase text-brand-muted font-mono">
                      <th className="py-2 pr-1">Equipo</th>
                      <th className="py-2 px-1 w-16">HP</th>
                      <th className="py-2 px-1 w-14">Pot (W)</th>
                      <th className="py-2 px-1 w-12">Cant.</th>
                      <th className="py-2 px-1 w-12">Hrs/d</th>
                      <th className="py-2 px-1 text-right w-16">Wh/día</th>
                      <th className="py-2 pl-1 w-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {appliances.map((app, idx) => {
                      const sub = (app.power || 0) * (app.qty || 0) * (app.hours || 0);
                      return (
                        <tr key={idx} className="group">
                          <td className="py-1.5 pr-1">
                            <input
                              type="text"
                              value={app.name}
                              onChange={e => handleApplianceChange(idx, 'name', e.target.value)}
                              placeholder="Ej: Nevera"
                              className="w-full bg-white border border-border rounded px-1.5 py-1 text-xs focus:outline-none focus:border-brand-blue"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <select
                              value={app.hp || '0'}
                              onChange={e => handleApplianceChange(idx, 'hp', e.target.value)}
                              className="w-full bg-white border border-border rounded px-1 py-1 text-[11px] font-mono focus:outline-none focus:border-brand-blue"
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
                              className="w-full bg-white border border-border rounded px-1 py-1 text-xs font-mono text-right focus:outline-none focus:border-brand-blue"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              type="number"
                              min="1"
                              value={app.qty}
                              onChange={e => handleApplianceChange(idx, 'qty', e.target.value)}
                              className="w-full bg-white border border-border rounded px-1 py-1 text-xs font-mono text-right focus:outline-none focus:border-brand-blue"
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
                              className="w-full bg-white border border-border rounded px-1 py-1 text-xs font-mono text-right focus:outline-none focus:border-brand-blue"
                            />
                          </td>
                          <td className="py-1.5 px-1 text-right font-mono text-[11px] text-brand-muted">
                            {fmt(sub)}
                          </td>
                          <td className="py-1.5 pl-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="text-brand-danger hover:font-bold text-sm"
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
                className="mt-3 text-xs text-brand-blue border border-dashed border-brand-blue/40 hover:border-brand-blue rounded-lg px-3 py-1.5 font-mono w-full transition-all"
              >
                + Agregar equipo
              </button>
            </div>
          </section>

          {/* Tarjeta de Parámetros del Sitio */}
          <section className="bg-brand-panel border border-border rounded-xl p-5 shadow-xs">
            <h2 className="text-xs uppercase font-bold text-brand-muted tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-brand-blue rounded-xs inline-block"></span>
              Parámetros del Sistema Solar
            </h2>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="font-semibold text-brand-text">Panel solar:</label>
                <select
                  value={siteParams.panelW}
                  onChange={e =>
                    setSiteParams(p => ({ ...p, panelW: parseFloat(e.target.value) }))
                  }
                  className="bg-white border border-border rounded-lg px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-brand-blue"
                >
                  <option value="585">585 W Monofacial</option>
                  <option value="625">625 W Monofacial</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="font-semibold text-brand-text">Batería LFP (unitaria):</label>
                <select
                  value={siteParams.battKwh}
                  onChange={e =>
                    setSiteParams(p => ({ ...p, battKwh: parseFloat(e.target.value) }))
                  }
                  className="bg-white border border-border rounded-lg px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-brand-blue"
                >
                  {siteParams.voltage === 24 ? (
                    <>
                      <option value="2.5">2.5 kWh (12V)</option>
                      <option value="2.9">2.9 kWh (12V)</option>
                      <option value="4">4.0 kWh (12V)</option>
                    </>
                  ) : (
                    <>
                      <option value="10">10 kWh (48V)</option>
                      <option value="11">11 kWh (48V)</option>
                      <option value="15">15 kWh (48V)</option>
                      <option value="16">16 kWh (48V)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="font-semibold text-brand-text">Autonomía nocturna (horas):</label>
                <input
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
                  className="bg-white border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 items-center pt-1 border-t border-border">
                <span className="font-semibold text-brand-text">Voltaje del sistema:</span>
                <span className="font-mono font-bold text-brand-blue text-sm">
                  {siteParams.voltage} V
                </span>
              </div>
            </div>

            {/* Parámetros Avanzados */}
            <div className="mt-4 pt-3 border-t border-border">
              <label className="flex items-center gap-2 text-xs text-brand-muted cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={siteParams.showAdvanced}
                  onChange={e =>
                    setSiteParams(p => ({ ...p, showAdvanced: e.target.checked }))
                  }
                />
                Configuración avanzada (HSP, Eficiencia, DoD, Seguridad)
              </label>

              {siteParams.showAdvanced && (
                <div className="space-y-2.5 pt-2 text-xs bg-white/70 p-3 rounded-lg border border-border">
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span>HSP (Horas Sol Pico):</span>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={siteParams.hsp}
                      onChange={e =>
                        setSiteParams(p => ({ ...p, hsp: parseFloat(e.target.value) || 3.6 }))
                      }
                      className="border border-border rounded px-2 py-1 font-mono text-right"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span>Eficiencia global:</span>
                    <select
                      value={siteParams.efficiency}
                      onChange={e =>
                        setSiteParams(p => ({ ...p, efficiency: parseFloat(e.target.value) }))
                      }
                      className="border border-border rounded px-2 py-1 text-xs"
                    >
                      <option value="0.90">90% — Instalación óptima</option>
                      <option value="0.85">85% — Típica estándar</option>
                      <option value="0.80">80% — Pérdidas altas</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span>Química / DoD Batería:</span>
                    <select
                      value={siteParams.dod}
                      onChange={e =>
                        setSiteParams(p => ({ ...p, dod: parseFloat(e.target.value) }))
                      }
                      className="border border-border rounded px-2 py-1 text-xs"
                    >
                      <option value="0.9">Litio LFP (90% DoD)</option>
                      <option value="0.8">AGM/Gel (80% DoD)</option>
                      <option value="0.5">Plomo-Ácido (50% DoD)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span>Factor seg. inversor:</span>
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
                      className="border border-border rounded px-2 py-1 font-mono text-right"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: EXTRACCIÓN IA Y RESULTADOS */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Asistente IA */}
          <section className="bg-brand-panel border border-brand-blue/30 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs uppercase font-bold text-brand-blue tracking-wider mb-2 flex items-center gap-2">
              <span>✨</span> Analizar Cargas con IA (Gemini)
            </h2>
            <p className="text-xs text-brand-muted mb-2">
              Describe los electrodomésticos en lenguaje natural y la IA completará la tabla automáticamente:
            </p>
            <textarea
              rows="2"
              placeholder="Ej: Tengo una nevera grande, 6 bombillos led en la finca, un televisor y una bomba sumergible de 1 HP que trabaja 2 horas..."
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              className="w-full bg-white border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-brand-blue resize-vertical"
            />
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={handleAiExtract}
                disabled={aiLoading}
                className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs"
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

          {/* Tarjetas KPI del Resultado */}
          <section className="bg-white border border-border rounded-xl p-5 shadow-xs">
            <h2 className="text-xs uppercase font-bold text-brand-muted tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-brand-blue rounded-xs inline-block"></span>
              Resultados del Dimensionamiento Técnico
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-brand-panel border-l-4 border-brand-blue rounded-lg p-3">
                <span className="text-[10px] uppercase font-bold text-brand-muted block">Consumo Diario</span>
                <span className="text-xl font-bold text-brand-text block mt-1">{fmt(calculo.dailyWh)} <span className="text-xs font-normal">Wh/día</span></span>
                <span className="text-[10px] font-mono text-brand-muted">{fmt(calculo.dailyWh / 1000, 2)} kWh/día</span>
              </div>

              <div className="bg-brand-panel border-l-4 border-brand-blue rounded-lg p-3">
                <span className="text-[10px] uppercase font-bold text-brand-muted block">Potencia FV Requerida</span>
                <span className="text-xl font-bold text-brand-text block mt-1">{fmt(calculo.fvPowerNeeded)} <span className="text-xs font-normal">Wp</span></span>
                <span className="text-[10px] font-mono text-brand-muted">{siteParams.hsp} HSP · {siteParams.efficiency * 100}% ef.</span>
              </div>

              <div className="bg-brand-panel border-l-4 border-brand-blue rounded-lg p-3">
                <span className="text-[10px] uppercase font-bold text-brand-muted block">Paneles Solares</span>
                <span className="text-xl font-bold text-brand-text block mt-1">{calculo.numPaneles} <span className="text-xs font-normal">unidades</span></span>
                <span className="text-[10px] font-mono text-brand-muted">De {siteParams.panelW}W cada uno</span>
              </div>

              <div className="bg-brand-panel border-l-4 border-brand-orange rounded-lg p-3">
                <span className="text-[10px] uppercase font-bold text-brand-muted block">Banco Baterías LFP</span>
                <span className="text-xl font-bold text-brand-text block mt-1">{calculo.numBatteries} <span className="text-xs font-normal">unidades</span></span>
                <span className="text-[10px] font-mono text-brand-muted">Banco {fmt(calculo.bankKwh, 1)} kWh ({siteParams.autonomyHours}h aut.)</span>
              </div>

              <div className="bg-brand-panel border-l-4 border-brand-blue rounded-lg p-3 col-span-2 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-brand-muted block">Inversor Mínimo Recomendado</span>
                <span className="text-xl font-bold text-brand-text block mt-1">{fmt(calculo.inverterW)} <span className="text-xs font-normal">W ({siteParams.voltage}V)</span></span>
                <span className="text-[10px] font-mono text-brand-muted">Carga pico: {fmt(calculo.peakLoadW)}W · Capacidad FV: {fmt(calculo.fvPowerNeeded)}Wp</span>
              </div>
            </div>

            {/* Esquema SVG */}
            <div className="mt-6 pt-4 border-t border-border">
              <svg viewBox="0 0 640 160" className="w-full h-auto max-h-36 block" xmlns="http://www.w3.org/2000/svg">
                <line x1="95" y1="60" x2="200" y2="60" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" className="flow-dash" />
                <line x1="255" y1="60" x2="360" y2="60" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" className="flow-dash" />
                <line x1="415" y1="60" x2="520" y2="60" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" className="flow-dash" />

                {/* Sol */}
                <g id="sunGroup">
                  <circle cx="55" cy="55" r="24" fill="#FFE600" opacity="0.85" />
                  <circle cx="55" cy="55" r="18" fill="#FF8000" />
                </g>
                <text x="55" y="105" textAnchor="middle" className="text-[10px] font-mono fill-gray-500">SOL</text>
                <text x="55" y="120" textAnchor="middle" className="text-xs font-bold font-mono fill-brand-blue">{siteParams.hsp} HSP</text>

                {/* Paneles */}
                <g>
                  <rect x="199" y="36" width="58" height="46" rx="4" fill="#F8FAFC" stroke="#0040CC" strokeWidth="1.5" />
                  <line x1="218" y1="36" x2="218" y2="82" stroke="#CBD5E1" strokeWidth="1" />
                  <line x1="237" y1="36" x2="237" y2="82" stroke="#CBD5E1" strokeWidth="1" />
                  <line x1="199" y1="51" x2="257" y2="51" stroke="#CBD5E1" strokeWidth="1" />
                  <line x1="199" y1="66" x2="257" y2="66" stroke="#CBD5E1" strokeWidth="1" />
                </g>
                <text x="228" y="105" textAnchor="middle" className="text-[10px] font-mono fill-gray-500">PANELES</text>
                <text x="228" y="120" textAnchor="middle" className="text-xs font-bold font-mono fill-brand-blue">{calculo.numPaneles} un.</text>

                {/* Baterías */}
                <g>
                  <rect x="360" y="42" width="55" height="38" rx="4" fill="#F8FAFC" stroke="#FF8000" strokeWidth="1.5" />
                  <rect x="365" y="48" width="12" height="26" fill="#FF8000" rx="1" opacity="0.8" />
                  <rect x="381" y="48" width="12" height="26" fill="#FF8000" rx="1" opacity="0.6" />
                  <rect x="397" y="48" width="12" height="26" fill="#FF8000" rx="1" opacity="0.3" />
                </g>
                <text x="387" y="105" textAnchor="middle" className="text-[10px] font-mono fill-gray-500">BATERÍAS</text>
                <text x="387" y="120" textAnchor="middle" className="text-xs font-bold font-mono fill-brand-orange">{calculo.numBatteries} un.</text>

                {/* Carga Bombillo */}
                <g>
                  <circle cx="550" cy="55" r="16" fill="#FFF6C4" stroke="#FFE600" strokeWidth="1.5" id="bulbGlow" />
                  <path d="M541 50a9 9 0 1 1 18 0c0 5-4 7-5 11h-8c-1-4-5-6-5-11z" fill="#FFE600" stroke="#FF8000" strokeWidth="1.2" id="bulbBody" />
                </g>
                <text x="550" y="105" textAnchor="middle" className="text-[10px] font-mono fill-gray-500">CARGA</text>
                <text x="550" y="120" textAnchor="middle" className="text-xs font-bold font-mono fill-brand-blue">{fmt(calculo.peakLoadW)} W</text>
              </svg>
            </div>
          </section>
        </div>
      </div>

      {/* PROPUESTAS COMERCIALES: KIT CATÁLOGO VS SISTEMA OPTIMIZADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kit Recomendado */}
        <section className="bg-brand-panel border border-brand-blue rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <div>
              <span className="text-[10px] font-mono text-brand-muted tracking-wider">PROPUESTA CATÁLOGO</span>
              <h3 className="text-base font-bold text-brand-blue m-0">
                {kitResult?.kit ? `${kitResult.kit.id} — ${kitResult.kit.nombre}` : 'Sin Kit Directo'}
              </h3>
            </div>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${kitResult?.cumple ? 'bg-green-100 text-brand-success' : 'bg-red-100 text-brand-danger'}`}>
              {kitResult?.cumple ? '✓ Cubre requerimiento' : '⚠ Requiere cotización especial'}
            </span>
          </div>

          {kitResult?.kit && (
            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border">
                <span className="text-brand-muted">Paneles:</span>
                <span className="col-span-2 font-mono font-semibold">{kitResult.kit.paneles} un · {kitResult.kit.panelW}W ({fmt(kitResult.kit.totalWp)} Wp)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border">
                <span className="text-brand-muted">Inversor:</span>
                <span className="col-span-2 font-mono font-semibold">{kitResult.kit.inversor}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border">
                <span className="text-brand-muted">Baterías:</span>
                <span className="col-span-2 font-mono font-semibold">{kitResult.kit.bateriaCant} un · {kitResult.kit.bateriaModelo} ({fmt(kitResult.kit.totalBateriaKwh, 1)} kWh)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border">
                <span className="text-brand-muted">Protección DC:</span>
                <span className="col-span-2 font-mono font-semibold">{kitResult.kit.proteccionDC}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border">
                <span className="text-brand-muted">Estructura & Cable:</span>
                <span className="col-span-2 font-mono font-semibold">{kitResult.kit.soporte} soportes techo · {kitResult.kit.cable}m cable</span>
              </div>

              {kitResult.pricing?.precioFinal && (
                <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-100 mt-3 flex justify-between items-center">
                  <span className="font-bold text-brand-blue text-xs uppercase">Precio Equipos (Kit):</span>
                  <span className="text-lg font-bold font-mono text-brand-blue">${fmt(kitResult.pricing.precioFinal)} COP</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Sistema Optimizado a la Medida */}
        <section className="bg-brand-panel border border-brand-orange rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <div>
              <span className="text-[10px] font-mono text-brand-muted tracking-wider">SISTEMA OPTIMIZADO</span>
              <h3 className="text-base font-bold text-brand-orange m-0">
                Solución a la Medida
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold bg-orange-100 text-brand-orange px-2 py-0.5 rounded">
              ✓ Balanceo de Strings & MPPT
            </span>
          </div>

          {optimizedResult ? (
            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border">
                <span className="text-brand-muted">Paneles:</span>
                <span className="col-span-2 font-mono font-semibold">{optimizedResult.totalPanels} un · {siteParams.panelW}W ({fmt(optimizedResult.totalPanels * siteParams.panelW)} Wp)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border">
                <span className="text-brand-muted">Inversores:</span>
                <span className="col-span-2 font-mono font-semibold">{optimizedResult.qty} × {optimizedResult.inverter?.brand} {optimizedResult.inverter?.w / 1000} kW ({fmt(optimizedResult.totalInverterW)} W total)</span>
              </div>
              {optimizedResult.configs?.map((c, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 py-1 border-b border-border bg-white/40 px-2 rounded">
                  <span className="text-brand-muted">Inversor {i + 1}:</span>
                  <span className="col-span-2 font-mono text-[11px]">{c.panels} paneles · {c.inverter?.type === 'foc' ? c.layout : `MPPT: ${c.layoutText}`}</span>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border">
                <span className="text-brand-muted">Baterías:</span>
                <span className="col-span-2 font-mono font-semibold">{calculo.batteryOpt?.qty} un · {calculo.batteryOpt?.modelKey} ({fmt(calculo.batteryOpt?.totalKwh, 1)} kWh)</span>
              </div>

              {optimizedResult.pricing?.precioFinal && (
                <div className="bg-orange-50/70 p-3 rounded-lg border border-orange-100 mt-3 flex justify-between items-center">
                  <span className="font-bold text-brand-orange text-xs uppercase">Precio Equipos (Optimizado):</span>
                  <span className="text-lg font-bold font-mono text-brand-orange">${fmt(optimizedResult.pricing.precioFinal)} COP</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-brand-muted py-4">No se pudo generar una configuración simétrica con las reglas actuales.</p>
          )}
        </section>
      </div>

      {/* ANÁLISIS DE INSTALACIÓN Y MARGEN GLOBAL */}
      <section className="bg-white border border-border rounded-xl p-5 shadow-xs">
        <h2 className="text-xs uppercase font-bold text-brand-muted tracking-wider mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-brand-blue rounded-xs inline-block"></span>
          Resumen Económico Llave en Mano (Equipos + Instalación)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-brand-muted">Costo Directo Instalación (Mano de obra + Viáticos + Km):</span>
              <span className="font-mono font-semibold">${fmt(installResult.costoDirecto)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-brand-muted">Costo Ajustado (con contingencias & garantías):</span>
              <span className="font-mono font-semibold">${fmt(installResult.costoAjustado)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-brand-muted">Precio Venta Instalación Cotizada:</span>
              <span className="font-mono font-bold text-brand-blue">${fmt(installResult.precioFinal)}</span>
            </div>
          </div>

          <div className="bg-brand-panel border border-border rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-brand-text uppercase">Precio Venta Total Proyecto:</span>
              <span className="text-2xl font-bold font-mono text-brand-blue">
                ${fmt(projectTotals.precioVentaTotal)} <span className="text-xs font-normal">COP</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-brand-muted">Margen Bruto Total Proyecto:</span>
              <span className="font-mono font-bold">{fmt(projectTotals.margenBrutoPct, 1)}% (${fmt(projectTotals.margenBrutoCOP)})</span>
            </div>
            <div>
              <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold font-mono ${
                projectTotals.status === 'approved'
                  ? 'bg-green-100 text-brand-success'
                  : projectTotals.status === 'review'
                  ? 'bg-orange-100 text-brand-orange'
                  : 'bg-red-100 text-brand-danger'
              }`}>
                {projectTotals.statusText}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BARRA DE ACCIONES PRINCIPALES */}
      <section className="bg-brand-panel border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onSaveCloud}
            className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-xs"
          >
            💾 Guardar en Base de Datos (Supabase)
          </button>
          <button
            type="button"
            onClick={onOpenCommercialCard}
            className="bg-brand-orange hover:bg-[#E07000] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-xs"
          >
            ✨ Ficha Comercial (WhatsApp)
          </button>
          <button
            type="button"
            onClick={onOpenViability}
            className="bg-white border border-brand-blue text-brand-blue hover:bg-blue-50 text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-xs"
          >
            ✉ Solicitar Viabilidad
          </button>
          <button
            type="button"
            onClick={onExportJson}
            className="bg-white border border-border text-brand-text hover:bg-gray-50 text-xs font-semibold px-3 py-2.5 rounded-lg transition-all"
          >
            Exportar JSON
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="text-xs text-brand-muted hover:text-brand-danger font-semibold px-2 py-1"
        >
          Restablecer Formulario
        </button>
      </section>

      {saveStatus && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold font-mono ${
            saveStatus.type === 'success'
              ? 'bg-green-50 text-brand-success border border-green-200'
              : 'bg-red-50 text-brand-danger border border-red-200'
          }`}
        >
          {saveStatus.message}
        </div>
      )}
    </div>
  );
}
