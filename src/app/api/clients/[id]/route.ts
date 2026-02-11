import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        employees:employees(id, first_name, last_name, email, status,
          role:roles(id, name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!client) {
      return Response.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: client });
  } catch (error) {
    console.error('Client GET error:', error);
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
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.contact_person !== undefined) updateData.contact_person = body.contact_person?.trim() || null;
    if (body.billing_address !== undefined) updateData.billing_address = body.billing_address?.trim() || null;
    if (body.status !== undefined) updateData.status = body.status;

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!client) {
      return Response.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: client });
  } catch (error) {
    console.error('Client PUT error:', error);
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
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update({ status: 'inactive' })
      .eq('id', id)
      .select('id, name')
      .single();

    if (error) throw error;
    if (!client) {
      return Response.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: `Client ${client.name} has been deactivated`
    });
  } catch (error) {
    console.error('Client DELETE error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
