import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.hourly_rate !== undefined) updateData.hourly_rate = body.hourly_rate;

    if (Object.keys(updateData).length === 0) {
      return Response.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!role) {
      return Response.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: role });
  } catch (error) {
    console.error('Update role error:', error);
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
  if (!isSupabaseConfigured) {
    return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const { id } = await params;

    // Check if employees are assigned to this role
    const { count, error: countError } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', id)
      .eq('status', 'active');

    if (countError) throw countError;

    if (count && count > 0) {
      return Response.json({
        success: false,
        error: `Cannot delete role: ${count} active employee(s) are assigned to it. Reassign them first.`
      }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete role error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
