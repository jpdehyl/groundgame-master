import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: null });
  }

  try {
    const { id } = await params;

    const { data: invoice, error: invErr } = await supabase
      .from('client_invoices')
      .select(`
        *,
        client:clients(id, name, email, billing_address),
        pay_period:pay_periods(id, period_start, period_end)
      `)
      .eq('id', id)
      .single();
    if (invErr) throw invErr;
    if (!invoice) {
      return Response.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const { data: lineItems, error: itemsErr } = await supabase
      .from('invoice_line_items')
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .eq('invoice_id', id)
      .order('created_at');
    if (itemsErr) throw itemsErr;

    return Response.json({
      success: true,
      data: { ...invoice, line_items: lineItems ?? [] }
    });
  } catch (error) {
    console.error('Invoice GET error:', error);
    return Response.json({ success: true, data: null });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return Response.json({ success: false, error: 'status is required' }, { status: 400 });
    }

    const validTransitions: Record<string, string[]> = {
      'draft': ['sent'],
      'sent': ['paid'],
      'paid': []
    };

    const { data: current, error: fetchErr } = await supabase
      .from('client_invoices')
      .select('status')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;

    const allowed = validTransitions[current?.status ?? ''] || [];
    if (!allowed.includes(body.status)) {
      return Response.json({
        success: false,
        error: `Cannot transition from '${current?.status}' to '${body.status}'`
      }, { status: 400 });
    }

    const { data: invoice, error } = await supabaseAdmin
      .from('client_invoices')
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    return Response.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Invoice PUT error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
