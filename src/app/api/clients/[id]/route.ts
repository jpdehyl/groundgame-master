import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const { id } = await params;
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return Response.json({ success: true, data: client });

  } catch (error) {
    console.error('Get client error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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

    delete body.id;
    delete body.created_at;
    delete body.updated_at;
    delete body.employees;

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, data: client });

  } catch (error) {
    console.error('Update client error:', error);
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
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name')
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      message: `Client ${client.name} has been deactivated`,
      data: { id: client.id }
    });

  } catch (error) {
    console.error('Delete client error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
