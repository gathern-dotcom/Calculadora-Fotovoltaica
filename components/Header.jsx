'use client';

import { SINERGY_LOGO } from '../lib/constants';

export default function Header({ projectMeta, setProjectMeta }) {
  const handleChange = (field, value) => {
    setProjectMeta(prev => ({ ...prev, [field]: value }));
  };

  return (
    <header className="border-b border-border bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <img
          src={SINERGY_LOGO}
          alt="Sinergy Soluciones Integrales"
          className="h-10 w-auto block object-contain"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-brand-blue font-sans">
              ☀ Dimensionador FV
            </h1>
            <span className="text-[11px] font-mono bg-blue-50 text-brand-blue px-2 py-0.5 rounded border border-blue-100 font-semibold">
              SISTEMA AISLADO / OFF-GRID
            </span>
          </div>
          <p className="text-xs text-brand-muted font-mono">Sinergy Soluciones Integrales</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Nombre del cliente…"
          value={projectMeta.cliente}
          onChange={e => handleChange('cliente', e.target.value)}
          className="bg-transparent border-b border-dashed border-border px-2 py-1 text-xs font-mono focus:outline-none focus:border-brand-blue min-w-[170px]"
        />
        <input
          type="text"
          placeholder="Teléfono…"
          value={projectMeta.telefono}
          onChange={e => handleChange('telefono', e.target.value)}
          className="bg-transparent border-b border-dashed border-border px-2 py-1 text-xs font-mono focus:outline-none focus:border-brand-blue min-w-[120px]"
        />
        <input
          type="text"
          placeholder="Cédula…"
          value={projectMeta.cedula}
          onChange={e => handleChange('cedula', e.target.value)}
          className="bg-transparent border-b border-dashed border-border px-2 py-1 text-xs font-mono focus:outline-none focus:border-brand-blue min-w-[120px]"
        />
        <input
          type="text"
          placeholder="NIU / Código…"
          value={projectMeta.niu}
          onChange={e => handleChange('niu', e.target.value)}
          className="bg-transparent border-b border-dashed border-border px-2 py-1 text-xs font-mono focus:outline-none focus:border-brand-blue min-w-[130px]"
        />
        <input
          type="text"
          placeholder="Ubicación / Municipio…"
          value={projectMeta.ubicacion}
          onChange={e => handleChange('ubicacion', e.target.value)}
          className="bg-transparent border-b border-dashed border-border px-2 py-1 text-xs font-mono focus:outline-none focus:border-brand-blue min-w-[160px]"
        />
      </div>
    </header>
  );
}
