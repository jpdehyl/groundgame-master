import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select(`
        *,
        client:clients(name),
        role:roles(name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to match the frontend expectations
    const transformedEmployees = employees?.map(emp => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      email: emp.email,
      phone: emp.phone || 'Not provided',
      role: emp.role?.name || 'Not assigned',
      client: emp.client?.name || 'Not assigned',
      status: emp.status,
      startDate: emp.start_date,
      documentsStatus: 'Complete' // This would come from a documents relationship
    })) || [];

    return Response.json({
      success: true,
      data: transformedEmployees
    });

  } catch (error) {
    console.error('Employees API error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}