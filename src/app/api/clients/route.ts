import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id, name, email, contact_person, billing_address, status, created_at,
        employees:employees(id)
      `)
      .eq('status', 'active')
      .order('name');

    if (error) throw error;

    const enriched = (clients ?? []).map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      contact_person: client.contact_person,
      billing_address: client.billing_address,
      status: client.status,
      created_at: client.created_at,
      employee_count: Array.isArray(client.employees) ? client.employees.length : 0,
    }));

    return Response.json({
      success: true,
      data: enriched
    });

  } catch (error) {
    console.error('Clients API error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
