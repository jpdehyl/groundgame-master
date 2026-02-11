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

    // Get the payroll run with its pay period
    const { data: run, error: runError } = await supabase
      .from('payroll_runs')
      .select(`
        *,
        pay_period:pay_periods(id, period_start, period_end, period_type)
      `)
      .eq('id', id)
      .single();

    if (runError) throw runError;
    if (!run) {
      return Response.json({ success: false, error: 'Payroll run not found' }, { status: 404 });
    }

    // Get all payroll entries for this run with employee details
    const { data: entries, error: entriesError } = await supabase
      .from('payroll_entries')
      .select(`
        *,
        employee:employees(id, first_name, last_name, email,
          client:clients(id, name),
          role:roles(id, name)
        )
      `)
      .eq('payroll_run_id', id)
      .order('created_at', { ascending: true });

    if (entriesError) throw entriesError;

    return Response.json({
      success: true,
      data: {
        ...run,
        entries: entries ?? []
      }
    });

  } catch (error) {
    console.error('Payroll run GET error:', error);
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
      'draft': ['processed'],
      'processed': ['sent'],
      'sent': [] // terminal
    };

    const { data: current, error: fetchError } = await supabase
      .from('payroll_runs')
      .select('id, status, pay_period_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!current) {
      return Response.json({ success: false, error: 'Payroll run not found' }, { status: 404 });
    }

    const allowed = validTransitions[current.status] || [];
    if (!allowed.includes(body.status)) {
      return Response.json({
        success: false,
        error: `Cannot transition from '${current.status}' to '${body.status}'. Allowed: ${allowed.join(', ') || 'none'}`
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status: body.status };

    // When marking as sent, also mark the pay period as processed
    if (body.status === 'sent') {
      const { error: periodError } = await supabaseAdmin
        .from('pay_periods')
        .update({ status: 'processed' })
        .eq('id', current.pay_period_id);

      if (periodError) throw periodError;
    }

    const { data: run, error } = await supabaseAdmin
      .from('payroll_runs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        pay_period:pay_periods(id, period_start, period_end, status)
      `)
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data: run
    });

  } catch (error) {
    console.error('Payroll run PUT error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
