import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.hourly_rate !== undefined) updateData.hourly_rate = body.hourly_rate;
    if (body.effective_from !== undefined) updateData.effective_from = body.effective_from;
    if (body.effective_to !== undefined) updateData.effective_to = body.effective_to;

    const { data: pricing, error } = await supabaseAdmin
      .from('client_pricing')
      .update(updateData)
      .eq('id', id)
      .select(`*, role:roles(id, name)`)
      .single();

    if (error) throw error;

    return Response.json({ success: true, data: pricing });
  } catch (error) {
    console.error('Client pricing PUT error:', error);
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
    const { error } = await supabaseAdmin
      .from('client_pricing')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({ success: true, message: 'Pricing entry deleted' });
  } catch (error) {
    console.error('Client pricing DELETE error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
