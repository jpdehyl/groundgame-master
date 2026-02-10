import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get total employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, status')
      .eq('status', 'active');

    if (employeesError) throw employeesError;

    // Get total clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, status')
      .eq('status', 'active');

    if (clientsError) throw clientsError;

    // Get recent activity (simplified for now)
    const recentActivities = [
      {
        id: 1,
        type: 'employee_added',
        description: 'New employee onboarded',
        time: '2 hours ago',
        user: 'Admin'
      },
      {
        id: 2,
        type: 'payroll_processed',
        description: 'Bi-weekly payroll processed',
        time: '1 day ago',
        user: 'System'
      }
    ];

    const stats = {
      totalEmployees: employees?.length || 0,
      activeEmployees: employees?.filter(e => e.status === 'active').length || 0,
      totalClients: clients?.length || 0,
      activeClients: clients?.filter(c => c.status === 'active').length || 0,
      monthlyPayroll: 48250, // This would be calculated from actual payroll data
      pendingDocuments: 3, // This would come from documents table
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