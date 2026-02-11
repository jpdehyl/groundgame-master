import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const docType = searchParams.get('type');
    const expiringDays = searchParams.get('expiring_within_days');

    let query = supabase
      .from('documents')
      .select(`
        *,
        employee:employees(id, first_name, last_name, email,
          client:clients(id, name)
        )
      `)
      .order('created_at', { ascending: false });

    if (employeeId) query = query.eq('employee_id', employeeId);
    if (docType) query = query.eq('document_type', docType);

    if (expiringDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(expiringDays, 10));
      query = query
        .eq('document_type', 'w8ben')
        .eq('status', 'active')
        .lte('expiry_date', futureDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('Documents GET error:', error);
    return Response.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.employee_id || !body.document_type || !body.file_name) {
      return Response.json({
        success: false,
        error: 'employee_id, document_type, and file_name are required'
      }, { status: 400 });
    }

    // For W-8BEN, auto-set expiry to 3 years from upload
    let expiryDate = body.expiry_date || null;
    if (body.document_type === 'w8ben' && !expiryDate) {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 3);
      expiryDate = expiry.toISOString().split('T')[0];
    }

    // If replacing, mark old docs of same type as replaced
    if (body.document_type !== 'other') {
      await supabaseAdmin
        .from('documents')
        .update({ status: 'replaced' })
        .eq('employee_id', body.employee_id)
        .eq('document_type', body.document_type)
        .eq('status', 'active');
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        employee_id: body.employee_id,
        document_type: body.document_type,
        file_name: body.file_name,
        google_drive_id: body.google_drive_id || null,
        google_drive_url: body.google_drive_url || null,
        expiry_date: expiryDate,
        status: 'active'
      })
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .single();
    if (error) throw error;

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Documents POST error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
