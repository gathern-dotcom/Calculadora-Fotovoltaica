'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fmt } from '../lib/solar-engine';

export default function InventarioTab({ currentProjectReqs }) {
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchInventario = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('categoria', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) throw error;
      setInventario(data || []);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      setStatusMsg({
        type: 'danger',
        message: 'No se pudo cargar el inventario: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventario();
  }, []);

  const handleUpdateStock = async (id, newStock) => {
    const stockVal = Math.max(0, parseInt(newStock, 10) || 0);
    try {
      setUpdatingId(id);
      const { error } = await supabase
        .from('inventario')
        .update({ stock_disponible: stockVal })
        .eq('id', id);

      if (error) throw error;

      setInventario(prev =>
        prev.map(item => (item.id === id ? { ...item, stock_disponible: stockVal } : item))
      );
      setStatusMsg({ type: 'success', message: '✓ Stock actualizado en la base de datos.' });
    } catch (err) {
      setStatusMsg({ type: 'danger', message: 'Error actualizando stock: ' + err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStockDelta = (id, currentVal, delta) => {
    handleUpdateStock(id, currentVal + delta);
  };

  const filteredItems = inventario.filter(item => {
    const matchCat = categoriaFiltro === 'ALL' || item.categoria === categoriaFiltro;
    const matchSearch =
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const checkProjectAvailability = () => {
    if (!currentProjectReqs) return null;
    const { numPaneles, panelW, numBaterias, battKwh, inverterW } = currentProjectReqs;

    const panelItem = inventario.find(i => i.categoria === 'panel' && i.nombre.includes(`${panelW}W`));
    const invItem = inventario.find(i => i.categoria === 'inversor' && i.nombre.includes(`${inverterW / 1000}KW` || `${inverterW / 1000}kW`));
    const batItem = inventario.find(i => i.categoria === 'bateria' && i.nombre.includes(`${battKwh} kWh`));

    return {
      paneles: {
        item: panelItem,
        req: numPaneles,
        ok: (panelItem?.stock_disponible || 0) >= numPaneles
      },
      inversor: {
        item: invItem,
        req: 1,
        ok: (invItem?.stock_disponible || 0) >= 1
      },
      baterias: {
        item: batItem,
        req: numBaterias,
        ok: (batItem?.stock_disponible || 0) >= numBaterias
      }
    };
  };

  const availability = checkProjectAvailability();

  return (
    <div className="max-w-[1360px] mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-brand-blue">
            📦 Control de Inventario y Stock en Tiempo Real
          </h2>
          <p className="text-xs text-brand-muted">
            Monitorea el inventario disponible de paneles, inversores, baterías y cajas combinadoras en Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInventario}
          className="text-xs font-semibold text-brand-blue bg-white border border-brand-blue hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
        >
          🔄 Sincronizar Stock
        </button>
      </div>

      {/* Widget de Disponibilidad del Proyecto Actual */}
      {availability && (
        <div className="bg-brand-panel border border-brand-blue/40 rounded-xl p-4 shadow-xs">
          <h3 className="text-xs uppercase font-bold text-brand-blue tracking-wider mb-2 flex items-center gap-2">
            <span>⚡</span> Validación de Stock para el Proyecto Actual en Dimensionador
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className={`p-3 rounded-lg border ${availability.paneles.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <span className="font-bold block">Paneles ({currentProjectReqs?.numPaneles} un. de {currentProjectReqs?.panelW}W)</span>
              <span className={`text-[11px] font-mono block mt-1 ${availability.paneles.ok ? 'text-brand-success font-semibold' : 'text-brand-danger font-semibold'}`}>
                {availability.paneles.ok ? `✓ Stock suficiente (${availability.paneles.item?.stock_disponible || 0} disp.)` : `⚠ Stock insuficiente (${availability.paneles.item?.stock_disponible || 0} disp.)`}
              </span>
            </div>

            <div className={`p-3 rounded-lg border ${availability.baterias.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <span className="font-bold block">Baterías ({currentProjectReqs?.numBaterias} un. de {currentProjectReqs?.battKwh} kWh)</span>
              <span className={`text-[11px] font-mono block mt-1 ${availability.baterias.ok ? 'text-brand-success font-semibold' : 'text-brand-danger font-semibold'}`}>
                {availability.baterias.ok ? `✓ Stock suficiente (${availability.baterias.item?.stock_disponible || 0} disp.)` : `⚠ Stock insuficiente (${availability.baterias.item?.stock_disponible || 0} disp.)`}
              </span>
            </div>

            <div className={`p-3 rounded-lg border ${availability.inversor.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <span className="font-bold block">Inversor ({currentProjectReqs?.inverterW}W)</span>
              <span className={`text-[11px] font-mono block mt-1 ${availability.inversor.ok ? 'text-brand-success font-semibold' : 'text-brand-danger font-semibold'}`}>
                {availability.inversor.ok ? `✓ Stock suficiente (${availability.inversor.item?.stock_disponible || 0} disp.)` : `⚠ Stock insuficiente (${availability.inversor.item?.stock_disponible || 0} disp.)`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Buscador y Filtros */}
      <div className="bg-white border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Buscar por nombre de equipo o código SKU…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-brand-panel border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-brand-muted">Categoría:</label>
          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className="bg-brand-panel border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-blue"
          >
            <option value="ALL">Todas las categorías</option>
            <option value="panel">Paneles Solares</option>
            <option value="inversor">Inversores</option>
            <option value="bateria">Baterías LFP</option>
            <option value="combiner">Cajas Combinadoras</option>
            <option value="soporte">Estructuras</option>
            <option value="cable">Cableado</option>
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

      {/* Tabla de Inventario */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-brand-muted font-mono">
            Cargando inventario de Supabase…
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-brand-muted">
            No hay componentes registrados en esta categoría.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-panel border-b border-border text-[10px] uppercase text-brand-muted font-mono">
                  <th className="py-3 px-4">SKU / Código</th>
                  <th className="py-3 px-4">Componente</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3 text-center">Stock Disponible</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Precio Mayorista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map(item => {
                  const isLow = item.stock_disponible <= item.stock_minimo && item.stock_disponible > 0;
                  const isOut = item.stock_disponible === 0;

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-brand-blue font-bold">
                        {item.sku}
                      </td>
                      <td className="py-3 px-4 font-semibold text-brand-text">
                        {item.nombre}
                      </td>
                      <td className="py-3 px-3 uppercase text-[10px] font-mono text-brand-muted">
                        {item.categoria}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-brand-panel border border-border rounded-lg px-2 py-1">
                          <button
                            type="button"
                            onClick={() => handleStockDelta(item.id, item.stock_disponible, -1)}
                            className="text-brand-muted hover:text-brand-danger font-bold px-1 text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.stock_disponible}
                            onChange={e => handleUpdateStock(item.id, e.target.value)}
                            disabled={updatingId === item.id}
                            className="w-12 text-center bg-white border border-border rounded px-1 text-xs font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleStockDelta(item.id, item.stock_disponible, 1)}
                            className="text-brand-muted hover:text-brand-blue font-bold px-1 text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isOut
                              ? 'bg-red-100 text-brand-danger'
                              : isLow
                              ? 'bg-orange-100 text-brand-orange'
                              : 'bg-green-100 text-brand-success'
                          }`}
                        >
                          {isOut ? '✕ Agotado' : isLow ? '⚠ Stock Bajo' : '✓ En Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        ${fmt(item.precio_unitario)}
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
