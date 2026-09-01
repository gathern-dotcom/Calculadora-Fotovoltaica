'use client';

import { useRef, useState } from 'react';
import { fmt } from '../lib/solar-engine';

export default function CommercialCardModal({ isOpen, onClose, projectData }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const {
    cliente,
    ubicacion,
    telefono,
    fecha,
    calculo,
    kitResult,
    optimizedResult,
    projectTotals
  } = projectData;

  const handleDownloadImage = async () => {
    try {
      setDownloading(true);
      const html2canvas = (await import('html2canvas')).default;
      if (!cardRef.current) return;

      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#FFFFFF'
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = (cliente || 'cotizacion').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      link.download = `ficha-solar-sinergy-${safeName}.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error('Error al generar la imagen:', err);
      alert('Error al generar la imagen comercial. Por favor intenta de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  const isKit = !!kitResult?.cumple;
  const kit = kitResult?.kit;
  const opt = optimizedResult;

  const totalWp = isKit ? kit?.totalWp : (opt?.totalPanels || 0) * (calculo?.panelW || 625);
  const numPanels = isKit ? kit?.paneles : opt?.totalPanels || 0;
  const panelW = isKit ? kit?.panelW : calculo?.panelW || 625;
  const totalBatKwh = isKit ? kit?.totalBateriaKwh : calculo?.bankKwh || 0;
  const invBrand = isKit ? kit?.inversor : `${opt?.inverter?.brand || 'Sinergy'} ${opt?.totalInverterW || 0}W`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 relative">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <h3 className="text-base font-bold text-brand-blue">
            ✨ Ficha Comercial de Cotización
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted hover:text-brand-danger text-xl font-bold px-2"
          >
            ✕
          </button>
        </div>

        {/* CONTENEDOR DE LA FICHA A EXPORTAR */}
        <div
          ref={cardRef}
          className="bg-gradient-to-b from-[#F7F9FF] to-white border-2 border-brand-blue rounded-xl p-6 text-brand-text shadow-sm"
        >
          {/* Header de la Ficha */}
          <div className="flex items-center justify-between border-b border-blue-100 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold text-lg">
                ☀
              </div>
              <div>
                <h4 className="text-base font-bold text-brand-blue m-0 leading-tight">
                  SINERGY SOLUCIONES INTEGRALES
                </h4>
                <p className="text-[11px] font-mono text-brand-muted m-0">
                  Propuesta de Sistema Solar Fotovoltaico Autónomo (Off-Grid)
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono bg-blue-100 text-brand-blue font-bold px-2 py-0.5 rounded">
                PROPUESTA
              </span>
              <p className="text-[10px] font-mono text-brand-muted mt-1">
                {new Date(fecha || Date.now()).toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="bg-white border border-border rounded-lg p-3 grid grid-cols-2 gap-2 text-xs mb-4">
            <div>
              <span className="text-brand-muted text-[10px] uppercase block font-semibold">Cliente</span>
              <span className="font-bold text-brand-blue">{cliente || 'Cliente Particular'}</span>
            </div>
            <div>
              <span className="text-brand-muted text-[10px] uppercase block font-semibold">Ubicación</span>
              <span className="font-medium">{ubicacion || 'Colombia'}</span>
            </div>
            {telefono && (
              <div>
                <span className="text-brand-muted text-[10px] uppercase block font-semibold">Teléfono</span>
                <span className="font-mono">{telefono}</span>
              </div>
            )}
            <div>
              <span className="text-brand-muted text-[10px] uppercase block font-semibold">Solución</span>
              <span className="font-semibold text-brand-orange">{isKit ? kit?.nombre : 'Sistema Optimizado a la Medida'}</span>
            </div>
          </div>

          {/* Especificaciones del Sistema */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-brand-muted uppercase font-bold block">Generación Solar</span>
              <span className="text-sm font-bold text-brand-blue block mt-0.5">{fmt(totalWp)} Wp</span>
              <span className="text-[10px] text-brand-muted block">{numPanels} paneles de {panelW}W</span>
            </div>
            <div className="bg-orange-50/60 border border-orange-100 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-brand-muted uppercase font-bold block">Almacenamiento LFP</span>
              <span className="text-sm font-bold text-brand-orange block mt-0.5">{fmt(totalBatKwh, 1)} kWh</span>
              <span className="text-[10px] text-brand-muted block">Baterías Litio LiFePO4</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-brand-muted uppercase font-bold block">Potencia Inversor</span>
              <span className="text-sm font-bold text-brand-text block mt-0.5">{fmt(calculo?.inverterW || 0)} W</span>
              <span className="text-[10px] text-brand-muted block">Onda Senoidal Pura</span>
            </div>
          </div>

          {/* Lista de Componentes Incluidos */}
          <div className="bg-white border border-border rounded-lg p-3 mb-4">
            <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider block mb-2">
              ✓ Equipamiento y Alcance Incluido:
            </span>
            <ul className="text-xs space-y-1 text-brand-text">
              <li>• <strong>Generación:</strong> {numPanels} paneles solares monocristalinos de alta eficiencia ({panelW}W).</li>
              <li>• <strong>Inversión:</strong> {invBrand}.</li>
              <li>• <strong>Baterías:</strong> Banco de litio fosfato de hierro (LFP) con alta vida útil (&gt;4.000 ciclos).</li>
              <li>• <strong>Protecciones DC:</strong> Caja combinadora con fusibles, supresores de transitorios y seccionadores.</li>
              <li>• <strong>Estructuras:</strong> Soportes en aluminio anodizado para techo con resistencia a intemperie.</li>
              <li>• <strong>Instalación:</strong> Mano de obra especializada, cableado fotovoltaico y puesta en marcha.</li>
            </ul>
          </div>

          {/* Precio Total y Pie */}
          <div className="bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white rounded-lg p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono opacity-85 block uppercase tracking-wider">Inversión Total Llave en Mano</span>
              <span className="text-2xl font-bold tracking-tight text-white block">
                ${fmt(projectTotals?.precioVentaTotal || 0)} <span className="text-xs font-normal">COP</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-white/20 px-2 py-1 rounded font-mono font-semibold block">
                Garantía Sinergy Directa
              </span>
              <span className="text-[10px] opacity-80 mt-1 block">Equipos + Instalación</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-brand-muted hover:text-brand-text"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={downloading}
            className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-2"
          >
            {downloading ? 'Generando imagen…' : '📥 Descargar Imagen PNG para WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
