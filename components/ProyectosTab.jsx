'use client';

import { useState, useMemo } from 'react';
import { fmt } from '../lib/solar-engine';
import { supabase } from '../lib/supabase';

const ESTADOS_PIPELINE = [
  { id: 'cotizado', label: '📋 Cotizados / Nuevos', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'seguimiento', label: '📞 En Seguimiento', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'viabilidad', label: '📑 Viabilidad Solicitada', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'cierre', label: '🤝 En Cierre / Negociación', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'ganado', label: '✅ Ganados / Vendidos', badgeColor: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'perdido', label: '❌ Descartados', badgeColor: 'bg-gray-100 text-gray-500 border-gray-200' }
];

export default function ProyectosTab({
  proyectos = [],
  loadingProyectos = false,
  onRefresh,
  onLoadProject,
  onDeleteProject
}) {
  const [vista, setVista] = useState('pipeline'); // 'pipeline' | 'tabla'
  const [filtroTexto, setFiltroTexto] = useState('');
  const [soloPendientesHoy, setSoloPendientesHoy] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [mensajeCorreo, setMensajeCorreo] = useState(null);

  // Fecha actual local en formato YYYY-MM-DD
  const hoyStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Determinar urgencia del seguimiento
  const getSemaforo = (fecha, estado) => {
    if (estado === 'ganado' || estado === 'perdido') return { tipo: 'completado', texto: 'Cerrado', clase: 'bg-gray-100 text-gray-400' };
    if (!fecha) return { tipo: 'sin_fecha', texto: 'Sin fecha', clase: 'bg-gray-100 text-gray-500' };
    if (fecha < hoyStr) return { tipo: 'vencido', texto: '🔴 Vencido', clase: 'bg-red-100 text-red-700 font-bold' };
    if (fecha === hoyStr) return { tipo: 'hoy', texto: '🟡 Hoy', clase: 'bg-amber-100 text-amber-800 font-bold' };
    return { tipo: 'al_dia', texto: '🟢 Al día', clase: 'bg-green-50 text-green-700' };
  };

  // Conteo de recordatorios
  const metricas = useMemo(() => {
    let hoy = 0;
    let vencidos = 0;
    proyectos.forEach(p => {
      const estado = p.estado || 'cotizado';
      if (estado !== 'ganado' && estado !== 'perdido') {
        const fecha = p.fecha_proximo_contacto;
        if (fecha === hoyStr) hoy++;
        else if (fecha && fecha < hoyStr) vencidos++;
      }
    });
    return { hoy, vencidos };
  }, [proyectos, hoyStr]);

  // Filtrado de proyectos
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter(p => {
      const sem = getSemaforo(p.fecha_proximo_contacto, p.estado || 'cotizado');
      if (soloPendientesHoy && sem.tipo !== 'hoy' && sem.tipo !== 'vencido') return false;

      if (!filtroTexto.trim()) return true;
      const q = filtroTexto.toLowerCase();
      return (
        (p.cliente || '').toLowerCase().includes(q) ||
        (p.telefono || '').toLowerCase().includes(q) ||
        (p.cedula || '').toLowerCase().includes(q) ||
        (p.ubicacion || '').toLowerCase().includes(q) ||
        (p.kit_recomendado || '').toLowerCase().includes(q)
      );
    });
  }, [proyectos, filtroTexto, soloPendientesHoy, hoyStr]);

  // Actualizar campo de seguimiento en Supabase
  const handleUpdateFollowup = async (id, campos) => {
    try {
      const { error } = await supabase.from('proyectos').update(campos).eq('id', id);
      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error al actualizar seguimiento: ' + err.message);
    }
  };

  // Enlace directo a WhatsApp con mensaje prearmado
  const buildWhatsAppUrl = (p) => {
    if (!p.telefono) return null;
    const cleanPhone = p.telefono.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const nombre = p.cliente ? p.cliente.split(' ')[0] : 'Estimado cliente';
    const kit = p.kit_recomendado ? p.kit_recomendado.split('—')[0].trim() : 'sistema solar fotovoltaico';
    const ubicacion = p.ubicacion ? ` para tu predio en ${p.ubicacion}` : '';

    const mensaje = encodeURIComponent(
      `Hola ${nombre}, te saludamos de Sinergy Soluciones Integrales. Te escribimos para hacer seguimiento a la propuesta solar (${kit})${ubicacion} que preparamos para ti. ¿Pudiste revisarla o tienes alguna inquietud sobre los equipos o las facilidades de pago (contado o financiado)? Con gusto estamos atentos para resolver cualquier duda.`
    );
    return `https://wa.me/${finalPhone}?text=${mensaje}`;
  };

  // Enviar resumen por correo ahora
  const handleEnviarRecordatorioCorreo = async () => {
    setEnviandoCorreo(true);
    setMensajeCorreo(null);
    try {
      const res = await fetch('/api/send-reminders', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setMensajeCorreo({ tipo: 'ok', texto: `✓ ${data.message}` });
    } catch (err) {
      setMensajeCorreo({ tipo: 'err', texto: `Error: ${err.message}` });
    } finally {
      setEnviandoCorreo(false);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto p-4 sm:p-7 space-y-6 font-sans">
      
      {/* ======================================================== */}
      {/* 1. BANNER INTELIGENTE DE SEGUIMIENTOS DEL DÍA            */}
      {/* ======================================================== */}
      {(metricas.hoy > 0 || metricas.vencidos > 0) ? (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-l-4 border-brand-orange bg-white p-4 rounded-r-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🔔</span>
            <div>
              <h2 className="text-sm font-bold text-brand-text m-0 flex items-center gap-2">
                Atención comercial requerida para hoy
              </h2>
              <p className="text-xs text-brand-muted m-0 mt-0.5">
                Tienes <strong className="text-amber-800">{metricas.hoy} cliente(s)</strong> programados para seguimiento hoy
                {metricas.vencidos > 0 && (
                  <span> y <strong className="text-red-700">{metricas.vencidos} con seguimiento atrasado</strong></span>
                )}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoloPendientesHoy(prev => !prev)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                soloPendientesHoy
                  ? 'bg-brand-orange text-white'
                  : 'bg-white border border-brand-orange text-brand-orange hover:bg-orange-50'
              }`}
            >
              {soloPendientesHoy ? '✓ Mostrando solo pendientes' : 'Filtrar pendientes de hoy'}
            </button>
            <button
              type="button"
              onClick={handleEnviarRecordatorioCorreo}
              disabled={enviandoCorreo}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white border border-border hover:border-brand-muted text-brand-text transition-colors cursor-pointer"
              title="Enviar resumen a mi correo"
            >
              {enviandoCorreo ? 'Enviando…' : '✉ Enviar a mi correo'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50/70 border-l-4 border-brand-success p-3 rounded-r-lg flex items-center justify-between text-xs text-brand-success">
          <span className="font-semibold">✓ ¡Al día! No tienes seguimientos atrasados ni pendientes urgentes para hoy.</span>
          <button
            type="button"
            onClick={handleEnviarRecordatorioCorreo}
            disabled={enviandoCorreo}
            className="text-xs text-brand-text bg-white border border-border px-2.5 py-1 rounded hover:bg-gray-50"
          >
            {enviandoCorreo ? 'Enviando…' : '✉ Enviar resumen por correo'}
          </button>
        </div>
      )}

      {mensajeCorreo && (
        <div className={`p-2.5 text-xs rounded font-mono ${mensajeCorreo.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {mensajeCorreo.texto}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. BARRA DE CONTROL Y SELECTOR DE VISTA                  */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        {/* Selector de Vista */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setVista('pipeline')}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
              vista === 'pipeline'
                ? 'bg-white text-brand-blue shadow-xs font-bold'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            📊 Tablero de Seguimiento (Pipeline)
          </button>
          <button
            type="button"
            onClick={() => setVista('tabla')}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
              vista === 'tabla'
                ? 'bg-white text-brand-blue shadow-xs font-bold'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            📋 Historial en Tabla ({proyectos.length})
          </button>
        </div>

        {/* Buscador y Actualizar */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
          <input
            type="text"
            placeholder="Buscar por cliente, cédula, teléfono, ciudad..."
            value={filtroTexto}
            onChange={e => setFiltroTexto(e.target.value)}
            className="text-xs px-3 py-1.5 rounded border border-border w-full focus:outline-none focus:border-brand-blue"
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={loadingProyectos}
            className="text-xs px-3 py-1.5 bg-white border border-border hover:bg-gray-50 rounded text-brand-muted whitespace-nowrap cursor-pointer"
          >
            {loadingProyectos ? 'Cargando…' : '↻ Actualizar'}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. VISTA A: TABLERO DE SEGUIMIENTO (PIPELINE KANBAN)     */}
      {/* ======================================================== */}
      {vista === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 items-start">
          {ESTADOS_PIPELINE.map(col => {
            const items = proyectosFiltrados.filter(p => (p.estado || 'cotizado') === col.id);

            return (
              <div key={col.id} className="bg-gray-50/80 rounded-xl border border-border flex flex-col min-h-[480px]">
                {/* Cabecera de Columna */}
                <div className="p-3 border-b border-border bg-white rounded-t-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-text truncate">{col.label}</span>
                  <span className="text-[11px] font-mono font-semibold bg-gray-100 text-brand-muted px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>

                {/* Tarjetas de la Columna */}
                <div className="p-2.5 space-y-3 flex-1 overflow-y-auto max-h-[750px]">
                  {items.length === 0 ? (
                    <div className="p-6 text-center text-[11px] text-brand-muted font-mono italic">
                      Sin clientes en esta etapa
                    </div>
                  ) : (
                    items.map(p => {
                      const sem = getSemaforo(p.fecha_proximo_contacto, p.estado || 'cotizado');
                      const waLink = buildWhatsAppUrl(p);

                      return (
                        <div
                          key={p.id}
                          className="bg-white p-3 rounded-lg border border-border hover:border-brand-blue/60 transition-all shadow-2xs space-y-2.5"
                        >
                          {/* Cliente y Semáforo */}
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="font-semibold text-xs text-brand-text line-clamp-1">
                              {p.cliente || 'Cliente sin nombre'}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap ${sem.clase}`}>
                              {sem.texto}
                            </span>
                          </div>

                          {/* Kit y Valor */}
                          <div className="bg-blue-50/40 p-2 rounded border border-blue-100/60">
                            <span className="text-[10.5px] text-brand-blue font-bold block truncate">
                              {p.kit_recomendado || 'Cotización a la medida'}
                            </span>
                            <span className="text-xs font-mono font-bold text-brand-text">
                              ${fmt(p.precio_final)} COP
                            </span>
                          </div>

                          {/* Datos de contacto */}
                          <div className="text-[11px] text-brand-muted space-y-0.5">
                            {p.telefono && <div>📱 {p.telefono}</div>}
                            {p.ubicacion && <div className="truncate">📍 {p.ubicacion}</div>}
                          </div>

                          {/* Selector de fecha de próximo contacto */}
                          <div className="pt-1 border-t border-dashed border-border flex items-center justify-between gap-1">
                            <label className="text-[10px] text-brand-muted font-mono">Próximo contacto:</label>
                            <input
                              type="date"
                              value={p.fecha_proximo_contacto || ''}
                              onChange={e => handleUpdateFollowup(p.id, { fecha_proximo_contacto: e.target.value })}
                              className="text-[10.5px] font-mono py-0.5 px-1 border border-border rounded focus:outline-none"
                            />
                          </div>

                          {/* Notas rápidas */}
                          <div>
                            <input
                              type="text"
                              placeholder="Nota rápida de seguimiento..."
                              defaultValue={p.notas_seguimiento || ''}
                              onBlur={e => {
                                if (e.target.value !== (p.notas_seguimiento || '')) {
                                  handleUpdateFollowup(p.id, { notas_seguimiento: e.target.value });
                                }
                              }}
                              className="w-full text-[10.5px] p-1.5 rounded border border-border bg-gray-50 focus:bg-white focus:outline-none"
                            />
                          </div>

                          {/* Botones de acción rápida */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-1.5 border-t border-border">
                            {/* Selector de Estado */}
                            <select
                              value={p.estado || 'cotizado'}
                              onChange={e => handleUpdateFollowup(p.id, { estado: e.target.value })}
                              className="text-[10.5px] font-semibold text-brand-text bg-gray-50 border border-border rounded px-1.5 py-1 cursor-pointer focus:outline-none"
                            >
                              {ESTADOS_PIPELINE.map(st => (
                                <option key={st.id} value={st.id}>
                                  {st.label}
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1">
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded font-semibold cursor-pointer transition-colors"
                                  title="Enviar mensaje por WhatsApp"
                                >
                                  WhatsApp
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => onLoadProject(p)}
                                className="text-[10.5px] bg-brand-blue hover:bg-brand-blue-dark text-white px-2 py-1 rounded font-semibold cursor-pointer transition-colors"
                                title="Abrir en el dimensionador"
                              >
                                Abrir
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteProject(p.id)}
                                className="text-xs text-brand-danger hover:bg-red-50 p-1 rounded cursor-pointer"
                                title="Eliminar proyecto"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. VISTA B: TABLA HISTÓRICA COMPLETA                     */}
      {/* ======================================================== */}
      {vista === 'tabla' && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 border-b border-border text-brand-muted font-mono uppercase text-[10.5px]">
              <tr>
                <th className="py-3 px-3">Cliente</th>
                <th className="py-3 px-3">Contacto</th>
                <th className="py-3 px-3">Kit Cotizado</th>
                <th className="py-3 px-3 text-right">Valor Venta</th>
                <th className="py-3 px-3 text-center">Estado Comercial</th>
                <th className="py-3 px-3 text-center">Próximo Contacto</th>
                <th className="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {proyectosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brand-muted font-mono">
                    No se encontraron proyectos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                proyectosFiltrados.map(p => {
                  const sem = getSemaforo(p.fecha_proximo_contacto, p.estado || 'cotizado');
                  const waLink = buildWhatsAppUrl(p);

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-brand-text">
                        <div>{p.cliente || 'Sin nombre'}</div>
                        {p.cedula && <div className="text-[10.5px] font-mono text-brand-muted">CC: {p.cedula}</div>}
                      </td>
                      <td className="py-3 px-3 text-brand-muted">
                        <div>{p.telefono || '—'}</div>
                        <div className="text-[10.5px]">{p.ubicacion || '—'}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-brand-blue">
                        {p.kit_recomendado || 'Personalizado'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-brand-text">
                        ${fmt(p.precio_final)} COP
                      </td>
                      <td className="py-3 px-3 text-center">
                        <select
                          value={p.estado || 'cotizado'}
                          onChange={e => handleUpdateFollowup(p.id, { estado: e.target.value })}
                          className="text-xs font-semibold bg-white border border-border rounded px-2 py-1 cursor-pointer focus:outline-none"
                        >
                          {ESTADOS_PIPELINE.map(st => (
                            <option key={st.id} value={st.id}>{st.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${sem.clase}`}>
                          {p.fecha_proximo_contacto || 'Sin fecha'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded font-semibold inline-block"
                          >
                            WhatsApp
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onLoadProject(p)}
                          className="text-xs bg-brand-blue hover:bg-brand-blue-dark text-white px-2.5 py-1 rounded font-semibold cursor-pointer"
                        >
                          Abrir
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProject(p.id)}
                          className="text-xs text-brand-danger hover:bg-red-50 px-2 py-1 rounded cursor-pointer"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
