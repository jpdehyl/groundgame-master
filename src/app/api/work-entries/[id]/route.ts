import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify the entry exists and its pay period is still open
    const { data: existing, error: fetchError } = await supabase
      .from('work_entries')
      .select('id, pay_period_id, pay_periods:pay_periods(status)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existing) {
      return Response.json({ success: false, error: 'Work entry not found' }, { status: 404 });
    }

    const periodStatus = Array.isArray(existing.pay_periods)
      ? existing.pay_periods[0]?.status
      : (existing.pay_periods as { status: string } | null)?.status;

    if (periodStatus !== 'open') {
      return Response.json({
        success: false,
        error: 'Can only edit work entries in open pay periods'
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.hours_worked !== undefined) updateData.hours_worked = body.hours_worked;
    if (body.leads_processed !== undefined) updateData.leads_processed = body.leads_processed;
    if (body.spifs !== undefined) updateData.spifs = body.spifs;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: entry, error } = await supabaseAdmin
      .from('work_entries')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data: entry
    });

  } catch (error) {
    console.error('Work entry PUT error:', error);
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

    // Verify the entry exists and its pay period is still open
    const { data: existing, error: fetchError } = await supabase
      .from('work_entries')
      .select('id, pay_period_id, pay_periods:pay_periods(status)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existing) {
      return Response.json({ success: false, error: 'Work entry not found' }, { status: 404 });
    }

    const periodStatus = Array.isArray(existing.pay_periods)
      ? existing.pay_periods[0]?.status
      : (existing.pay_periods as { status: string } | null)?.status;

    if (periodStatus !== 'open') {
      return Response.json({
        success: false,
        error: 'Can only delete work entries in open pay periods'
      }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('work_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({
      success: true,
      message: 'Work entry deleted'
    });

  } catch (error) {
    console.error('Work entry DELETE error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
