import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST() {
  try {
    const hoyStr = new Date().toISOString().split('T')[0];

    // Consultar proyectos con fecha <= hoy y que no estén cerrados
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

    return NextResponse.json({
      message: `Se identificaron ${pendientes.length} cliente(s) pendientes de seguimiento para hoy.`,
      count: pendientes.length
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
