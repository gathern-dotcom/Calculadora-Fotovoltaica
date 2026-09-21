// =========================================================================
// GENERADOR DINÁMICO DE FICHA COMERCIAL EN IMAGEN PNG (CLIENT-SIDE CANVAS)
// =========================================================================
import { WHATSAPP_COMERCIAL_DISPLAY } from './constants';
export function downloadCommercialCardPNG(projectMeta, calculo, kitResult, siteParams) {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  const W = 1080;
  const H = 1440;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Fondo blanco limpio
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Barra superior naranja
  ctx.fillStyle = '#FF7A00';
  ctx.fillRect(0, 0, W, 8);

  // 1. CABECERA: SINERGY | SOLUCIONES INTEGRALES (Separado)
  ctx.fillStyle = '#0040CC';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('SINERGY', 70, 72);

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(260, 44);
  ctx.lineTo(260, 84);
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('SOLUCIONES INTEGRALES', 280, 65);

  ctx.fillStyle = '#64748B';
  ctx.font = '14px sans-serif';
  ctx.fillText('Ingeniería Solar Fotovoltaica Especializada', 280, 86);

  // Badge Propuesta
  ctx.fillStyle = '#F0F5FF';
  ctx.strokeStyle = '#D6E4FF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(W - 270, 48, 200, 36, 8) : ctx.rect(W - 270, 48, 200, 36);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0040CC';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('PROPUESTA TÉCNICA', W - 250, 71);

  // Línea divisoria
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(70, 115);
  ctx.lineTo(W - 70, 115);
  ctx.stroke();

  // 2. DATOS DEL CLIENTE
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(70, 140, W - 140, 125, 14) : ctx.rect(70, 140, W - 140, 125);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('CLIENTE PREPARADO PARA:', 95, 170);

  const clientName = projectMeta?.cliente ? projectMeta.cliente : 'Estimado Cliente';
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(clientName, 95, 202);

  const ubicacion = projectMeta?.ubicacion ? projectMeta.ubicacion : 'Colombia';
  ctx.fillStyle = '#64748B';
  ctx.font = '16px sans-serif';
  ctx.fillText('📍 Ubicación: ' + ubicacion, 95, 236);

  const tel = projectMeta?.telefono ? projectMeta.telefono : '';
  if (tel) {
    ctx.fillText('📱 Contacto: ' + tel, 600, 236);
  }

  // 3. TARJETA DEL KIT SOLAR
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(70, 290, W - 140, 640, 16) : ctx.rect(70, 290, W - 140, 640);
  ctx.fill();
  ctx.stroke();

  // Cabecera interna del Kit
  ctx.fillStyle = '#F0F5FF';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(72, 292, W - 144, 90, [15, 15, 0, 0]) : ctx.rect(72, 292, W - 144, 90);
  ctx.fill();

  const kitName = kitResult?.kit ? (kitResult.kit.id + ' — ' + kitResult.kit.nombre) : 'Sistema a la Medida';
  ctx.fillStyle = '#0040CC';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('SISTEMA SELECCIONADO', 100, 320);

  ctx.fillStyle = '#091528';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(kitName, 100, 355);

  const invKw = calculo?.inverterW ? (calculo.inverterW / 1000) : 5;
  ctx.fillStyle = '#0040CC';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('⚡ ' + invKw + ' kW (120/240V)', W - 320, 355);

  // Equipos y Especificaciones
  const numPan = calculo?.numPaneles || (kitResult?.kit?.paneles || 6);
  const pW = siteParams?.panelW || (kitResult?.kit?.panelW || 625);
  const numBat = calculo?.numBatteries || (kitResult?.kit?.bateriaCant || 1);
  const bankKwh = calculo?.bankKwh ? calculo.bankKwh.toFixed(1) : (kitResult?.kit?.totalBateriaKwh || 11.0);

  const specs = [
    ['Paneles Solares:', numPan + ' Módulos Luxen Monocristalinos ' + pW + 'W', (numPan * pW).toLocaleString('es-CO') + ' Wp de potencia instalada'],
    ['Inversor Solar:', '1 Inversor Solar ' + invKw + ' kW / ' + (calculo?.voltage || 48) + 'V', 'Salida Split Phase 120/240V'],
    ['Banco de Litio:', numBat + ' Batería(s) Litio LFP (' + bankKwh + ' kWh total)', 'Respaldo continuo noche y emergencias'],
    ['Protecciones DC:', '1 Combiner Box DC con fusibles y DPS', 'Protección contra sobretensiones y descargas'],
    ['Estructura Techo:', Math.ceil(numPan / 2) + ' Kits de montaje en aluminio anodizado', 'Resistente a vientos e intemperie'],
    ['Cableado Solar:', (numPan * 6 + 20) + ' Metros cable fotovoltaico 6mm certificado TÜV', 'Doble aislamiento libre de halógenos'],
    ['Garantías Oficiales:', 'Paneles 12 años (25 prod.) · Inversor y Batería 5 años', 'Soporte técnico directo Sinergy']
  ];

  let yLine = 425;
  specs.forEach(([label, mainSpec, subSpec]) => {
    ctx.fillStyle = '#FF7A00';
    ctx.beginPath();
    ctx.arc(106, yLine + 12, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(label, 125, yLine + 18);

    ctx.fillStyle = '#334155';
    ctx.font = '18px sans-serif';
    ctx.fillText(mainSpec, 360, yLine + 18);

    ctx.fillStyle = '#64748B';
    ctx.font = '14px sans-serif';
    ctx.fillText(subSpec, 360, yLine + 40);

    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, yLine + 56);
    ctx.lineTo(W - 100, yLine + 56);
    ctx.stroke();

    yLine += 68;
  });

  // 4. PRECIO NORMAL ÚNICO (DESTACADO EN AZUL OSCURO)
  ctx.fillStyle = '#091528';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(70, 960, W - 140, 260, 18) : ctx.rect(70, 960, W - 140, 260);
  ctx.fill();

  ctx.fillStyle = '#FF7A00';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(105, 990, 240, 35, 6) : ctx.rect(105, 990, 240, 35);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('VALOR DE LA INVERSIÓN', 125, 1013);

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('PRECIO NORMAL (LLAVE EN MANO)', 105, 1060);

  // Precio Normal Oficial
  const precioNormal = kitResult?.pricing?.precioCredito || kitResult?.pricing?.precioFinal || 24520020;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 50px sans-serif';
  ctx.fillText('$' + Number(precioNormal).toLocaleString('es-CO') + ' COP', 105, 1120);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '15px sans-serif';
  ctx.fillText('• Incluye equipos completos de ingeniería, protecciones y acompañamiento técnico Sinergy.', 105, 1180);

  // 5. FOOTER
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, 1260);
  ctx.lineTo(W - 70, 1260);
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('SINERGY SOLUCIONES INTEGRALES S.A.S.', 70, 1295);

  ctx.fillStyle = '#64748B';
  ctx.font = '14px sans-serif';
  ctx.fillText('Proyectos Solares Aislados y Conectados a Red · Colombia', 70, 1322);

  ctx.fillStyle = '#0040CC';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`💬 WhatsApp: ${WHATSAPP_COMERCIAL_DISPLAY}`, W - 440, 1295);

  ctx.fillStyle = '#64748B';
  ctx.font = '14px sans-serif';
  ctx.fillText('📍 Sede Regional: Pitalito, Huila', W - 440, 1322);

  // DISPARAR DESCARGA AUTOMÁTICA DEL PNG
  const safeClient = (projectMeta?.cliente || 'Cliente').replace(/\s+/g, '_');
  const safeKit = (kitResult?.kit?.id || 'Solar');
  const link = document.createElement('a');
  link.download = 'Ficha_Comercial_' + safeClient + '_' + safeKit + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
