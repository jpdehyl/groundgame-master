import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const emptyStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  totalClients: 0,
  activeClients: 0,
  monthlyPayroll: 0,
  pendingDocuments: 0,
  recentActivities: [] as Array<{ id: number; type: string; description: string; time: string; user: string }>,
  dbConnected: false,
  dbError: null as string | null
};

export async function GET() {
  if (!isSupabaseConfigured) {
    return Response.json({
      success: true,
      data: { ...emptyStats, dbError: 'Database not configured. Add Supabase environment variables in Vercel.' }
    });
  }

  try {
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, status, salary_compensation');

    if (employeesError) {
      console.error('Dashboard stats - employees query failed:', employeesError);
      return Response.json({
        success: true,
        data: { ...emptyStats, dbError: `DB error: ${employeesError.message}` }
      });
    }

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, status');

    if (clientsError) {
      console.error('Dashboard stats - clients query failed:', clientsError);
    }

    const activeEmployees = (employees ?? []).filter(e => e.status === 'active');
    const monthlyPayroll = activeEmployees.reduce((sum, emp) => {
      return sum + (emp.salary_compensation ?? 0);
    }, 0);

    let pendingDocuments = 0;
    const { count, error: docsError } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active'])
      .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!docsError) {
      pendingDocuments = count ?? 0;
    }

    const { data: recentEmployees } = await supabase
      .from('employees')
      .select('id, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

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

    return Response.json({
      success: true,
      data: {
        totalEmployees: employees?.length ?? 0,
        activeEmployees: activeEmployees.length,
        totalClients: (clients ?? []).length,
        activeClients: (clients ?? []).filter(c => c.status === 'active').length,
        monthlyPayroll,
        pendingDocuments,
        recentActivities,
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
