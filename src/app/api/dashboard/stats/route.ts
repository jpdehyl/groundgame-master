import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Activity {
  id: number;
  type: string;
  description: string;
  time: string;
  user: string;
}

interface ExpiringDoc {
  id: string;
  file_name: string;
  expiry_date: string;
  days_until: number;
  employee_name: string;
}

interface PayrollAlert {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  days_until_end: number;
  has_run: boolean;
}

const emptyStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  totalClients: 0,
  activeClients: 0,
  monthlyPayroll: 0,
  pendingDocuments: 0,
  recentActivities: [] as Activity[],
  expiringDocuments: [] as ExpiringDoc[],
  payrollAlerts: [] as PayrollAlert[],
  dbConnected: false,
  dbError: null as string | null
};

function formatTimeAgo(dateStr: string): string {
  const created = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function GET() {
  if (!isSupabaseConfigured) {
    return Response.json({
      success: true,
      data: { ...emptyStats, dbError: 'Database not configured. Add Supabase environment variables in Vercel.' }
    });
  }

  try {
    const [
      employeesResult,
      clientsResult,
      docsResult,
      periodsResult,
      runsResult,
      auditResult,
      recentEmployeesResult,
      recentDocsResult,
      timeOffResult
    ] = await Promise.all([
      supabase.from('employees').select('id, status, salary_compensation'),
      supabase.from('clients').select('id, status'),
      supabase.from('documents')
        .select('id, file_name, expiry_date, document_type, status, employee:employees(first_name, last_name)')
        .eq('status', 'active')
        .not('expiry_date', 'is', null)
        .lte('expiry_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })
        .limit(10),
      supabase.from('pay_periods')
        .select('id, period_start, period_end, status')
        .in('status', ['open', 'closed'])
        .order('period_end', { ascending: true })
        .limit(5),
      supabase.from('payroll_runs')
        .select('id, pay_period_id, status, total_amount')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('audit_log')
        .select('id, action, table_name, record_id, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('employees')
        .select('id, first_name, last_name, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('documents')
        .select('id, file_name, document_type, created_at, employee:employees(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('time_off')
        .select('id, status, leave_type, created_at, employee:employees(first_name, last_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const employees = employeesResult.data ?? [];
    const clients = clientsResult.data ?? [];
    const activeEmployees = employees.filter(e => e.status === 'active');
    const monthlyPayroll = activeEmployees.reduce((sum, emp) => sum + (emp.salary_compensation ?? 0), 0);

    // Expiring documents
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiringDocuments: ExpiringDoc[] = (docsResult.data ?? []).map(doc => {
      const expiry = new Date(doc.expiry_date + 'T00:00:00');
      const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const emp = Array.isArray(doc.employee) ? doc.employee[0] : doc.employee;
      return {
        id: doc.id,
        file_name: doc.file_name,
        expiry_date: doc.expiry_date,
        days_until: daysUntil,
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown'
      };
    });

    const pendingDocuments = expiringDocuments.filter(d => d.days_until <= 30).length;

    // Payroll alerts
    const runPeriodIds = new Set((runsResult.data ?? []).map(r => r.pay_period_id));
    const payrollAlerts: PayrollAlert[] = (periodsResult.data ?? []).map(p => {
      const endDate = new Date(p.period_end + 'T00:00:00');
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: p.id,
        period_start: p.period_start,
        period_end: p.period_end,
        status: p.status,
        days_until_end: daysUntilEnd,
        has_run: runPeriodIds.has(p.id)
      };
    });

    // Build recent activities from multiple sources
    const activities: Activity[] = [];
    let activityId = 1;

    for (const emp of recentEmployeesResult.data ?? []) {
      activities.push({
        id: activityId++,
        type: 'employee_added',
        description: `${emp.first_name} ${emp.last_name} ${emp.status === 'active' ? 'onboarded' : 'updated'}`,
        time: formatTimeAgo(emp.created_at),
        user: 'Admin'
      });
    }

    for (const doc of recentDocsResult.data ?? []) {
      const emp = Array.isArray(doc.employee) ? doc.employee[0] : doc.employee;
      activities.push({
        id: activityId++,
        type: 'document_uploaded',
        description: `${doc.document_type === 'w8ben' ? 'W-8BEN' : doc.document_type} uploaded for ${emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown'}`,
        time: formatTimeAgo(doc.created_at),
        user: 'Admin'
      });
    }

    for (const to of timeOffResult.data ?? []) {
      const emp = Array.isArray(to.employee) ? to.employee[0] : to.employee;
      activities.push({
        id: activityId++,
        type: 'time_off_request',
        description: `${emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown'} requested ${to.leave_type} leave`,
        time: formatTimeAgo(to.created_at),
        user: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown'
      });
    }

    for (const log of auditResult.data ?? []) {
      activities.push({
        id: activityId++,
        type: 'audit',
        description: `${log.action} on ${log.table_name}`,
        time: formatTimeAgo(log.created_at),
        user: 'System'
      });
    }

    return Response.json({
      success: true,
      data: {
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'active').length,
        monthlyPayroll,
        pendingDocuments,
        recentActivities: activities.slice(0, 8),
        expiringDocuments,
        payrollAlerts,
        dbConnected: true,
        dbError: null
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return Response.json({
      success: true,
      data: { ...emptyStats, dbError: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
}
