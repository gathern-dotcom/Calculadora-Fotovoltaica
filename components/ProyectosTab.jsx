'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fmt } from '../lib/solar-engine';

export default function ProyectosTab({ onLoadProjectToDimensioner, setActiveTab }) {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKit, setFilterKit] = useState('ALL');
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchProyectos = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const { data, error } = await supabase
        .from('proyectos')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(100);

      if (error) throw error;
      setProyectos(data || []);
    } catch (err) {
      console.error('Error cargando proyectos:', err);
      setStatusMsg({
        type: 'danger',
        message: 'No se pudieron cargar los proyectos de Supabase: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProyectos();
  }, []);

  const handleDelete = async (id, cliente) => {
    if (!confirm(`¿Estás seguro de eliminar la cotización de "${cliente || 'este cliente'}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
      if (error) throw error;
      setProyectos(prev => prev.filter(p => p.id !== id));
      setStatusMsg({ type: 'success', message: '✓ Proyecto eliminado correctamente.' });
    } catch (err) {
      setStatusMsg({ type: 'danger', message: 'Error al eliminar: ' + err.message });
    }
  };

  const handleExportCSV = () => {
    if (!proyectos.length) return;
    const headers = [
      'ID',
      'Fecha',
      'Cliente',
      'Telefono',
      'Cedula',
      'NIU',
      'Ubicacion',
      'Kit_Recomendado',
      'Consumo_kWh_dia',
      'Potencia_FV_Wp',
      'Num_Paneles',
      'Num_Baterias',
      'Inversor_W',
      'Precio_Equipos',
      'Precio_Final_Total'
    ];

    const rows = filteredProyectos.map(p => [
      p.id,
      p.creado_en,
      `"${p.cliente || ''}"`,
      `"${p.telefono || ''}"`,
      `"${p.cedula || ''}"`,
      `"${p.niu || ''}"`,
      `"${p.ubicacion || ''}"`,
      `"${p.kit_recomendado || ''}"`,
      p.resultados?.consumo_diario_wh ? (p.resultados.consumo_diario_wh / 1000).toFixed(2) : '',
      p.resultados?.potencia_fv_wp || '',
      p.resultados?.num_paneles || '',
      p.resultados?.num_baterias || '',
      p.resultados?.inversor_w || '',
      p.precio_final || '',
      p.resultados?.precio_total_proyecto || p.precio_final || ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `proyectos-sinergy-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredProyectos = proyectos.filter(p => {
    const matchSearch =
      (p.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cedula || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.niu || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.ubicacion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.telefono || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchKit =
      filterKit === 'ALL' ||
      (filterKit === 'OPT' && !p.kit_recomendado) ||
      (p.kit_recomendado || '').includes(filterKit);

    return matchSearch && matchKit;
  });

  const totalValorCotizado = filteredProyectos.reduce((sum, p) => {
    return sum + (Number(p.resultados?.precio_total_proyecto || p.precio_final) || 0);
  }, 0);

  return (
    <div className="max-w-[1360px] mx-auto p-4 sm:p-6 space-y-6">
      {/* Header y Estadísticas */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-brand-blue">
            📁 Base de Datos de Proyectos y Cotizaciones
          </h2>
          <p className="text-xs text-brand-muted">
            Consulta, busca y reabre los proyectos fotovoltaicos guardados en Supabase Postgres en tiempo real.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchProyectos}
            className="text-xs font-semibold text-brand-blue bg-white border border-brand-blue hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
          >
            🔄 Actualizar / Ping BD
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!filteredProyectos.length}
            className="text-xs font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark px-3 py-1.5 rounded-lg transition-all"
          >
            📊 Exportar a Excel (CSV)
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-brand-panel border border-border rounded-xl p-4">
          <span className="text-[10px] font-bold text-brand-muted uppercase">Proyectos Registrados</span>
          <span className="text-2xl font-bold font-mono text-brand-blue block mt-1">{filteredProyectos.length}</span>
        </div>
        <div className="bg-brand-panel border border-border rounded-xl p-4">
          <span className="text-[10px] font-bold text-brand-muted uppercase">Monto Total Cotizado</span>
          <span className="text-2xl font-bold font-mono text-brand-text block mt-1">${fmt(totalValorCotizado)} <span className="text-xs font-normal">COP</span></span>
        </div>
        <div className="bg-brand-panel border border-border rounded-xl p-4">
          <span className="text-[10px] font-bold text-brand-muted uppercase">Estado Conexión Supabase</span>
          <span className="text-sm font-bold font-mono text-brand-success block mt-1.5">● Conectado (PostgreSQL Activo)</span>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-white border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Buscar por cliente, cédula, NIU, teléfono o municipio…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-brand-panel border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-brand-muted">Filtrar Kit:</label>
          <select
            value={filterKit}
            onChange={e => setFilterKit(e.target.value)}
            className="bg-brand-panel border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-blue"
          >
            <option value="ALL">Todos los sistemas</option>
            <option value="K1">K1 — Hogar Mínimo</option>
            <option value="K2">K2 — Hogar Mínimo +</option>
            <option value="K3">K3 — Hogar Básico</option>
            <option value="K4">K4 — Hogar Básico +</option>
            <option value="K5">K5 — Hogar Básico2</option>
            <option value="K6">K6 — Hogar Max</option>
            <option value="K7">K7 — Hogar Full</option>
            <option value="K8">K8 — Hogar Full 2</option>
            <option value="K9">K9 — Hogar Full +</option>
            <option value="K10">K10 — Hogar Full + VE</option>
          </select>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold ${
            statusMsg.type === 'success'
              ? 'bg-green-50 text-brand-success border border-green-200'
              : 'bg-red-50 text-brand-danger border border-red-200'
          }`}
        >
          {statusMsg.message}
        </div>
      )}

      {/* Tabla de Proyectos */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-brand-muted font-mono">
            Cargando proyectos desde Supabase…
          </div>
        ) : filteredProyectos.length === 0 ? (
          <div className="p-8 text-center text-xs text-brand-muted">
            No se encontraron proyectos guardados con los criterios de búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-panel border-b border-border text-[10px] uppercase text-brand-muted font-mono">
                  <th className="py-3 px-4">Cliente / Ubicación</th>
                  <th className="py-3 px-3">Contacto / Doc</th>
                  <th className="py-3 px-3">Dimensionamiento</th>
                  <th className="py-3 px-3">Solución Propuesta</th>
                  <th className="py-3 px-3 text-right">Inversión Total</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProyectos.map(p => {
                  const fecha = p.creado_en
                    ? new Date(p.creado_en).toLocaleString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '—';

                  const precioVenta = p.resultados?.precio_total_proyecto || p.precio_final || 0;
                  const consumo = p.resultados?.consumo_diario_wh
                    ? `${(p.resultados.consumo_diario_wh / 1000).toFixed(1)} kWh/d`
                    : '—';

                  return (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-brand-blue block text-xs">{p.cliente || 'Sin nombre'}</span>
                        <span className="text-[11px] text-brand-muted block">{p.ubicacion || 'Sin ubicación'}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div>{p.telefono || '—'}</div>
                        <div className="text-brand-muted text-[10px]">{p.cedula ? `C.C: ${p.cedula}` : ''} {p.niu ? `· NIU: ${p.niu}` : ''}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div>{consumo} · {p.resultados?.potencia_fv_wp || 0} Wp</div>
                        <div className="text-brand-muted text-[10px]">{p.resultados?.num_paneles || 0} pan. · {p.resultados?.num_baterias || 0} bat. · Inv. {p.resultados?.inversor_w || 0}W</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-semibold text-brand-orange block">
                          {p.kit_recomendado || 'Sistema Optimizado'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-xs text-brand-text">
                        ${fmt(precioVenta)}
                      </td>
                      <td className="py-3 px-3 text-[10px] font-mono text-brand-muted whitespace-nowrap">
                        {fecha}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onLoadProjectToDimensioner(p);
                              setActiveTab('dimensionador');
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-brand-blue text-[11px] font-semibold px-2 py-1 rounded transition-all"
                            title="Cargar datos de este proyecto en el dimensionador"
                          >
                            Cargar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.cliente)}
                            className="text-brand-danger hover:bg-red-50 text-[11px] font-semibold px-2 py-1 rounded transition-all"
                            title="Eliminar proyecto"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
