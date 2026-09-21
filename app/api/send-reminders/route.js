import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST() {
  try {
    const hoyStr = new Date().toISOString().split('T')[0];

    // 1. Consultar proyectos con fecha <= hoy y no cerrados
    const { data: pendientes, error } = await supabase
      .from('proyectos')
      .select('*')
      .lte('fecha_proximo_contacto', hoyStr)
      .not('estado', 'in', '("ganado","perdido")')
      .order('fecha_proximo_contacto', { ascending: true });

    if (error) throw error;

    if (!pendientes || pendientes.length === 0) {
      return NextResponse.json({
        message: 'No tienes clientes pendientes de seguimiento para hoy.',
        count: 0
      });
    }

    // 2. Armar lista HTML del correo
    const rowsHtml = pendientes
      .map(p => {
        const cleanPhone = (p.telefono || '').replace(/\D/g, '');
        const waLink = cleanPhone ? `https://wa.me/57${cleanPhone}` : '#';
        const esVencido = p.fecha_proximo_contacto < hoyStr;

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 8px; font-weight: bold; color: #1e293b;">${p.cliente || 'Sin nombre'}</td>
            <td style="padding: 10px 8px; color: #0040cc; font-weight: bold;">${p.kit_recomendado || 'Personalizado'}</td>
            <td style="padding: 10px 8px; font-family: monospace;">$${Number(p.precio_final || 0).toLocaleString('es-CO')} COP</td>
            <td style="padding: 10px 8px; color: ${esVencido ? '#b91c1c' : '#b45309'}; font-weight: bold;">
              ${esVencido ? '🔴 Vencido' : '🟡 Hoy'} (${p.fecha_proximo_contacto})
            </td>
            <td style="padding: 10px 8px; text-align: center;">
              <a href="${waLink}" style="background-color: #16a34a; color: #ffffff; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block;">
                WhatsApp
              </a>
            </td>
          </tr>
        `;
      })
      .join('');

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; color: #334155;">
        <div style="background-color: #0040cc; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 18px;">🔔 Sinergy Soluciones Integrales — Seguimiento de Clientes</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Tienes ${pendientes.length} cliente(s) pendientes de contacto para hoy.</p>
        </div>
        <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 8px; text-align: left;">Cliente</th>
                <th style="padding: 8px; text-align: left;">Kit</th>
                <th style="padding: 8px; text-align: left;">Valor</th>
                <th style="padding: 8px; text-align: left;">Prioridad</th>
                <th style="padding: 8px; text-align: center;">Acción</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 3. Enviar correo usando el SMTP configurado en .env.local
    const destino = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"Sinergy CRM" <${process.env.SMTP_USER}>`,
        to: destino,
        subject: `🔔 Recordatorio Sinergy: ${pendientes.length} cliente(s) pendientes de seguimiento hoy`,
        html: emailHtml
      });
    }

    return NextResponse.json({
      message: `Se enviaron recordatorios de ${pendientes.length} cliente(s) a ${destino || 'tu correo'}.`,
      count: pendientes.length
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
