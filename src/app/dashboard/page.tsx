'use client';

import { useState, useEffect } from 'react';
import { StatSkeleton, CardSkeleton } from '@/components/ui/skeleton';
import {
  Users,
  Building2,
  DollarSign,
  FileCheck,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  FileText,
  UserPlus,
  ArrowRight
} from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalClients: number;
  activeClients: number;
  monthlyPayroll: number;
  pendingDocuments: number;
  dbConnected?: boolean;
  dbError?: string | null;
  recentActivities: Array<{
    id: number;
    type: string;
    description: string;
    time: string;
    user: string;
  }>;
  expiringDocuments: Array<{
    id: string;
    file_name: string;
    expiry_date: string;
    days_until: number;
    employee_name: string;
  }>;
  payrollAlerts: Array<{
    id: string;
    period_start: string;
    period_end: string;
    status: string;
    days_until_end: number;
    has_run: boolean;
  }>;
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const activityIcons: Record<string, typeof Users> = {
  employee_added: UserPlus,
  document_uploaded: FileText,
  time_off_request: Calendar,
  audit: Clock,
};

const activityColors: Record<string, string> = {
  employee_added: 'bg-primary/20 text-primary',
  document_uploaded: 'bg-accent-purple/20 text-accent-purple',
  time_off_request: 'bg-accent-yellow/20 text-accent-yellow',
  audit: 'bg-muted-foreground/20 text-muted-foreground',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-heading tracking-tight">Dashboard</h1>
          <p className="text-text-secondary mt-1">Loading your workspace...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-heading tracking-tight">Dashboard</h1>
          <p className="text-text-secondary mt-1">Welcome to GroundGame</p>
        </div>
        <div className="bg-accent-yellow/8 border border-accent-yellow/15 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-accent-yellow mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-accent-yellow">Couldn&apos;t reach the database</h3>
              <p className="text-sm text-accent-yellow/80 mt-1">Check your Supabase connection and make sure the schema has been applied.</p>
              <a href="/dashboard/import" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-accent-yellow hover:text-accent-yellow/80 transition-colors">
                Import your data instead <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dashboardStats = [
    {
      name: 'Employees',
      value: stats.totalEmployees.toString(),
      detail: `${stats.activeEmployees} active`,
      icon: Users,
      iconColor: 'text-accent-blue',
      iconBg: 'bg-accent-blue/10',
    },
    {
      name: 'Clients',
      value: stats.activeClients.toString(),
      detail: `${stats.totalClients} total`,
      icon: Building2,
      iconColor: 'text-accent-green',
      iconBg: 'bg-accent-green/10',
    },
    {
      name: 'Monthly Payroll',
      value: `$${stats.monthlyPayroll.toLocaleString()}`,
      detail: `${stats.activeEmployees} on payroll`,
      icon: DollarSign,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    {
      name: 'Expiring Docs',
      value: stats.pendingDocuments.toString(),
      detail: stats.pendingDocuments > 0 ? 'Need attention' : 'All current',
      icon: FileCheck,
      iconColor: stats.pendingDocuments > 0 ? 'text-accent-red' : 'text-accent-green',
      iconBg: stats.pendingDocuments > 0 ? 'bg-accent-red/10' : 'bg-accent-green/10',
    }
  ];

  const expiredDocs = (stats.expiringDocuments ?? []).filter(d => d.days_until <= 0);
  const soonExpiringDocs = (stats.expiringDocuments ?? []).filter(d => d.days_until > 0 && d.days_until <= 90);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-heading tracking-tight">Dashboard</h1>
        <p className="text-text-secondary mt-1">Here&apos;s what&apos;s happening with your team today.</p>
      </div>

      {/* DB Error Banner */}
      {stats.dbError && (
        <div className="bg-accent-yellow/8 border border-accent-yellow/15 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-accent-yellow mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-accent-yellow">Database Issue</h3>
              <p className="text-sm text-accent-yellow/80 mt-1">{stats.dbError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started - show when no data */}
      {stats.totalEmployees === 0 && stats.totalClients === 0 && (
        <div className="relative bg-card-elevated border border-border-warm rounded-xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-glow to-transparent pointer-events-none" />
          <div className="relative">
            <h3 className="text-xl font-semibold text-heading tracking-tight">Your workspace is ready</h3>
            <p className="text-text-secondary mt-2 max-w-lg">Import your team from Google Sheets to get started in minutes, or build your roster one person at a time.</p>
            <div className="flex gap-3 flex-wrap mt-5">
              <a href="/dashboard/import" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
                Import from Google Sheets
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/dashboard/employees" className="inline-flex items-center gap-2 px-5 py-2.5 border border-border-strong text-text-secondary text-sm font-medium rounded-lg hover:bg-white/5 hover:text-white transition-colors">
                Add manually
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {dashboardStats.map((stat, i) => (
          <div
            key={stat.name}
            className="bg-card p-5 rounded-xl border border-border card-hover animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-semibold text-heading mt-1 font-mono tracking-tight">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground mt-3">{stat.detail}</p>
          </div>
        ))}
      </div>

      {/* Alerts Section - Expiring Documents */}
      {(expiredDocs.length > 0 || soonExpiringDocs.length > 0) && (
        <div className="space-y-3">
          {expiredDocs.length > 0 && (
            <div className="bg-accent-red/8 border border-accent-red/15 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-accent-red mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-accent-red">{expiredDocs.length} W-8BEN document{expiredDocs.length !== 1 ? 's' : ''} expired</p>
                  <div className="mt-2 space-y-1">
                    {expiredDocs.map(doc => (
                      <p key={doc.id} className="text-sm text-accent-red/80">
                        {doc.employee_name} — expired {formatDate(doc.expiry_date)}
                      </p>
                    ))}
                  </div>
                  <a href="/dashboard/documents" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-accent-red hover:text-accent-red/80 transition-colors">
                    Renew now <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
          {soonExpiringDocs.length > 0 && (
            <div className="bg-accent-yellow/8 border border-accent-yellow/15 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-accent-yellow mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-accent-yellow">{soonExpiringDocs.length} document{soonExpiringDocs.length !== 1 ? 's' : ''} expiring soon</p>
                  <div className="mt-2 space-y-1">
                    {soonExpiringDocs.slice(0, 5).map(doc => (
                      <p key={doc.id} className="text-sm text-accent-yellow/80">
                        {doc.employee_name} — {doc.days_until} day{doc.days_until !== 1 ? 's' : ''} left (expires {formatDate(doc.expiry_date)})
                      </p>
                    ))}
                  </div>
                  <a href="/dashboard/documents" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-accent-yellow hover:text-accent-yellow/80 transition-colors">
                    Review documents <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payroll Alerts */}
      {(stats.payrollAlerts ?? []).length > 0 && (
        <div className="space-y-3">
          {(stats.payrollAlerts ?? []).map(alert => (
            <div key={alert.id} className={`rounded-xl p-4 flex items-center justify-between ${
              alert.days_until_end <= 0
                ? 'bg-accent-red/8 border border-accent-red/15'
                : alert.days_until_end <= 3
                ? 'bg-accent-yellow/8 border border-accent-yellow/15'
                : 'bg-accent-blue/8 border border-accent-blue/15'
            }`}>
              <div>
                <p className={`text-sm font-medium ${
                  alert.days_until_end <= 0 ? 'text-accent-red' :
                  alert.days_until_end <= 3 ? 'text-accent-yellow' : 'text-accent-blue'
                }`}>
                  Pay period {formatDate(alert.period_start)} – {formatDate(alert.period_end)}
                  {alert.days_until_end <= 0 ? ' — past due' :
                   alert.days_until_end <= 3 ? ` — ends in ${alert.days_until_end} day${alert.days_until_end !== 1 ? 's' : ''}` :
                   ` — ${alert.days_until_end} days remaining`}
                </p>
                <p className={`text-xs mt-0.5 ${
                  alert.days_until_end <= 0 ? 'text-accent-red/70' :
                  alert.days_until_end <= 3 ? 'text-accent-yellow/70' : 'text-accent-blue/70'
                }`}>
                  Status: {alert.status}{alert.status === 'closed' && !alert.has_run ? ' — ready for payroll processing' : ''}
                  {alert.has_run ? ' — payroll run created' : ''}
                </p>
              </div>
              <a href="/dashboard/payroll" className={`inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-80 ${
                alert.days_until_end <= 0 ? 'text-accent-red' :
                alert.days_until_end <= 3 ? 'text-accent-yellow' : 'text-accent-blue'
              }`}>
                {alert.status === 'closed' && !alert.has_run ? 'Process' : 'View'}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-[15px] font-semibold text-heading">Recent Activity</h3>
          {stats.recentActivities.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Activity will show up here once your team is set up.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {stats.recentActivities.map((activity) => {
                const Icon = activityIcons[activity.type] || Clock;
                const color = activityColors[activity.type] || 'bg-muted text-muted-foreground';
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 h-7 w-7 ${color} rounded-full flex items-center justify-center mt-0.5`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-[15px] font-semibold text-heading">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            {[
              { href: '/dashboard/employees', icon: Users, label: 'Add New Employee', color: 'group-hover:text-accent-blue' },
              { href: '/dashboard/payroll', icon: DollarSign, label: 'Process Payroll', color: 'group-hover:text-primary' },
              { href: '/dashboard/documents', icon: FileText, label: 'Manage Documents', color: 'group-hover:text-accent-purple' },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <action.icon className={`h-4 w-4 text-muted-foreground transition-colors ${action.color}`} />
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-foreground transition-colors" />
              </a>
            ))}
            <a
              href="/dashboard/import"
              className="group flex items-center justify-between p-3 rounded-lg bg-primary/[0.04] border border-primary/10 hover:bg-primary/[0.08] transition-colors"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Import from Google Sheets</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-primary/50 group-hover:text-primary transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
