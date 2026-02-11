import { supabaseAdmin, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Settings are stored as key-value pairs in a simple approach:
// We use a single row in a settings-like approach via the audit_log
// or a dedicated approach. For MVP, we'll use upsert on a virtual "settings" concept
// stored in the existing users table or a simple approach.
//
// Since we don't have a settings table, we'll create entries in a JSON blob.
// For now, use localStorage as a fallback and provide the API for future DB persistence.

const DEFAULT_SETTINGS = {
  companyName: 'GroundGame Master',
  timeZone: 'Pacific Time (PT)',
  currency: 'USD ($)',
  payPeriod: 'Bi-weekly',
  payroll: {
    defaultSpifRate: 0,
    w8benWarningDays: 90,
    overtimeMultiplier: 1.5,
    overtimeThresholdHours: 40,
  },
  notifications: {
    payrollReminders: true,
    documentExpiry: true,
    timeOffRequests: true,
    weeklyReports: false,
  }
};

export async function GET() {
  if (!isSupabaseConfigured) {
    return Response.json({ success: true, data: DEFAULT_SETTINGS });
  }

  try {
    // Try to read settings from a dedicated row in audit_log with action='settings'
    const { data, error } = await supabase
      .from('audit_log')
      .select('after_values')
      .eq('action', 'settings_save')
      .eq('table_name', 'settings')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return Response.json({ success: true, data: DEFAULT_SETTINGS });
    }

    return Response.json({ success: true, data: data.after_values || DEFAULT_SETTINGS });
  } catch {
    return Response.json({ success: true, data: DEFAULT_SETTINGS });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();

    // Store settings as an audit_log entry
    const { error } = await supabaseAdmin
      .from('audit_log')
      .insert({
        action: 'settings_save',
        table_name: 'settings',
        record_id: 'global',
        after_values: body,
        user_id: 'admin'
      });

    if (error) throw error;

    return Response.json({ success: true, data: body });
  } catch (error) {
    console.error('Settings save error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save settings'
    }, { status: 500 });
  }
}
