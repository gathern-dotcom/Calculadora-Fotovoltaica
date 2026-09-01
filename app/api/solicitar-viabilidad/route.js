// =========================================================================
// API ROUTE: /api/solicitar-viabilidad
// Envío de correo de solicitud de viabilidad técnica a ingeniería
// =========================================================================

import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      cliente,
      telefono,
      cedula,
      niu,
      ubicacion,
      emailDestino,
      comentarios,
      kitRecomendado,
      consumoDiarioWh,
      potenciaFvWp,
      numPaneles,
      numBaterias,
      inversorW,
      precioTotal,
      equipos
    } = body;

    const resendApiKey = process.env.RESEND_API_KEY;
    const correoIngenieria =
      emailDestino || process.env.CORREO_INGENIERIA || 'ingenieria@sinergysoluciones.com';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0040CC; color: #fff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">☀ Solicitud de Viabilidad Técnica</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Sinergy Soluciones Integrales — Sistema Off-Grid</p>
        </div>
        
        <div style="padding: 20px;">
          <h3 style="color: #0040CC; border-bottom: 2px solid #f0f0f0; padding-bottom: 6px; margin-top: 0;">1. Datos del Cliente</h3>
          <p style="margin: 4px 0;"><strong>Cliente:</strong> ${cliente || 'No especificado'}</p>
          <p style="margin: 4px 0;"><strong>Teléfono:</strong> ${telefono || 'No especificado'}</p>
          <p style="margin: 4px 0;"><strong>Cédula:</strong> ${cedula || 'No especificado'}</p>
          <p style="margin: 4px 0;"><strong>NIU / Código:</strong> ${niu || 'No especificado'}</p>
          <p style="margin: 4px 0;"><strong>Ubicación:</strong> ${ubicacion || 'No especificado'}</p>

          <h3 style="color: #0040CC; border-bottom: 2px solid #f0f0f0; padding-bottom: 6px; margin-top: 20px;">2. Resumen Técnico Propuesto</h3>
          <ul style="padding-left: 20px; margin: 10px 0;">
            <li><strong>Propuesta de Catálogo:</strong> ${kitRecomendado || 'Cotización a la medida'}</li>
            <li><strong>Consumo diario:</strong> ${(Number(consumoDiarioWh) / 1000).toFixed(2)} kWh/día</li>
            <li><strong>Potencia Solar FV:</strong> ${potenciaFvWp} Wp (${numPaneles} paneles)</li>
            <li><strong>Banco de Baterías:</strong> ${numBaterias} unidades</li>
            <li><strong>Inversor:</strong> ${inversorW} W nominal</li>
            <li><strong>Precio Total Estimado:</strong> $${Number(precioTotal || 0).toLocaleString('es-CO')} COP</li>
          </ul>

          ${
            comentarios
              ? `<div style="background: #f9f9f9; border-left: 4px solid #FF8000; padding: 10px 14px; margin: 15px 0;">
                  <strong>Notas/Observaciones del Asesor:</strong><br>${comentarios}
                 </div>`
              : ''
          }

          <h3 style="color: #0040CC; border-bottom: 2px solid #f0f0f0; padding-bottom: 6px; margin-top: 20px;">3. Cargas Eléctricas Levantadas</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px;">
            <thead>
              <tr style="background: #f0f4fc; text-align: left;">
                <th style="padding: 6px; border: 1px solid #ddd;">Equipo</th>
                <th style="padding: 6px; border: 1px solid #ddd;">Potencia (W)</th>
                <th style="padding: 6px; border: 1px solid #ddd;">Cant.</th>
                <th style="padding: 6px; border: 1px solid #ddd;">Horas/día</th>
              </tr>
            </thead>
            <tbody>
              ${
                Array.isArray(equipos) && equipos.length > 0
                  ? equipos
                      .map(
                        eq => `
                    <tr>
                      <td style="padding: 6px; border: 1px solid #ddd;">${eq.equipo || eq.name}</td>
                      <td style="padding: 6px; border: 1px solid #ddd;">${eq.potencia_w || eq.power} W</td>
                      <td style="padding: 6px; border: 1px solid #ddd;">${eq.cantidad || eq.qty}</td>
                      <td style="padding: 6px; border: 1px solid #ddd;">${eq.horas_dia || eq.hours} h</td>
                    </tr>
                  `
                      )
                      .join('')
                  : '<tr><td colspan="4" style="padding: 6px; text-align: center;">Sin desglose de equipos</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div style="background: #f5f5f5; color: #777; text-align: center; padding: 12px; font-size: 11px;">
          Mensaje generado automáticamente por el Dimensionador FV de Sinergy Soluciones Integrales.
        </div>
      </div>
    `;

    if (resendApiKey) {
      const res = await fetch('[https://api.resend.com/emails](https://api.resend.com/emails)', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'Dimensionador Sinergy <onboarding@resend.dev>',
          to: [correoIngenieria],
          subject: `☀ Solicitud de Viabilidad: ${cliente || 'Nuevo Proyecto'} (${ubicacion || 'Sin ubicación'})`,
          html: htmlContent
        })
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error('Resend Error: ' + err);
      }

      return NextResponse.json({
        success: true,
        message: `Solicitud enviada exitosamente a ${correoIngenieria}`
      });
    }

    return NextResponse.json({
      success: true,
      simulado: true,
      message:
        'Solicitud procesada correctamente (configura RESEND_API_KEY en Vercel para envío de correos directo).'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al enviar la solicitud: ' + error.message },
      { status: 500 }
    );
  }
}
