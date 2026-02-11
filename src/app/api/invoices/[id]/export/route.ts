import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { NextRequest } from 'next/server';

/**
 * GET /api/invoices/[id]/export
 * Generates a QuickBooks-compatible CSV for a client invoice.
 *
 * QuickBooks CSV columns:
 *   Invoice No, Customer, Invoice Date, Due Date, Item, Description, Quantity, Rate, Amount
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

    const { data: invoice, error: invErr } = await supabase
      .from('client_invoices')
      .select(`
        *,
        client:clients(name, email),
        pay_period:pay_periods(period_start, period_end)
      `)
      .eq('id', id)
      .single();
    if (invErr) throw invErr;
    if (!invoice) {
      return Response.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const { data: lineItems, error: itemsErr } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at');
    if (itemsErr) throw itemsErr;

    if (!lineItems || lineItems.length === 0) {
      return Response.json({ success: false, error: 'No line items found' }, { status: 400 });
    }

    const client = Array.isArray(invoice.client) ? invoice.client[0] : invoice.client;
    const period = Array.isArray(invoice.pay_period) ? invoice.pay_period[0] : invoice.pay_period;

    // Due date = invoice date + 30 days
    const invoiceDate = new Date(invoice.invoice_date);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const csvHeader = 'Invoice No,Customer,Invoice Date,Due Date,Item,Description,Quantity,Rate,Amount';
    const csvRows = lineItems.map(item => {
      return [
        escapeCsv(invoice.invoice_number || ''),
        escapeCsv(client?.name || ''),
        invoice.invoice_date,
        dueDateStr,
        'Contractor Services',
        escapeCsv(item.description || ''),
        Number(item.hours).toFixed(2),
        Number(item.hourly_rate).toFixed(2),
        Number(item.amount).toFixed(2)
      ].join(',');
    });

    const csv = [csvHeader, ...csvRows].join('\n');

    // Log export
    try {
      await supabaseAdmin.from('audit_log').insert({
        action: 'invoice_csv_export',
        table_name: 'client_invoices',
        record_id: id,
        new_values: {
          exported_at: new Date().toISOString(),
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount
        }
      });
    } catch {
      console.warn('Failed to log invoice export');
    }

    const filename = `invoice-${invoice.invoice_number}-${client?.name?.replace(/\s+/g, '-') || 'client'}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });
  } catch (error) {
    console.error('Invoice export error:', error);
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
