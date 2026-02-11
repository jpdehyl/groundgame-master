import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: { payPeriods: [], currentPeriod: null, stats: { totalEmployees: 0, totalHours: 0, basePay: 0, bonuses: 0 } } });
  }

  try {
    // Get pay periods
    const { data: payPeriods, error: ppError } = await supabase
      .from('pay_periods')
      .select('*')
      .order('period_start', { ascending: false })
      .limit(10);

    if (ppError) {
      console.error('Payroll API - pay_periods error:', ppError);
      return Response.json({ success: true, data: { payPeriods: [], currentPeriod: null, stats: { totalEmployees: 0, totalHours: 0, basePay: 0, bonuses: 0 } }, dbError: ppError.message });
    }

    // Get active employees count
    const { count: employeeCount } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get payroll runs with amounts
    const { data: payrollRuns } = await supabase
      .from('payroll_runs')
      .select('*')
      .order('run_date', { ascending: false })
      .limit(10);

    // Compute current period (most recent open one)
    const currentPeriod = (payPeriods ?? []).find(p => p.status === 'open') || null;

    // Enrich pay periods with payroll run data
    const enrichedPeriods = (payPeriods ?? []).map(pp => {
      const run = (payrollRuns ?? []).find(r => r.pay_period_id === pp.id);
      return {
        id: pp.id,
        period: `${new Date(pp.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(pp.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        status: run?.status === 'sent' ? 'Completed' : pp.status === 'open' ? 'Processing' : 'Completed',
        employees: run?.employee_count ?? employeeCount ?? 0,
        totalAmount: run?.total_amount ? `$${Number(run.total_amount).toLocaleString()}` : '$0',
        dueDate: pp.period_end,
        processed: pp.status === 'processed' || pp.status === 'closed'
      };
    });

    return Response.json({
      success: true,
      data: {
        payPeriods: enrichedPeriods,
        currentPeriod,
        stats: {
          totalEmployees: employeeCount ?? 0,
          totalHours: 0,
          basePay: 0,
          bonuses: 0
        }
      }
    });

  } catch (error) {
    console.error('Payroll API error:', error);
    return Response.json({
      success: true,
      data: { payPeriods: [], currentPeriod: null, stats: { totalEmployees: 0, totalHours: 0, basePay: 0, bonuses: 0 } },
      dbError: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
