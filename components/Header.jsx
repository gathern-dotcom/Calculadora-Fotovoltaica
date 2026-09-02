'use client';

export default function Header({ projectMeta, setProjectMeta }) {
  const handleChange = (field, value) => {
    setProjectMeta(prev => ({ ...prev, [field]: value }));
  };

  return (
    <header className="border-b border-border bg-white px-6 py-4 flex flex-wrap items-baseline justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Intenta cargar el archivo de logo si está en public/, o muestra el emblema limpio */}
        <img
          src="/logo-sinergy.webp"
          alt="Sinergy Soluciones Integrales"
          className="h-10 w-auto block object-contain"
          onError={e => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextElementSibling) {
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }
          }}
        />
        <div style={{ display: 'none' }} className="items-center gap-2">
          <div className="h-9 w-9 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold text-base shadow-xs">
            ☀
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <h1 className="text-[19px] font-semibold text-brand-text tracking-wide m-0">
            ☀ Dimensionador FV
          </h1>
          <span className="text-[12px] text-brand-muted font-mono tracking-wider uppercase">
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
