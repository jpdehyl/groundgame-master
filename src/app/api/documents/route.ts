import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET() {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: [] });
  }

  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Documents API error:', error);
      return Response.json({ success: true, data: [], dbError: error.message });
    }

    const enriched = (documents ?? []).map(doc => {
      const now = new Date();
      const expiryDate = doc.expiry_date ? new Date(doc.expiry_date) : null;
      const isExpiring = expiryDate
        ? expiryDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000 && expiryDate > now
        : false;
      const isExpired = expiryDate ? expiryDate < now : false;

      return {
        id: doc.id,
        employee_id: doc.employee_id,
        employee: doc.employee
          ? `${doc.employee.first_name} ${doc.employee.last_name}`
          : 'Unknown',
        type: doc.document_type === 'w8ben' ? 'W-8BEN' : doc.document_type === 'contract' ? 'Contract' : 'Other',
        document_type: doc.document_type,
        file_name: doc.file_name,
        status: isExpired ? 'Expired' : isExpiring ? 'Expiring' : doc.status === 'active' ? 'Active' : doc.status,
        uploadDate: doc.upload_date,
        expiryDate: doc.expiry_date,
        isExpiring,
        google_drive_url: doc.google_drive_url
      };
    });

    return Response.json({ success: true, data: enriched });

  } catch (error) {
    console.error('Documents API error:', error);
    return Response.json({ success: true, data: [], dbError: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();

    if (!body.employee_id || !body.document_type || !body.file_name) {
      return Response.json({ success: false, error: 'employee_id, document_type, and file_name are required' }, { status: 400 });
    }

    const insertData: Record<string, unknown> = {
      employee_id: body.employee_id,
      document_type: body.document_type,
      file_name: body.file_name,
      google_drive_id: body.google_drive_id || null,
      google_drive_url: body.google_drive_url || null,
      status: 'active'
    };

    // Auto-set expiry for W-8BEN (3 years)
    if (body.document_type === 'w8ben') {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 3);
      insertData.expiry_date = body.expiry_date || expiry.toISOString().split('T')[0];
    } else if (body.expiry_date) {
      insertData.expiry_date = body.expiry_date;
    }

    const { data: doc, error } = await supabaseAdmin
      .from('documents')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, data: doc });

  } catch (error) {
    console.error('Create document error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
