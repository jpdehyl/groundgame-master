'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  Save,
  Users,
  DollarSign,
  Bell,
  Database,
  Mail,
  Calendar,
  Globe,
  CheckCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Briefcase,
  AlertTriangle,
  Check,
  RefreshCw,
  Shield,
  LucideIcon
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string | null;
  hourly_rate: number | null;
}

interface PayrollSettings {
  defaultSpifRate: number;
  w8benWarningDays: number;
  overtimeMultiplier: number;
  overtimeThresholdHours: number;
}

interface NotificationSettings {
  payrollReminders: boolean;
  documentExpiry: boolean;
  timeOffRequests: boolean;
  weeklyReports: boolean;
}

interface IntegrationStatus {
  connected: boolean;
  status: string;
  detail?: string;
}

interface IntegrationItem {
  key: string;
  icon: LucideIcon;
  label: string;
  desc: string;
}

const settingsSections = [
  { id: 'company', title: 'Company', icon: Globe },
  { id: 'payroll', title: 'Payroll', icon: DollarSign },
  { id: 'roles', title: 'Roles', icon: Briefcase },
  { id: 'notifications', title: 'Notifications', icon: Bell },
  { id: 'integrations', title: 'Integrations', icon: Database },
];

const inputClass = 'w-full px-3 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('company');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Company settings
  const [companySettings, setCompanySettings] = useState({
    companyName: 'GroundGame Master',
    timeZone: 'Pacific Time (PT)',
    currency: 'USD ($)',
    payPeriod: 'Bi-weekly',
  });

  // Payroll settings
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>({
    defaultSpifRate: 0,
    w8benWarningDays: 90,
    overtimeMultiplier: 1.5,
    overtimeThresholdHours: 40,
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationSettings>({
    payrollReminders: true,
    documentExpiry: true,
    timeOffRequests: true,
    weeklyReports: false,
  });

  // Roles
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editRoleData, setEditRoleData] = useState({ name: '', description: '', hourly_rate: '' });
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', hourly_rate: '' });
  const [roleLoading, setRoleLoading] = useState<string | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Integration statuses
  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus>>({});
  const [integrationsLoading, setIntegrationsLoading] = useState(true);

  const fetchIntegrations = async () => {
    setIntegrationsLoading(true);
    try {
      const res = await fetch('/api/integrations/status');
      const data = await res.json();
      if (data.success) setIntegrations(data.data);
    } catch {
      // Leave empty
    } finally {
      setIntegrationsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, rolesRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/roles'),
        ]);

        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.data) {
          const d = settingsData.data;
          if (d.companyName) setCompanySettings({
            companyName: d.companyName || 'GroundGame Master',
            timeZone: d.timeZone || 'Pacific Time (PT)',
            currency: d.currency || 'USD ($)',
            payPeriod: d.payPeriod || 'Bi-weekly',
          });
          if (d.payroll) setPayrollSettings({
            defaultSpifRate: d.payroll.defaultSpifRate ?? 0,
            w8benWarningDays: d.payroll.w8benWarningDays ?? 90,
            overtimeMultiplier: d.payroll.overtimeMultiplier ?? 1.5,
            overtimeThresholdHours: d.payroll.overtimeThresholdHours ?? 40,
          });
          if (d.notifications) setNotifications(d.notifications);
        }

        const rolesData = await rolesRes.json();
        if (rolesData.success) setRoles(rolesData.data || []);
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    fetchIntegrations();
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const markChanged = () => { setSaved(false); setHasChanges(true); };

  const handleCompanyChange = (field: string, value: string) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }));
    markChanged();
  };

  const handlePayrollChange = (field: string, value: string) => {
    setPayrollSettings(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    markChanged();
  };

  const handleNotificationToggle = (field: string) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field as keyof NotificationSettings] }));
    markChanged();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...companySettings,
          payroll: payrollSettings,
          notifications,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setHasChanges(false);
        toast('Settings saved successfully', 'success');
      } else {
        toast(data.error || 'Failed to save settings', 'error');
      }
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Role CRUD
  const handleAddRole = async () => {
    if (!newRole.name.trim()) {
      toast('Role name is required', 'error');
      return;
    }
    setRoleLoading('add');
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRole.name.trim(),
          description: newRole.description.trim() || null,
          hourly_rate: newRole.hourly_rate ? parseFloat(newRole.hourly_rate) : null,
        })
      });
      const data = await res.json();
      if (data.success) {
        setRoles(prev => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewRole({ name: '', description: '', hourly_rate: '' });
        setShowAddRole(false);
        toast(`Role "${data.data.name}" created`, 'success');
      } else {
        toast(data.error || 'Failed to create role', 'error');
      }
    } catch {
      toast('Failed to create role', 'error');
    } finally {
      setRoleLoading(null);
    }
  };

  const handleUpdateRole = async (id: string) => {
    if (!editRoleData.name.trim()) {
      toast('Role name is required', 'error');
      return;
    }
    setRoleLoading(id);
    try {
      const res = await fetch(`/api/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editRoleData.name.trim(),
          description: editRoleData.description.trim() || null,
          hourly_rate: editRoleData.hourly_rate ? parseFloat(editRoleData.hourly_rate) : null,
        })
      });
      const data = await res.json();
      if (data.success) {
        setRoles(prev => prev.map(r => r.id === id ? data.data : r).sort((a, b) => a.name.localeCompare(b.name)));
        setEditingRole(null);
        toast('Role updated', 'success');
      } else {
        toast(data.error || 'Failed to update role', 'error');
      }
    } catch {
      toast('Failed to update role', 'error');
    } finally {
      setRoleLoading(null);
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (!confirm(`Delete role "${name}"? This cannot be undone.`)) return;
    setRoleLoading(id);
    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRoles(prev => prev.filter(r => r.id !== id));
        toast(`Role "${name}" deleted`, 'success');
      } else {
        toast(data.error || 'Failed to delete role', 'error');
      }
    } catch {
      toast('Failed to delete role', 'error');
    } finally {
      setRoleLoading(null);
    }
  };

  const startEditRole = (role: Role) => {
    setEditingRole(role.id);
    setEditRoleData({
      name: role.name,
      description: role.description || '',
      hourly_rate: role.hourly_rate?.toString() || '',
    });
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-muted-foreground">Configure your GroundGame system</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges} className="bg-primary hover:bg-primary-hover">
          {saved ? <CheckCircle className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {settingsSections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === section.id
                ? 'bg-primary text-white'
                : 'bg-card text-muted-foreground hover:text-white hover:bg-card/80 border border-border'
            }`}
          >
            <section.icon className="h-4 w-4" />
            {section.title}
          </button>
        ))}
      </div>

      {/* Company Information */}
      <div ref={el => { sectionRefs.current['company'] = el; }} className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center mb-6">
          <Globe className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-semibold text-white">Company Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Company Name</label>
            <input type="text" value={companySettings.companyName}
              onChange={(e) => handleCompanyChange('companyName', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Time Zone</label>
            <select value={companySettings.timeZone}
              onChange={(e) => handleCompanyChange('timeZone', e.target.value)}
              className={inputClass}>
              <option>Pacific Time (PT)</option>
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
              <option>Mountain Time (MT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Default Currency</label>
            <select value={companySettings.currency}
              onChange={(e) => handleCompanyChange('currency', e.target.value)}
              className={inputClass}>
              <option>USD ($)</option>
              <option>CAD (CA$)</option>
              <option>EUR (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Default Pay Period</label>
            <select value={companySettings.payPeriod}
              onChange={(e) => handleCompanyChange('payPeriod', e.target.value)}
              className={inputClass}>
              <option>Bi-weekly</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Configuration */}
      <div ref={el => { sectionRefs.current['payroll'] = el; }} className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center mb-6">
          <DollarSign className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-semibold text-white">Payroll Configuration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Default SPIF Rate (per lead)</label>
            <p className="text-xs text-muted-foreground mb-2">Default bonus amount per lead processed</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input type="number" step="0.01" min="0"
                value={payrollSettings.defaultSpifRate}
                onChange={(e) => handlePayrollChange('defaultSpifRate', e.target.value)}
                className={`${inputClass} pl-7`} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">W-8BEN Warning Threshold</label>
            <p className="text-xs text-muted-foreground mb-2">Days before expiry to show dashboard alerts</p>
            <div className="relative">
              <input type="number" step="1" min="1" max="365"
                value={payrollSettings.w8benWarningDays}
                onChange={(e) => handlePayrollChange('w8benWarningDays', e.target.value)}
                className={inputClass} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">days</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Overtime Multiplier</label>
            <p className="text-xs text-muted-foreground mb-2">Rate multiplier for overtime hours (e.g. 1.5x)</p>
            <div className="relative">
              <input type="number" step="0.1" min="1"
                value={payrollSettings.overtimeMultiplier}
                onChange={(e) => handlePayrollChange('overtimeMultiplier', e.target.value)}
                className={inputClass} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">x</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Overtime Threshold</label>
            <p className="text-xs text-muted-foreground mb-2">Hours per period before overtime kicks in</p>
            <div className="relative">
              <input type="number" step="1" min="0"
                value={payrollSettings.overtimeThresholdHours}
                onChange={(e) => handlePayrollChange('overtimeThresholdHours', e.target.value)}
                className={inputClass} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Management */}
      <div ref={el => { sectionRefs.current['roles'] = el; }} className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Briefcase className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-semibold text-white">Roles & Hourly Rates</h3>
          </div>
          {!showAddRole && (
            <Button size="sm" onClick={() => setShowAddRole(true)} className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-1" /> Add Role
            </Button>
          )}
        </div>

        {/* Add Role Form */}
        {showAddRole && (
          <div className="mb-4 p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">New Role</span>
              <button onClick={() => setShowAddRole(false)} className="text-muted-foreground hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input type="text" placeholder="Role name *"
                value={newRole.name}
                onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                className={inputClass} />
              <input type="text" placeholder="Description"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                className={`${inputClass} md:col-span-2`} />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" step="0.01" min="0" placeholder="Rate/hr"
                    value={newRole.hourly_rate}
                    onChange={(e) => setNewRole(prev => ({ ...prev, hourly_rate: e.target.value }))}
                    className={`${inputClass} pl-7`} />
                </div>
                <Button size="sm" onClick={handleAddRole} disabled={roleLoading === 'add'}
                  className="bg-accent-green hover:bg-green-600 shrink-0">
                  {roleLoading === 'add' ? '...' : <Check className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Roles Table */}
        {roles.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No roles defined yet. Add your first role to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-muted-foreground font-medium">Role Name</th>
                  <th className="pb-3 text-muted-foreground font-medium hidden md:table-cell">Description</th>
                  <th className="pb-3 text-muted-foreground font-medium text-right">Hourly Rate</th>
                  <th className="pb-3 text-muted-foreground font-medium text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id} className="border-b border-border/50 last:border-0">
                    {editingRole === role.id ? (
                      <>
                        <td className="py-3 pr-3">
                          <input type="text" value={editRoleData.name}
                            onChange={(e) => setEditRoleData(prev => ({ ...prev, name: e.target.value }))}
                            className={`${inputClass} py-1.5`} />
                        </td>
                        <td className="py-3 pr-3 hidden md:table-cell">
                          <input type="text" value={editRoleData.description}
                            onChange={(e) => setEditRoleData(prev => ({ ...prev, description: e.target.value }))}
                            className={`${inputClass} py-1.5`} />
                        </td>
                        <td className="py-3 pr-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                            <input type="number" step="0.01" min="0" value={editRoleData.hourly_rate}
                              onChange={(e) => setEditRoleData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                              className={`${inputClass} py-1.5 pl-7 text-right`} />
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => handleUpdateRole(role.id)}
                              disabled={roleLoading === role.id}
                              className="p-1.5 rounded bg-accent-green/10 text-accent-green hover:bg-accent-green/25">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setEditingRole(null)}
                              className="p-1.5 rounded bg-muted text-muted-foreground hover:bg-white/5">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 text-white font-medium">{role.name}</td>
                        <td className="py-3 text-muted-foreground hidden md:table-cell">{role.description || '—'}</td>
                        <td className="py-3 text-right text-white">
                          {role.hourly_rate != null ? `$${Number(role.hourly_rate).toFixed(2)}/hr` : '—'}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => startEditRole(role)}
                              className="p-1.5 rounded text-muted-foreground hover:text-white hover:bg-white/5">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteRole(role.id, role.name)}
                              disabled={roleLoading === role.id}
                              className="p-1.5 rounded text-muted-foreground hover:text-accent-red hover:bg-accent-red/20">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Roles determine base hourly rates for payroll. Client-specific pricing overrides these rates.
          Employee-level salary_compensation overrides both.
        </p>
      </div>

      {/* Notification Preferences */}
      <div ref={el => { sectionRefs.current['notifications'] = el; }} className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center mb-6">
          <Bell className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: 'payrollReminders', label: 'Payroll Reminders', desc: 'Get notified when payroll processing is due' },
            { key: 'documentExpiry', label: 'Document Expiry Alerts', desc: 'Dashboard alerts for expiring W-8BEN documents' },
            { key: 'timeOffRequests', label: 'Time-off Requests', desc: 'Notifications for new employee time-off requests' },
            { key: 'weeklyReports', label: 'Weekly Summary', desc: 'Automated weekly payroll and activity summary' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="text-sm font-medium text-white">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
              </div>
              <button
                onClick={() => handleNotificationToggle(item.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${
                  notifications[item.key as keyof NotificationSettings] ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                  notifications[item.key as keyof NotificationSettings] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div ref={el => { sectionRefs.current['integrations'] = el; }} className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-semibold text-white">Integrations</h3>
          </div>
          <button
            onClick={fetchIntegrations}
            disabled={integrationsLoading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${integrationsLoading ? 'animate-spin' : ''}`} />
            {integrationsLoading ? 'Checking...' : 'Refresh'}
          </button>
        </div>
        <div className="space-y-3">
          {([
            { key: 'supabase', icon: Database, label: 'Supabase Database', desc: 'PostgreSQL database for all app data' },
            { key: 'clerk', icon: Shield, label: 'Clerk Authentication', desc: 'OAuth-based user authentication' },
            { key: 'veem', icon: DollarSign, label: 'Veem Payments', desc: 'Export payroll as Veem-compatible CSV for payments' },
            { key: 'email', icon: Mail, label: 'Email Notifications', desc: 'Send automated alerts and reminders' },
            { key: 'calendar', icon: Calendar, label: 'Calendar Sync', desc: 'Sync time-off with Google Calendar' },
          ] as IntegrationItem[]).map(item => {
            const status = integrations[item.key];
            const connected = status?.connected ?? false;
            const statusText = integrationsLoading && !status ? 'Checking...' : status?.status || 'Unknown';
            const detail = status?.detail;

            return (
              <div key={item.key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3 min-w-0">
                  <item.icon className={`h-5 w-5 shrink-0 ${connected ? 'text-accent-green' : 'text-muted-foreground'}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                    {detail && (
                      <div className={`text-xs mt-1 ${connected ? 'text-accent-green/70' : 'text-accent-yellow'}`}>
                        {detail}
                      </div>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap ml-3 shrink-0 ${
                  connected
                    ? 'bg-accent-green/10 text-accent-green'
                    : statusText === 'Checking...'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-accent-yellow/10 text-accent-yellow'
                }`}>
                  {statusText}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Save Bar */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg shadow-black/40 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-accent-yellow" />
            <span className="text-sm text-muted-foreground">You have unsaved changes</span>
            <Button onClick={handleSave} disabled={saving} size="sm" className="bg-primary hover:bg-primary-hover">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
