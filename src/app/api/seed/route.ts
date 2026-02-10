import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    // Seed Clients
    const clientsData = [
      {
        name: 'AppFolio',
        email: 'contact@appfolio.com',
        contact_person: 'Sarah Johnson',
        billing_address: '50 Castilian Dr, Santa Barbara, CA 93117',
        status: 'active'
      },
      {
        name: 'RentSpree',
        email: 'partnerships@rentspree.com',
        contact_person: 'Mike Chen',
        billing_address: '1875 Century Park E, Los Angeles, CA 90067',
        status: 'active'
      },
      {
        name: 'PropertyRadar',
        email: 'info@propertyradar.com',
        contact_person: 'Lisa Rodriguez',
        billing_address: '548 Market St, San Francisco, CA 94104',
        status: 'active'
      }
    ];

    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert(clientsData)
      .select();

    if (clientError) throw clientError;

    // Seed Roles
    const rolesData = [
      {
        name: 'AppFolio SDR',
        description: 'Sales Development Representative for AppFolio',
        hourly_rate: 25.00
      },
      {
        name: 'Lead Generation Specialist',
        description: 'Generates leads for multiple clients',
        hourly_rate: 20.00
      },
      {
        name: 'Data Entry Specialist',
        description: 'Data entry and administrative tasks',
        hourly_rate: 18.00
      },
      {
        name: 'Account Manager',
        description: 'Manages client relationships and campaigns',
        hourly_rate: 35.00
      }
    ];

    const { data: roles, error: roleError } = await supabaseAdmin
      .from('roles')
      .insert(rolesData)
      .select();

    if (roleError) throw roleError;

    // Seed Employees
    const employeesData = [
      {
        first_name: 'Maria',
        last_name: 'Rodriguez',
        email: 'maria.rodriguez@example.com',
        phone: '+1-555-123-4567',
        client_id: clients?.find(c => c.name === 'AppFolio')?.id,
        role_id: roles?.find(r => r.name === 'AppFolio SDR')?.id,
        employment_type: 'contractor',
        start_date: '2024-01-15',
        salary_compensation: 25.00,
        pay_frequency: 'biweekly',
        status: 'active'
      },
      {
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-987-6543',
        client_id: clients?.find(c => c.name === 'RentSpree')?.id,
        role_id: roles?.find(r => r.name === 'Lead Generation Specialist')?.id,
        employment_type: 'contractor',
        start_date: '2024-02-01',
        salary_compensation: 20.00,
        pay_frequency: 'biweekly',
        status: 'active'
      },
      {
        first_name: 'Ana',
        last_name: 'Garcia',
        email: 'ana.garcia@example.com',
        phone: '+1-555-456-7890',
        client_id: clients?.find(c => c.name === 'PropertyRadar')?.id,
        role_id: roles?.find(r => r.name === 'Data Entry Specialist')?.id,
        employment_type: 'contractor',
        start_date: '2024-01-10',
        salary_compensation: 18.00,
        pay_frequency: 'biweekly',
        status: 'active'
      }
    ];

    const { data: employees, error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert(employeesData)
      .select();

    if (employeeError) throw employeeError;

    return Response.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        clients: clients?.length || 0,
        roles: roles?.length || 0,
        employees: employees?.length || 0
      }
    });

  } catch (error) {
    console.error('Seeding error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}