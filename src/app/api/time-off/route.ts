import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET() {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: [] });
  }

  try {
    const { data: timeOff, error } = await supabase
      .from('time_off')
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Time-off API error:', error);
      return Response.json({ success: true, data: [], dbError: error.message });
    }

    const enriched = (timeOff ?? []).map(req => ({
      id: req.id,
      employee_id: req.employee_id,
      employee: req.employee
        ? `${req.employee.first_name} ${req.employee.last_name}`
        : 'Unknown',
      type: req.leave_type === 'pto' ? 'Vacation' : req.leave_type === 'sick' ? 'Sick Leave' : 'Personal',
      leave_type: req.leave_type,
      startDate: req.start_date,
      endDate: req.end_date,
      days: req.days_count,
      status: req.status.charAt(0).toUpperCase() + req.status.slice(1),
      reason: req.reason || '',
      requestDate: req.created_at
    }));

    return Response.json({ success: true, data: enriched });

  } catch (error) {
    console.error('Time-off API error:', error);
    return Response.json({ success: true, data: [], dbError: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();

    if (!body.employee_id || !body.leave_type || !body.start_date || !body.end_date) {
      return Response.json({ success: false, error: 'employee_id, leave_type, start_date, and end_date are required' }, { status: 400 });
    }

    // Calculate days
    const start = new Date(body.start_date);
    const end = new Date(body.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const { data: timeOff, error } = await supabaseAdmin
      .from('time_off')
      .insert({
        employee_id: body.employee_id,
        leave_type: body.leave_type,
        start_date: body.start_date,
        end_date: body.end_date,
        days_count: body.days_count || daysCount,
        status: 'pending',
        reason: body.reason || null
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, data: timeOff });

  } catch (error) {
    console.error('Create time-off error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();

    if (!body.id || !body.status) {
      return Response.json({ success: false, error: 'id and status are required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status: body.status };
    if (body.status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    }

    const { data: timeOff, error } = await supabaseAdmin
      .from('time_off')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, data: timeOff });

  } catch (error) {
    console.error('Update time-off error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
