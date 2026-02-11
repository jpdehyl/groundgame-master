import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET() {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: [] });
  }

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

    if (error) {
      console.error('Employees API error:', error);
      return Response.json({ success: true, data: [], dbError: error.message });
    }

    const transformedEmployees = employees?.map(emp => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      email: emp.email,
      phone: emp.phone || 'Not provided',
      role: emp.role?.name || 'Not assigned',
      client: emp.client?.name || 'Not assigned',
      status: emp.status,
      startDate: emp.start_date,
      documentsStatus: 'Complete'
    })) || [];

    return Response.json({
      success: true,
      data: transformedEmployees
    });

  } catch (error) {
    console.error('Employees API error:', error);
    return Response.json({ success: true, data: [], dbError: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();

    const requiredFields = ['first_name', 'last_name', 'email', 'start_date', 'client_id', 'role_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return Response.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

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

    // Clean body - only send fields that exist in the DB schema
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone', 'client_id', 'role_id',
      'employment_type', 'start_date', 'end_date', 'salary_compensation',
      'pay_frequency', 'internet_speed_up', 'internet_speed_down',
      'computer_serial', 'status'
    ];
    const cleanBody: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== '') {
        cleanBody[field] = body[field];
      }
    }

    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .insert(cleanBody)
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