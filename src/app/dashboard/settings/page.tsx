'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  Save,
  Users,
  DollarSign,
  Bell,
  Shield,
  Database,
  Mail,
  Calendar,
  Globe,
  CheckCircle
} from 'lucide-react';

const settingsSections = [
  { id: 'company', title: 'Company Information', icon: Globe, description: 'Basic company details and configuration' },
  { id: 'users', title: 'User Management', icon: Users, description: 'Manage admin users and permissions' },
  { id: 'payroll', title: 'Payroll Settings', icon: DollarSign, description: 'Configure pay periods, rates, and calculations' },
  { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Email and alert preferences' },
  { id: 'security', title: 'Security', icon: Shield, description: 'Authentication and access controls' },
  { id: 'integrations', title: 'Integrations', icon: Database, description: 'Connect external services and APIs' }
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState({
    companyName: 'GroundGame Master',
    timeZone: 'Pacific Time (PT)',
    currency: 'USD ($)',
    payPeriod: 'Bi-weekly',
  });

  const [notifications, setNotifications] = useState({
    payrollReminders: true,
    documentExpiry: true,
    timeOffRequests: true,
    weeklyReports: false,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.companyName) setCompanySettings({
            companyName: data.data.companyName || 'GroundGame Master',
            timeZone: data.data.timeZone || 'Pacific Time (PT)',
            currency: data.data.currency || 'USD ($)',
            payPeriod: data.data.payPeriod || 'Bi-weekly',
          });
          if (data.data.notifications) setNotifications(data.data.notifications);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleCompanyChange = (field: string, value: string) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleNotificationToggle = (field: string) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...companySettings, notifications })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
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

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-muted-foreground">Configure your GroundGame system</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-accent-blue hover:bg-accent-blue/90">
          {saved ? <CheckCircle className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save All Changes'}
        </Button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => (
          <div key={section.id} className="bg-card p-6 rounded-xl border border-border card-hover hover:shadow-lg hover:shadow-black/20 transition-shadow">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-10 w-10 bg-accent-blue/15 rounded-lg flex items-center justify-center">
                <section.icon className="h-5 w-5 text-accent-blue" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
        ))}
      </div>

      {/* Company Info Section */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center mb-6">
          <Globe className="h-5 w-5 text-muted-foreground mr-2" />
          <h3 className="text-lg font-semibold text-white">Company Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
            <input type="text" value={companySettings.companyName}
              onChange={(e) => handleCompanyChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time Zone</label>
            <select value={companySettings.timeZone}
              onChange={(e) => handleCompanyChange('timeZone', e.target.value)}
              className="w-full px-3 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50">
              <option>Pacific Time (PT)</option>
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
              <option>Mountain Time (MT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Default Currency</label>
            <select value={companySettings.currency}
              onChange={(e) => handleCompanyChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50">
              <option>USD ($)</option>
              <option>CAD (CA$)</option>
              <option>EUR (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Pay Period</label>
            <select value={companySettings.payPeriod}
              onChange={(e) => handleCompanyChange('payPeriod', e.target.value)}
              className="w-full px-3 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50">
              <option>Bi-weekly</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center mb-6">
          <Bell className="h-5 w-5 text-muted-foreground mr-2" />
          <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: 'payrollReminders', label: 'Payroll Reminders', desc: 'Get notified when payroll is due' },
            { key: 'documentExpiry', label: 'Document Expiry', desc: 'Alerts for expiring W-8BEN documents' },
            { key: 'timeOffRequests', label: 'Time-off Requests', desc: 'New employee time-off requests' },
            { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Automated weekly summary emails' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">{item.label}</div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
              </div>
              <button
                onClick={() => handleNotificationToggle(item.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[item.key as keyof typeof notifications] ? 'bg-accent-blue' : 'bg-white/20'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center mb-6">
          <Database className="h-5 w-5 text-muted-foreground mr-2" />
          <h3 className="text-lg font-semibold text-white">Integration Status</h3>
        </div>
        <div className="space-y-4">
          {[
            { icon: Mail, label: 'Email Service', desc: 'Send automated notifications', connected: false },
            { icon: Calendar, label: 'Calendar Integration', desc: 'Sync time-off with calendars', connected: false },
            { icon: DollarSign, label: 'Veem Payments', desc: 'Export payroll to Veem CSV', connected: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                item.connected ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-yellow/15 text-accent-yellow'
              }`}>
                {item.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-accent-blue hover:bg-accent-blue/90">
          {saved ? <CheckCircle className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
