import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let query = supabase
      .from('payroll_runs')
      .select(`
        *,
        pay_period:pay_periods(id, period_start, period_end, period_type, status)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: runs, error } = await query;

    if (error) {
      console.error('Payroll runs GET error:', error);
      return Response.json({ success: true, data: [] });
    }

    return Response.json({
      success: true,
      data: runs ?? []
    });

  } catch (error) {
    console.error('Payroll runs GET error:', error);
    return Response.json({ success: true, data: [] });
  }
}

/**
 * POST /api/payroll
 * Creates a payroll run for a given pay period and calculates all entries.
 *
 * Body: { pay_period_id: string }
 *
 * Calculation per employee:
 *   base_pay     = SUM(hours_worked) * hourly_rate
 *   leads_bonus  = SUM(leads_processed * per-lead-rate)  [stored as work_entry.spifs for now]
 *   spifs_bonus  = SUM(spifs)
 *   total_gross  = base_pay + leads_bonus + spifs_bonus
 *   net_pay      = total_gross - deductions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.pay_period_id) {
      return Response.json({
        success: false,
        error: 'pay_period_id is required'
      }, { status: 400 });
    }

    // Verify pay period exists and is closed (ready for processing)
    const { data: period, error: periodError } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('id', body.pay_period_id)
      .single();

    if (periodError) throw periodError;
    if (!period) {
      return Response.json({ success: false, error: 'Pay period not found' }, { status: 404 });
    }
    if (period.status !== 'closed') {
      return Response.json({
        success: false,
        error: `Pay period must be closed before processing payroll. Current status: '${period.status}'`
      }, { status: 400 });
    }

    // Check if a payroll run already exists for this period
    const { data: existingRun, error: existingError } = await supabase
      .from('payroll_runs')
      .select('id, status')
      .eq('pay_period_id', body.pay_period_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;

    if (existingRun) {
      return Response.json({
        success: false,
        error: `A payroll run already exists for this period (status: ${existingRun.status}). ID: ${existingRun.id}`
      }, { status: 400 });
    }

    // Get all active employees with their roles
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select(`
        id, first_name, last_name, email,
        salary_compensation,
        role:roles(id, name, hourly_rate),
        client:clients(id, name)
      `)
      .eq('status', 'active');

    if (empError) throw empError;

    // Get all work entries for this period
    const { data: workEntries, error: workError } = await supabase
      .from('work_entries')
      .select('*')
      .eq('pay_period_id', body.pay_period_id);

    if (workError) throw workError;

    // Get approved time off overlapping this period
    const { data: timeOffs, error: toError } = await supabase
      .from('time_off')
      .select('*')
      .eq('status', 'approved')
      .lte('start_date', period.period_end)
      .gte('end_date', period.period_start);

    if (toError) throw toError;

    // Group work entries by employee
    const workByEmployee = new Map<string, { hours: number; leads: number; spifs: number }>();
    for (const entry of workEntries ?? []) {
      const current = workByEmployee.get(entry.employee_id) || { hours: 0, leads: 0, spifs: 0 };
      current.hours += Number(entry.hours_worked) || 0;
      current.leads += entry.leads_processed || 0;
      current.spifs += Number(entry.spifs) || 0;
      workByEmployee.set(entry.employee_id, current);
    }

    // Group unpaid time off by employee (for deduction context)
    const unpaidDaysByEmployee = new Map<string, number>();
    for (const to of timeOffs ?? []) {
      if (to.leave_type === 'unpaid') {
        const current = unpaidDaysByEmployee.get(to.employee_id) || 0;
        unpaidDaysByEmployee.set(to.employee_id, current + Number(to.days_count));
      }
    }

    // Calculate payroll entries
    const payrollEntries = [];
    let totalAmount = 0;

    for (const emp of employees ?? []) {
      const work = workByEmployee.get(emp.id);
      if (!work && !emp.salary_compensation) continue; // no work logged and no salary — skip

      // Determine hourly rate: employee override > role base rate
      const role = Array.isArray(emp.role) ? emp.role[0] : emp.role;
      const hourlyRate = Number(emp.salary_compensation) || Number(role?.hourly_rate) || 0;

      const baseHours = work?.hours ?? 0;
      const basePay = Math.round(baseHours * hourlyRate * 100) / 100;
      const leadsBonus = 0; // leads bonus is tracked via spifs in work entries
      const spifsBonus = Math.round((work?.spifs ?? 0) * 100) / 100;
      const totalGross = Math.round((basePay + leadsBonus + spifsBonus) * 100) / 100;
      const deductions = 0; // no tax withholding for international contractors
      const netPay = Math.round((totalGross - deductions) * 100) / 100;

      if (netPay === 0 && baseHours === 0) continue; // truly nothing to pay

      payrollEntries.push({
        employee_id: emp.id,
        base_hours: baseHours,
        hourly_rate: hourlyRate,
        base_pay: basePay,
        leads_bonus: leadsBonus,
        spifs_bonus: spifsBonus,
        total_gross: totalGross,
        deductions,
        net_pay: netPay
      });

      totalAmount += netPay;
    }

    // Create the payroll run
    const { data: run, error: runError } = await supabaseAdmin
      .from('payroll_runs')
      .insert({
        pay_period_id: body.pay_period_id,
        run_date: new Date().toISOString().split('T')[0],
        total_amount: Math.round(totalAmount * 100) / 100,
        employee_count: payrollEntries.length,
        status: 'draft'
      })
      .select()
      .single();

    if (runError) throw runError;

    // Insert all payroll entries
    if (payrollEntries.length > 0) {
      const entriesWithRunId = payrollEntries.map(entry => ({
        ...entry,
        payroll_run_id: run.id
      }));

      const { error: entriesError } = await supabaseAdmin
        .from('payroll_entries')
        .insert(entriesWithRunId);

      if (entriesError) throw entriesError;
    }

    return Response.json({
      success: true,
      data: {
        ...run,
        entries_count: payrollEntries.length,
        total_amount: Math.round(totalAmount * 100) / 100
      }
    });

  } catch (error) {
    console.error('Payroll run POST error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
