import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employee_id');

    let query = supabase
      .from('time_off')
      .select(`
        *,
        employee:employees(id, first_name, last_name, email,
          client:clients(id, name)
        )
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (employeeId) query = query.eq('employee_id', employeeId);

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('Time-off GET error:', error);
    return Response.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.employee_id || !body.leave_type || !body.start_date || !body.end_date) {
      return Response.json({
        success: false,
        error: 'employee_id, leave_type, start_date, and end_date are required'
      }, { status: 400 });
    }

    const start = new Date(body.start_date);
    const end = new Date(body.end_date);
    if (end < start) {
      return Response.json({ success: false, error: 'end_date must be on or after start_date' }, { status: 400 });
    }

    // Calculate business days
    const daysCount = body.days_count || calculateBusinessDays(start, end);

    const { data, error } = await supabaseAdmin
      .from('time_off')
      .insert({
        employee_id: body.employee_id,
        leave_type: body.leave_type,
        start_date: body.start_date,
        end_date: body.end_date,
        days_count: daysCount,
        reason: body.reason || null,
        status: 'pending'
      })
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .single();
    if (error) throw error;

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Time-off POST error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculateBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}
