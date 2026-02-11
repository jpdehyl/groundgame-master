import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

/**
 * GET /api/payroll/[id]/export
 *
 * Generates a Veem-compatible CSV for a payroll run.
 * The run must be in 'processed' or 'sent' status.
 *
 * Veem CSV columns:
 *   Recipient Email, Recipient First Name, Recipient Last Name, Amount, Currency, Purpose of Payment, Note
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured) {
    return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const { id } = await params;

    // Get the payroll run
    const { data: run, error: runError } = await supabase
      .from('payroll_runs')
      .select(`
        *,
        pay_period:pay_periods(period_start, period_end)
      `)
      .eq('id', id)
      .single();

    if (runError) throw runError;
    if (!run) {
      return Response.json({ success: false, error: 'Payroll run not found' }, { status: 404 });
    }

    if (run.status === 'draft') {
      return Response.json({
        success: false,
        error: 'Payroll run must be processed before exporting. Current status: draft'
      }, { status: 400 });
    }

    // Get entries with employee details
    const { data: entries, error: entriesError } = await supabase
      .from('payroll_entries')
      .select(`
        *,
        employee:employees(first_name, last_name, email)
      `)
      .eq('payroll_run_id', id)
      .order('created_at', { ascending: true });

    if (entriesError) throw entriesError;

    if (!entries || entries.length === 0) {
      return Response.json({
        success: false,
        error: 'No payroll entries found for this run'
      }, { status: 400 });
    }

    // Build the pay period label for notes
    const payPeriod = Array.isArray(run.pay_period) ? run.pay_period[0] : run.pay_period;
    const periodLabel = payPeriod
      ? `${payPeriod.period_start} to ${payPeriod.period_end}`
      : 'Unknown period';

    // Generate CSV
    const csvHeader = 'Recipient Email,Recipient First Name,Recipient Last Name,Amount,Currency,Purpose of Payment,Note';

    const csvRows = entries.map(entry => {
      const emp = Array.isArray(entry.employee) ? entry.employee[0] : entry.employee;
      const firstName = escapeCsv(emp?.first_name ?? '');
      const lastName = escapeCsv(emp?.last_name ?? '');
      const email = escapeCsv(emp?.email ?? '');
      const amount = Number(entry.net_pay).toFixed(2);
      const purpose = 'Contractor Payment';
      const note = escapeCsv(`Pay period: ${periodLabel}`);

      return `${email},${firstName},${lastName},${amount},USD,${purpose},${note}`;
    });

    const csv = [csvHeader, ...csvRows].join('\n');

    // Log the export in audit_log
    try {
      await supabaseAdmin
        .from('audit_log')
        .insert({
          action: 'payroll_csv_export',
          table_name: 'payroll_runs',
          record_id: id,
          new_values: {
            exported_at: new Date().toISOString(),
            entry_count: entries.length,
            total_amount: run.total_amount
          }
        });
    } catch {
      // Don't fail the export if audit logging fails
      console.warn('Failed to log payroll export to audit_log');
    }

    // Update status to 'sent' if currently 'processed'
    if (run.status === 'processed') {
      await supabaseAdmin
        .from('payroll_runs')
        .update({ status: 'sent' })
        .eq('id', id);

      // Also mark pay period as processed
      if (payPeriod) {
        await supabaseAdmin
          .from('pay_periods')
          .update({ status: 'processed' })
          .eq('id', run.pay_period_id);
      }
    }

    // Return CSV file
    const filename = `payroll-veem-${run.run_date}-${id.slice(0, 8)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });

  } catch (error) {
    console.error('Payroll export error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
