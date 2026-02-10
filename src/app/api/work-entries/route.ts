import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const payPeriodId = searchParams.get('pay_period_id');
    const employeeId = searchParams.get('employee_id');

    if (!payPeriodId) {
      return Response.json({
        success: false,
        error: 'pay_period_id query parameter is required'
      }, { status: 400 });
    }

    let query = supabase
      .from('work_entries')
      .select(`
        *,
        employee:employees(id, first_name, last_name, email)
      `)
      .eq('pay_period_id', payPeriodId)
      .order('work_date', { ascending: true });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data: entries, error } = await query;

    if (error) throw error;

    return Response.json({
      success: true,
      data: entries ?? []
    });

  } catch (error) {
    console.error('Work entries GET error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.employee_id || !body.pay_period_id || !body.work_date) {
      return Response.json({
        success: false,
        error: 'employee_id, pay_period_id, and work_date are required'
      }, { status: 400 });
    }

    // Verify pay period exists and is open
    const { data: period, error: periodError } = await supabase
      .from('pay_periods')
      .select('id, status, period_start, period_end')
      .eq('id', body.pay_period_id)
      .single();

    if (periodError) throw periodError;
    if (!period) {
      return Response.json({ success: false, error: 'Pay period not found' }, { status: 404 });
    }
    if (period.status !== 'open') {
      return Response.json({
        success: false,
        error: 'Can only add work entries to open pay periods'
      }, { status: 400 });
    }

    // Verify work_date falls within the pay period
    const workDate = new Date(body.work_date);
    const periodStart = new Date(period.period_start);
    const periodEnd = new Date(period.period_end);
    if (workDate < periodStart || workDate > periodEnd) {
      return Response.json({
        success: false,
        error: 'work_date must fall within the pay period'
      }, { status: 400 });
    }

    const { data: entry, error } = await supabaseAdmin
      .from('work_entries')
      .upsert({
        employee_id: body.employee_id,
        pay_period_id: body.pay_period_id,
        work_date: body.work_date,
        hours_worked: body.hours_worked ?? 0,
        leads_processed: body.leads_processed ?? 0,
        spifs: body.spifs ?? 0,
        notes: body.notes ?? null
      }, {
        onConflict: 'employee_id,pay_period_id,work_date'
      })
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data: entry
    });

  } catch (error) {
    console.error('Work entries POST error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
