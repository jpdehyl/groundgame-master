import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: null });
  }

  try {
    const { id } = await params;
    const { data: employee, error } = await supabase
      .from('employees')
      .select(`
        *,
        client:clients(id, name),
        role:roles(id, name, hourly_rate)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!employee) {
      return Response.json({
        success: false,
        error: 'Employee not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Get employee error:', error);
    return Response.json({ success: true, data: null });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Remove read-only fields
    delete body.id;
    delete body.created_at;
    delete body.updated_at;
    delete body.client;
    delete body.role;

    // Check if email is being changed and if it conflicts
    if (body.email) {
      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('id')
        .eq('email', body.email)
        .neq('id', id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingEmployee) {
        return Response.json({
          success: false,
          error: 'Another employee with this email already exists'
        }, { status: 400 });
      }
    }

    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name),
        role:roles(id, name, hourly_rate)
      `)
      .single();

    if (error) throw error;

    if (!employee) {
      return Response.json({
        success: false,
        error: 'Employee not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Update employee error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Soft delete - set status to inactive instead of actual deletion
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, first_name, last_name')
      .single();

    if (error) throw error;

    if (!employee) {
      return Response.json({
        success: false,
        error: 'Employee not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: `Employee ${employee.first_name} ${employee.last_name} has been deactivated`,
      data: { id: employee.id }
    });

  } catch (error) {
    console.error('Delete employee error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}