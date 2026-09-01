'use client';

export default function ParametrosTab({
  projectInstallParams,
  setProjectInstallParams,
  businessParams,
  setBusinessParams,
  onResetDefaults
}) {
  const handleProjectChange = (field, value) => {
    setProjectInstallParams(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleBusinessChange = (field, value) => {
    setBusinessParams(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="max-w-[1360px] mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-brand-blue">
            ⚙ Parámetros de Instalación, Costos y Tarifas Base
          </h2>
          <p className="text-xs text-brand-muted">
            Configura los parámetros logísticos específicos del proyecto y las tarifas base corporativas para calcular costos y márgenes de rentabilidad.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetDefaults}
          className="text-xs font-semibold text-brand-muted hover:text-brand-blue border border-border px-3 py-1.5 rounded-lg bg-white"
        >
          Restablecer Tarifas por Defecto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PARÁMETROS DEL PROYECTO */}
        <section className="bg-brand-panel border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs uppercase font-bold text-brand-muted tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-brand-blue rounded-xs inline-block"></span>
              Variables Logísticas del Proyecto Actual
            </h3>
            <p className="text-[11px] text-brand-muted mt-1">
              Modifica estos valores según la distancia y dificultad del proyecto en cotización.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Personal de instalación (técnicos):
                <span className="block text-[10px] text-brand-muted font-normal">Cantidad en campo</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={projectInstallParams.personas}
                onChange={e => handleProjectChange('personas', e.target.value)}
                className="bg-white border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Duración de la instalación (días):
                <span className="block text-[10px] text-brand-muted font-normal">Días hábiles de trabajo</span>
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={projectInstallParams.dias}
                onChange={e => handleProjectChange('dias', e.target.value)}
                className="bg-white border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Distancia ida y vuelta (km):
                <span className="block text-[10px] text-brand-muted font-normal">Kilometraje total ruta</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={projectInstallParams.km}
                onChange={e => handleProjectChange('km', e.target.value)}
                className="bg-white border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Viático diario por persona ($):
                <span className="block text-[10px] text-brand-muted font-normal">Alimentación / hotel</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={projectInstallParams.viatico}
                onChange={e => handleProjectChange('viatico', e.target.value)}
                className="bg-white border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Complejidad de instalación:
                <span className="block text-[10px] text-brand-muted font-normal">Sobrecosto técnico</span>
              </label>
              <select
                value={projectInstallParams.complejidad}
                onChange={e => handleProjectChange('complejidad', e.target.value)}
                className="bg-white border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-blue font-mono"
              >
                <option value="0">0% — Instalación estándar</option>
                <option value="0.10">10% — Techo inclinado / acceso medio</option>
                <option value="0.20">20% — Altura elevada / alta dificultad</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Comisión especial / imprevistos ($):
                <span className="block text-[10px] text-brand-muted font-normal">Gasto fijo adicional</span>
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={projectInstallParams.comision}
                onChange={e => handleProjectChange('comision', e.target.value)}
                className="bg-white border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>
        </section>

        {/* PARÁMETROS DE NEGOCIO */}
        <section className="bg-white border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs uppercase font-bold text-brand-muted tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-brand-orange rounded-xs inline-block"></span>
              Tarifas Corporativas y Márgenes de Rentabilidad
            </h3>
            <p className="text-[11px] text-brand-muted mt-1">
              Valores estándar de la empresa para costeo y semáforo de margen comercial.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Costo mano de obra ($/persona-día):
              </label>
              <input
                type="number"
                step="100"
                value={businessParams.costoManoObraDia}
                onChange={e => handleBusinessChange('costoManoObraDia', e.target.value)}
                className="bg-brand-panel border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Costo transporte ($/km):
              </label>
              <input
                type="number"
                step="10"
                value={businessParams.costoKm}
                onChange={e => handleBusinessChange('costoKm', e.target.value)}
                className="bg-brand-panel border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Contingencia de instalación (%):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={businessParams.contingenciaPct}
                onChange={e => handleBusinessChange('contingenciaPct', e.target.value)}
                className="bg-brand-panel border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Coordinación y garantía (%):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={businessParams.coordinacionPct}
                onChange={e => handleBusinessChange('coordinacionPct', e.target.value)}
                className="bg-brand-panel border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Tarifa mínima de instalación ($):
              </label>
              <input
                type="number"
                step="50000"
                value={businessParams.tarifaMinima}
                onChange={e => handleBusinessChange('tarifaMinima', e.target.value)}
                className="bg-brand-panel border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Margen objetivo instalación (%):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={businessParams.margenInstalacionPct}
                onChange={e => handleBusinessChange('margenInstalacionPct', e.target.value)}
                className="bg-brand-panel border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Margen mínimo aceptable total (%):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={businessParams.margenMinimoTotalPct}
                onChange={e => handleBusinessChange('margenMinimoTotalPct', e.target.value)}
                className="bg-brand-panel border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="font-semibold text-brand-text">
                Margen objetivo total (%):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={businessParams.margenObjetivoTotalPct}
                onChange={e => handleBusinessChange('margenObjetivoTotalPct', e.target.value)}
                className="bg-brand-panel border border-border rounded-lg px-3 py-1.5 font-mono text-right text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
