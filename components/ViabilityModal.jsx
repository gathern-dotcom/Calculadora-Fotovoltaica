'use client';

import { useState } from 'react';
import { fmt } from '../lib/solar-engine';

export default function ViabilityModal({ isOpen, onClose, projectData }) {
  const [emailDestino, setEmailDestino] = useState('ingenieria@sinergysoluciones.com');
  const [comentarios, setComentarios] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  if (!isOpen) return null;

  const {
    cliente,
    telefono,
    cedula,
    niu,
    ubicacion,
    calculo,
    kitResult,
    projectTotals,
    appliances
  } = projectData;

  const handleSendViability = async e => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const payload = {
        cliente,
        telefono,
        cedula,
        niu,
        ubicacion,
        emailDestino,
        comentarios,
        kitRecomendado: kitResult?.kit ? `${kitResult.kit.id} — ${kitResult.kit.nombre}` : null,
        consumoDiarioWh: calculo?.dailyWh || 0,
        potenciaFvWp: calculo?.fvPowerNeeded || 0,
        numPaneles: calculo?.numPaneles || 0,
        numBaterias: calculo?.numBatteries || 0,
        inversorW: calculo?.inverterW || 0,
        precioTotal: projectTotals?.precioVentaTotal || 0,
        equipos: appliances
      };

      const res = await fetch('/api/solicitar-viabilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar la solicitud.');

      setStatus({
        type: 'success',
        message: data.message || '✓ Solicitud de viabilidad enviada a ingeniería exitosamente.'
      });
    } catch (err) {
      setStatus({
        type: 'danger',
        message: 'Error: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <h3 className="text-base font-bold text-brand-blue">
            ✉ Solicitar Viabilidad Técnica por Correo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted hover:text-brand-danger text-xl font-bold px-2"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSendViability} className="space-y-4 text-xs">
          <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 text-brand-text">
            <span className="font-bold text-brand-blue block mb-1">Resumen del Proyecto:</span>
            <p className="m-0">
              <strong>Cliente:</strong> {cliente || 'Sin nombre'} ({ubicacion || 'Sin ubicación'})<br />
              <strong>Sistema:</strong> {kitResult?.kit ? kitResult.kit.nombre : 'Sistema Optimizado'}<br />
              <strong>Capacidad:</strong> {calculo?.numPaneles} paneles ({fmt(calculo?.fvPowerNeeded)} Wp) · {calculo?.numBatteries} bat. · Inversor {calculo?.inverterW}W<br />
              <strong>Inversión Total:</strong> ${fmt(projectTotals?.precioVentaTotal || 0)} COP
            </p>
          </div>

          <div>
            <label className="block font-semibold text-brand-text mb-1">
              Correo del Área de Ingeniería / Evaluador:
            </label>
            <input
              type="email"
              required
              value={emailDestino}
              onChange={e => setEmailDestino(e.target.value)}
              className="w-full bg-brand-panel border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-text mb-1">
              Observaciones adicionales / Condiciones del sitio:
            </label>
            <textarea
              rows="3"
              placeholder="Ej: Techo de teja de barro a 6 metros de altura, distancia de acometida a baterías de 15 metros, disponibilidad de red eléctrica cercana..."
              value={comentarios}
              onChange={e => setComentarios(e.target.value)}
              className="w-full bg-brand-panel border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-blue resize-vertical"
            />
          </div>

          {status && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold ${
                status.type === 'success'
                  ? 'bg-green-50 text-brand-success border border-green-200'
                  : 'bg-red-50 text-brand-danger border border-red-200'
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-brand-muted hover:text-brand-text"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-2"
            >
              {loading ? 'Enviando correo…' : '✉ Enviar a Ingeniería'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
