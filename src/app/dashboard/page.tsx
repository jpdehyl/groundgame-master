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
  UserPlus
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
  employee_added: 'bg-primary',
  document_uploaded: 'bg-purple-500',
  time_off_request: 'bg-accent-yellow',
  audit: 'bg-muted',
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to GroundGame Master</p>
        </div>
        <div className="bg-accent-yellow/10 border border-accent-yellow/20 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-accent-yellow mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-accent-yellow">Could not load dashboard data</h3>
              <p className="text-sm text-accent-yellow mt-1">Check your Supabase connection and make sure the database schema has been applied.</p>
              <a href="/dashboard/import" className="inline-block mt-3 text-sm font-medium text-accent-yellow underline hover:text-accent-yellow">
                Import your data from Google Sheets
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dashboardStats = [
    {
      name: 'Total Employees',
      value: stats.totalEmployees.toString(),
      change: `${stats.activeEmployees} active`,
      changeType: 'neutral' as const,
      icon: Users,
      color: 'bg-accent-blue/100'
    },
    {
      name: 'Active Clients',
      value: stats.activeClients.toString(),
      change: `${stats.totalClients} total`,
      changeType: 'neutral' as const,
      icon: Building2,
      color: 'bg-accent-green/100'
    },
    {
      name: 'Monthly Payroll',
      value: `$${stats.monthlyPayroll.toLocaleString()}`,
      change: `${stats.activeEmployees} employees`,
      changeType: 'neutral' as const,
      icon: DollarSign,
      color: 'bg-yellow-500'
    },
    {
      name: 'Expiring Docs',
      value: stats.pendingDocuments.toString(),
      change: stats.pendingDocuments > 0 ? 'Expiring within 30 days' : 'All up to date',
      changeType: stats.pendingDocuments > 0 ? 'decrease' as const : 'increase' as const,
      icon: FileCheck,
      color: 'bg-accent-red/100'
    }
  ];

  const expiredDocs = (stats.expiringDocuments ?? []).filter(d => d.days_until <= 0);
  const soonExpiringDocs = (stats.expiringDocuments ?? []).filter(d => d.days_until > 0 && d.days_until <= 90);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your team.</p>
      </div>

      {/* DB Error Banner */}
      {stats.dbError && (
        <div className="bg-accent-yellow/10 border border-accent-yellow/20 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-accent-yellow mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-accent-yellow">Database Issue</h3>
              <p className="text-sm text-accent-yellow mt-1">{stats.dbError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started - show when no data */}
      {stats.totalEmployees === 0 && stats.totalClients === 0 && (
        <div className="bg-accent-blue/10 border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-primary mb-2">Get Started</h3>
          <p className="text-sm text-primary mb-4">Your system is ready. Import your existing data from Google Sheets or start adding employees manually.</p>
          <div className="flex gap-3 flex-wrap">
            <a href="/dashboard/import" className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover">
              Import from Google Sheets
            </a>
            <a href="/dashboard/employees" className="inline-flex items-center px-4 py-2 border border-blue-500/20 text-primary text-sm font-medium rounded-md hover:bg-accent-blue/20">
              Add Employees Manually
            </a>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <div key={stat.name} className="bg-card p-6 rounded-xl border border-border card-hover">
            <div className="flex items-center">
              <div className={`p-2 rounded-md ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'increase' ? 'text-accent-green' :
                  stat.changeType === 'decrease' ? 'text-accent-red' : 'text-muted-foreground'
                }`}>
                  {stat.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section - Expiring Documents */}
      {(expiredDocs.length > 0 || soonExpiringDocs.length > 0) && (
        <div className="space-y-3">
          {expiredDocs.length > 0 && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-accent-red mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-accent-red">{expiredDocs.length} W-8BEN document{expiredDocs.length !== 1 ? 's' : ''} expired</p>
                  <div className="mt-2 space-y-1">
                    {expiredDocs.map(doc => (
                      <p key={doc.id} className="text-sm text-accent-red">
                        {doc.employee_name} — expired {formatDate(doc.expiry_date)}
                      </p>
                    ))}
                  </div>
                  <a href="/dashboard/documents" className="inline-block mt-2 text-sm font-medium text-accent-red underline">
                    Renew now
                  </a>
                </div>
              </div>
            </div>
          )}
          {soonExpiringDocs.length > 0 && (
            <div className="bg-accent-yellow/10 border border-accent-yellow/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-accent-yellow mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-accent-yellow">{soonExpiringDocs.length} document{soonExpiringDocs.length !== 1 ? 's' : ''} expiring soon</p>
                  <div className="mt-2 space-y-1">
                    {soonExpiringDocs.slice(0, 5).map(doc => (
                      <p key={doc.id} className="text-sm text-accent-yellow">
                        {doc.employee_name} — {doc.days_until} day{doc.days_until !== 1 ? 's' : ''} left (expires {formatDate(doc.expiry_date)})
                      </p>
                    ))}
                  </div>
                  <a href="/dashboard/documents" className="inline-block mt-2 text-sm font-medium text-accent-yellow underline">
                    Review documents
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
                ? 'bg-accent-red/10 border border-accent-red/20'
                : alert.days_until_end <= 3
                ? 'bg-accent-yellow/10 border border-accent-yellow/20'
                : 'bg-accent-blue/10 border border-blue-500/20'
            }`}>
              <div>
                <p className={`text-sm font-medium ${
                  alert.days_until_end <= 0 ? 'text-accent-red' :
                  alert.days_until_end <= 3 ? 'text-accent-yellow' : 'text-primary'
                }`}>
                  Pay period {formatDate(alert.period_start)} – {formatDate(alert.period_end)}
                  {alert.days_until_end <= 0 ? ' — past due' :
                   alert.days_until_end <= 3 ? ` — ends in ${alert.days_until_end} day${alert.days_until_end !== 1 ? 's' : ''}` :
                   ` — ${alert.days_until_end} days remaining`}
                </p>
                <p className={`text-xs mt-0.5 ${
                  alert.days_until_end <= 0 ? 'text-accent-red' :
                  alert.days_until_end <= 3 ? 'text-accent-yellow' : 'text-accent-blue'
                }`}>
                  Status: {alert.status}{alert.status === 'closed' && !alert.has_run ? ' — ready for payroll processing' : ''}
                  {alert.has_run ? ' — payroll run created' : ''}
                </p>
              </div>
              <a href="/dashboard/payroll" className={`text-sm font-medium ${
                alert.days_until_end <= 0 ? 'text-accent-red' :
                alert.days_until_end <= 3 ? 'text-accent-yellow' : 'text-primary'
              }`}>
                {alert.status === 'closed' && !alert.has_run ? 'Process' : 'View'} →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          {stats.recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent activity. Import data or add employees to get started.</p>
          ) : (
            <div className="space-y-4">
              {stats.recentActivities.map((activity) => {
                const Icon = activityIcons[activity.type] || Clock;
                const color = activityColors[activity.type] || 'bg-muted';
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 h-6 w-6 ${color} rounded-full flex items-center justify-center mt-0.5`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/dashboard/employees"
              className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-muted-foreground mr-3" />
                <span className="text-sm font-medium text-white">Add New Employee</span>
              </div>
              <span className="text-xs text-muted-foreground">→</span>
            </a>
            <a
              href="/dashboard/payroll"
              className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-muted-foreground mr-3" />
                <span className="text-sm font-medium text-white">Process Payroll</span>
              </div>
              <span className="text-xs text-muted-foreground">→</span>
            </a>
            <a
              href="/dashboard/documents"
              className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-muted-foreground mr-3" />
                <span className="text-sm font-medium text-white">Manage Documents</span>
              </div>
              <span className="text-xs text-muted-foreground">→</span>
            </a>
            <a
              href="/dashboard/import"
              className="flex items-center justify-between p-3 bg-accent-green/10 rounded-md hover:bg-accent-green/20 transition-colors border border-accent-green/20"
            >
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-accent-green mr-3" />
                <span className="text-sm font-medium text-accent-green">Import from Google Sheets</span>
              </div>
              <span className="text-xs text-accent-green">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
