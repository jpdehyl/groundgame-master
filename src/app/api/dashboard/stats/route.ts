import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get all employees (active + inactive) for total vs active counts
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, status, salary_compensation');

    if (employeesError) throw employeesError;

    // Get all clients for total vs active counts
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, status');

    if (clientsError) throw clientsError;

    // Calculate monthly payroll from active employees' compensation
    const activeEmployees = (employees ?? []).filter(e => e.status === 'active');
    const monthlyPayroll = activeEmployees.reduce((sum, emp) => {
      return sum + (emp.salary_compensation ?? 0);
    }, 0);

    // Get pending/expiring documents count
    const { count: pendingDocuments, error: docsError } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active'])
      .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

    if (docsError && docsError.code !== 'PGRST116' && docsError.code !== '42P01') {
      // Ignore if documents table doesn't exist yet
      console.warn('Documents query warning:', docsError.message);
    }

    // Get recent employees as activity proxy
    const { data: recentEmployees, error: recentError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    const recentActivities = (recentEmployees ?? []).map((emp, idx) => {
      const createdAt = new Date(emp.created_at);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const timeAgo = diffDays === 0
        ? 'Today'
        : diffDays === 1
        ? '1 day ago'
        : `${diffDays} days ago`;

      return {
        id: idx + 1,
        type: 'employee_added',
        description: `${emp.first_name} ${emp.last_name} onboarded`,
        time: timeAgo,
        user: 'Admin'
      };
    });

    const stats = {
      totalEmployees: employees?.length ?? 0,
      activeEmployees: activeEmployees.length,
      totalClients: clients?.length ?? 0,
      activeClients: (clients ?? []).filter(c => c.status === 'active').length,
      monthlyPayroll,
      pendingDocuments: pendingDocuments ?? 0,
      recentActivities
    };

    return Response.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
