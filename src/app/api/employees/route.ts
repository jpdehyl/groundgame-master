import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email', 'start_date', 'client_id', 'role_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return Response.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Check for email uniqueness
    const { data: existingEmployee, error: checkError } = await supabase
      .from('employees')
      .select('id')
      .eq('email', body.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingEmployee) {
      return Response.json({
        success: false,
        error: 'An employee with this email already exists'
      }, { status: 400 });
    }

    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .insert(body)
      .select(`
        *,
        client:clients(name),
        role:roles(name)
      `)
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Create employee error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}