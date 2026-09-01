'use client';

export default function TabsNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dimensionador', label: '1. Dimensionador Técnico' },
    { id: 'parametros', label: '2. Parámetros de Instalación y Precios' },
    { id: 'proyectos', label: '3. Base de Datos / Proyectos' },
    { id: 'inventario', label: '4. Control de Inventario y Stock' }
  ];

  return (
    <div className="border-b border-border bg-brand-panel px-6 sticky top-0 z-20 shadow-xs">
      <div className="max-w-[1360px] mx-auto flex gap-2 overflow-x-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-brand-blue text-brand-blue bg-white'
                  : 'border-transparent text-brand-muted hover:text-brand-text'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
