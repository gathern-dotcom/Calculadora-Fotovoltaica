'use client';

import { useState } from 'react';

export default function Header({ projectMeta, setProjectMeta }) {
  const [logoError, setLogoError] = useState(false);

  const handleChange = (field, value) => {
    setProjectMeta(prev => ({ ...prev, [field]: value }));
  };

  return (
    <header className="border-b border-border bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Si existe /logo-sinergy.webp lo muestra; si no, muestra el logo vectorial Sinergy con Century Gothic */}
        {!logoError ? (
          <img
            src="/logo-sinergy.webp"
            alt="Sinergy Soluciones Integrales"
            className="h-10 w-auto block object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-xs">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" fill="#FFE600" stroke="#FF8000" />
                <line x1="12" y1="1" x2="12" y2="3" stroke="#FF8000" />
                <line x1="12" y1="21" x2="12" y2="23" stroke="#FF8000" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#FF8000" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#FF8000" />
                <line x1="1" y1="12" x2="3" y2="12" stroke="#FF8000" />
                <line x1="21" y1="12" x2="23" y2="12" stroke="#FF8000" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#FF8000" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#FF8000" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-bold text-brand-blue tracking-tight leading-none font-sans">
                SINERGY
              </span>
              <span className="text-[9.5px] tracking-widest text-brand-muted font-bold uppercase mt-0.5 font-sans">
                SOLUCIONES INTEGRALES
              </span>
            </div>
          </div>
        )}

        <div className="flex items-baseline gap-2 pl-3 border-l border-border">
          <h1 className="text-[19px] font-semibold text-brand-text tracking-wide m-0 font-sans">
            ☀ Dimensionador FV
          </h1>
          <span className="text-[11px] text-brand-muted font-mono tracking-wider uppercase">
            SISTEMA AISLADO / OFF-GRID
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Nombre del cliente…"
          value={projectMeta.cliente}
          onChange={e => handleChange('cliente', e.target.value)}
          className="bg-transparent border-0 border-b border-dashed border-border px-1 py-1 text-sm font-mono text-brand-text focus:outline-none focus:border-brand-blue min-w-[170px]"
        />
        <input
          type="text"
          placeholder="Teléfono…"
          value={projectMeta.telefono}
          onChange={e => handleChange('telefono', e.target.value)}
          className="bg-transparent border-0 border-b border-dashed border-border px-1 py-1 text-sm font-mono text-brand-text focus:outline-none focus:border-brand-blue min-w-[120px]"
        />
        <input
          type="text"
          placeholder="Cédula…"
          value={projectMeta.cedula}
          onChange={e => handleChange('cedula', e.target.value)}
          className="bg-transparent border-0 border-b border-dashed border-border px-1 py-1 text-sm font-mono text-brand-text focus:outline-none focus:border-brand-blue min-w-[120px]"
        />
        <input
          type="text"
          placeholder="NIU / Código…"
          value={projectMeta.niu}
          onChange={e => handleChange('niu', e.target.value)}
          className="bg-transparent border-0 border-b border-dashed border-border px-1 py-1 text-sm font-mono text-brand-text focus:outline-none focus:border-brand-blue min-w-[130px]"
        />
        <input
          type="text"
          placeholder="Ubicación…"
          value={projectMeta.ubicacion}
          onChange={e => handleChange('ubicacion', e.target.value)}
          className="bg-transparent border-0 border-b border-dashed border-border px-1 py-1 text-sm font-mono text-brand-text focus:outline-none focus:border-brand-blue min-w-[150px]"
        />
      </div>
    </header>
  );
}
