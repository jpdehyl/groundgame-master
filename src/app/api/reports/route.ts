import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: null });
  }

  try {
    const [
      employeesResult,
      clientsResult,
      runsResult,
      timeOffResult,
      workEntriesResult,
    ] = await Promise.all([
      supabase.from('employees').select('id, status, salary_compensation, client_id, role_id, created_at'),
      supabase.from('clients').select('id, name, status'),
      supabase.from('payroll_runs')
        .select('id, total_amount, employee_count, status, run_date, pay_period:pay_periods(period_start, period_end)')
        .order('run_date', { ascending: false })
        .limit(50),
      supabase.from('time_off')
        .select('id, leave_type, days_count, status, employee_id')
        .eq('status', 'approved'),
      supabase.from('work_entries')
        .select('id, hours_worked, leads_processed, spifs, employee_id')
        .limit(1000),
    ]);

    const employees = employeesResult.data ?? [];
    const clients = clientsResult.data ?? [];
    const runs = runsResult.data ?? [];
    const timeOffs = timeOffResult.data ?? [];
    const workEntries = workEntriesResult.data ?? [];

    const activeEmployees = employees.filter(e => e.status === 'active');
    const totalPayroll = runs.filter(r => r.status === 'sent').reduce((s, r) => s + (r.total_amount || 0), 0);

    // Revenue estimate: sum of all payroll runs (what we bill clients is typically higher)
    const totalBilled = runs.reduce((s, r) => s + (r.total_amount || 0), 0);

    // Employee costs = total payroll sent
    const employeeCosts = totalPayroll;

    // Profit margin
    const profitMargin = totalBilled > 0 ? Math.round(((totalBilled - employeeCosts) / totalBilled) * 100) : 0;

    // Avg per employee
    const avgPerEmployee = activeEmployees.length > 0
      ? Math.round(totalBilled / activeEmployees.length)
      : 0;

    // Total hours & leads
    const totalHours = workEntries.reduce((s, e) => s + (Number(e.hours_worked) || 0), 0);
    const totalLeads = workEntries.reduce((s, e) => s + (e.leads_processed || 0), 0);

    // Time off summary
    const totalTimeOffDays = timeOffs.reduce((s, t) => s + Number(t.days_count), 0);
    const timeOffByType = {
      pto: timeOffs.filter(t => t.leave_type === 'pto').reduce((s, t) => s + Number(t.days_count), 0),
      sick: timeOffs.filter(t => t.leave_type === 'sick').reduce((s, t) => s + Number(t.days_count), 0),
      unpaid: timeOffs.filter(t => t.leave_type === 'unpaid').reduce((s, t) => s + Number(t.days_count), 0),
    };

    // Employees per client
    const employeesByClient: Record<string, number> = {};
    for (const emp of activeEmployees) {
      if (emp.client_id) {
        employeesByClient[emp.client_id] = (employeesByClient[emp.client_id] || 0) + 1;
      }
    }

    const clientBreakdown = clients
      .filter(c => c.status === 'active')
      .map(c => ({
        name: c.name,
        employees: employeesByClient[c.id] || 0,
      }))
      .sort((a, b) => b.employees - a.employees);

    // Payroll history for chart
    const payrollHistory = runs
      .filter(r => r.status === 'sent')
      .slice(0, 12)
      .reverse()
      .map(r => {
        const pp = Array.isArray(r.pay_period) ? r.pay_period[0] : r.pay_period;
        return {
          date: r.run_date,
          amount: r.total_amount || 0,
          employees: r.employee_count || 0,
          label: pp ? `${new Date(pp.period_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : r.run_date,
        };
      });

    return Response.json({
      success: true,
      data: {
        totalBilled,
        employeeCosts,
        profitMargin,
        avgPerEmployee,
        totalHours: Math.round(totalHours),
        totalLeads,
        totalTimeOffDays,
        timeOffByType,
        activeEmployeeCount: activeEmployees.length,
        activeClientCount: clients.filter(c => c.status === 'active').length,
        clientBreakdown,
        payrollHistory,
        totalRuns: runs.length,
        sentRuns: runs.filter(r => r.status === 'sent').length,
      }
    });

  } catch (error) {
    console.error('Reports error:', error);
    return Response.json({ success: true, data: null });
  }
}
