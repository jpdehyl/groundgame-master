'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  Download,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Calendar,
  Building2,
  Clock
} from 'lucide-react';

interface ReportData {
  totalBilled: number;
  employeeCosts: number;
  profitMargin: number;
  avgPerEmployee: number;
  totalHours: number;
  totalLeads: number;
  totalTimeOffDays: number;
  timeOffByType: { pto: number; sick: number; unpaid: number };
  activeEmployeeCount: number;
  activeClientCount: number;
  clientBreakdown: Array<{ name: string; employees: number }>;
  payrollHistory: Array<{ date: string; amount: number; employees: number; label: string }>;
  totalRuns: number;
  sentRuns: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function exportReportCsv(data: ReportData) {
  const lines = [
    'GroundGame Master - Report Summary',
    '',
    'Key Metrics',
    `Total Billed,${data.totalBilled}`,
    `Employee Costs,${data.employeeCosts}`,
    `Profit Margin,${data.profitMargin}%`,
    `Avg per Employee,${data.avgPerEmployee}`,
    `Active Employees,${data.activeEmployeeCount}`,
    `Active Clients,${data.activeClientCount}`,
    `Total Hours Logged,${data.totalHours}`,
    `Total Leads,${data.totalLeads}`,
    '',
    'Time Off Summary',
    `PTO Days,${data.timeOffByType.pto}`,
    `Sick Days,${data.timeOffByType.sick}`,
    `Unpaid Days,${data.timeOffByType.unpaid}`,
    '',
    'Client Breakdown',
    'Client,Employees',
    ...data.clientBreakdown.map(c => `${c.name},${c.employees}`),
    '',
    'Payroll History',
    'Period,Amount,Employees',
    ...data.payrollHistory.map(p => `${p.label},${p.amount},${p.employees}`),
  ];
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `groundgame-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/reports');
        const result = await res.json();
        if (result.success) setData(result.data);
      } catch {
        console.error('Failed to fetch reports');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) return <PageSkeleton />;

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-muted-foreground">No data available. Import data to generate reports.</p>
        </div>
      </div>
    );
  }

  const maxBarAmount = Math.max(...data.payrollHistory.map(p => p.amount), 1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-muted-foreground">Real-time business analytics from your data</p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover" onClick={() => exportReportCsv(data)}>
          <Download className="h-4 w-4 mr-2" />
          Export Report CSV
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Billed', value: formatCurrency(data.totalBilled), icon: DollarSign, color: 'text-accent-green' },
          { title: 'Employee Costs', value: formatCurrency(data.employeeCosts), icon: Users, color: 'text-primary' },
          { title: 'Payroll Runs', value: `${data.sentRuns} of ${data.totalRuns}`, icon: FileText, color: 'text-accent-yellow' },
          { title: 'Avg / Employee', value: formatCurrency(data.avgPerEmployee), icon: TrendingUp, color: 'text-accent-green' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-card p-6 rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{stat.title}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </div>
              <stat.icon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      {/* Work Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center mb-3">
            <Clock className="h-5 w-5 text-primary mr-2" />
            <h4 className="font-semibold text-white">Total Hours Logged</h4>
          </div>
          <div className="text-3xl font-bold text-white">{data.totalHours.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {data.activeEmployeeCount > 0 ? `${Math.round(data.totalHours / data.activeEmployeeCount)} avg per employee` : 'No employees'}
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center mb-3">
            <TrendingUp className="h-5 w-5 text-accent-green mr-2" />
            <h4 className="font-semibold text-white">Total Leads</h4>
          </div>
          <div className="text-3xl font-bold text-white">{data.totalLeads.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground mt-1">Across all work entries</div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center mb-3">
            <Calendar className="h-5 w-5 text-accent-yellow mr-2" />
            <h4 className="font-semibold text-white">Time Off (Approved)</h4>
          </div>
          <div className="text-3xl font-bold text-white">{data.totalTimeOffDays}</div>
          <div className="text-sm text-muted-foreground mt-1">
            PTO: {data.timeOffByType.pto} · Sick: {data.timeOffByType.sick} · Unpaid: {data.timeOffByType.unpaid}
          </div>
        </div>
      </div>

      {/* Client Breakdown */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-semibold text-white">Employees by Client</h3>
          </div>
          <span className="text-sm text-muted-foreground">{data.activeClientCount} active clients</span>
        </div>
        {data.clientBreakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No client data available.</p>
        ) : (
          <div className="space-y-3">
            {data.clientBreakdown.map((client, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-32 text-sm text-white truncate">{client.name}</div>
                <div className="flex-1">
                  <div className="h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((client.employees / Math.max(...data.clientBreakdown.map(c => c.employees))) * 100, 10)}%` }}
                    >
                      <span className="text-xs font-medium text-white">{client.employees}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payroll History Chart */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Payroll History</h3>
          <span className="text-sm text-muted-foreground">{data.payrollHistory.length} periods</span>
        </div>

        {data.payrollHistory.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payroll data yet. Process your first payroll run to see history here.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-48">
            {data.payrollHistory.map((period, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-muted-foreground">{formatCurrency(period.amount)}</div>
                <div
                  className="w-full bg-primary rounded-t min-h-[4px]"
                  style={{ height: `${(period.amount / maxBarAmount) * 140}px` }}
                />
                <div className="text-xs text-muted-foreground truncate w-full text-center">{period.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <h3 className="text-lg font-semibold text-white mb-4">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-border rounded-lg text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h4 className="font-medium text-white mb-1">CSV Export</h4>
            <p className="text-sm text-muted-foreground mb-3">Export data for Excel/Sheets</p>
            <Button variant="outline" size="sm" onClick={() => exportReportCsv(data)}>Export CSV</Button>
          </div>
          <div className="p-4 border border-border rounded-lg text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h4 className="font-medium text-white mb-1">Payroll Report</h4>
            <p className="text-sm text-muted-foreground mb-3">Detailed payroll breakdown</p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/payroll'}>
              View Payroll
            </Button>
          </div>
          <div className="p-4 border border-border rounded-lg text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h4 className="font-medium text-white mb-1">Employee Data</h4>
            <p className="text-sm text-muted-foreground mb-3">Full employee roster</p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/employees'}>
              View Employees
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
