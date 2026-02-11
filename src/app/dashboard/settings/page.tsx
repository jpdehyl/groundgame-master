'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Save,
  Users,
  DollarSign,
  Bell,
  Shield,
  Database,
  Mail,
  Calendar,
  Globe
} from 'lucide-react';

const settingsSections = [
  {
    id: 'company',
    title: 'Company Information',
    icon: Globe,
    description: 'Basic company details and configuration'
  },
  {
    id: 'users',
    title: 'User Management',
    icon: Users,
    description: 'Manage admin users and permissions'
  },
  {
    id: 'payroll',
    title: 'Payroll Settings',
    icon: DollarSign,
    description: 'Configure pay periods, rates, and calculations'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Email and alert preferences'
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    description: 'Authentication and access controls'
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Database,
    description: 'Connect external services and APIs'
  }
];

export default function SettingsPage() {
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
    // Simulate save - would connect to API in production
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-muted-foreground">Configure your GroundGame system</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-accent-blue hover:bg-accent-blue/90"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save All Changes'}
        </Button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => (
          <div key={section.id} className="bg-card p-6 rounded-xl border border-border card-hover hover:shadow-lg hover:shadow-black/20 transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-10 w-10 bg-accent-blue/15 rounded-lg flex items-center justify-center">
                <section.icon className="h-5 w-5 text-accent-blue" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
            <Button variant="outline" size="sm" className="w-full">
              Configure
            </Button>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={companySettings.companyName}
              onChange={(e) => handleCompanyChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time Zone
            </label>
            <select
              value={companySettings.timeZone}
              onChange={(e) => handleCompanyChange('timeZone', e.target.value)}
              className="w-full px-3 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            >
              <option>Pacific Time (PT)</option>
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
              <option>Mountain Time (MT)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Currency
            </label>
            <select
              value={companySettings.currency}
              onChange={(e) => handleCompanyChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            >
              <option>USD ($)</option>
              <option>CAD (CA$)</option>
              <option>EUR (€)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pay Period
            </label>
            <select
              value={companySettings.payPeriod}
              onChange={(e) => handleCompanyChange('payPeriod', e.target.value)}
              className="w-full px-3 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            >
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
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Payroll Reminders</div>
              <div className="text-sm text-muted-foreground">Get notified when payroll is due</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.payrollReminders}
              onChange={() => handleNotificationToggle('payrollReminders')}
              className="h-4 w-4 text-accent-blue focus:ring-accent-blue/50 border-border rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Document Expiry</div>
              <div className="text-sm text-muted-foreground">Alerts for expiring W-8BEN documents</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.documentExpiry}
              onChange={() => handleNotificationToggle('documentExpiry')}
              className="h-4 w-4 text-accent-blue focus:ring-accent-blue/50 border-border rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Time-off Requests</div>
              <div className="text-sm text-muted-foreground">New employee time-off requests</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.timeOffRequests}
              onChange={() => handleNotificationToggle('timeOffRequests')}
              className="h-4 w-4 text-accent-blue focus:ring-accent-blue/50 border-border rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Weekly Reports</div>
              <div className="text-sm text-muted-foreground">Automated weekly summary emails</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.weeklyReports}
              onChange={() => handleNotificationToggle('weeklyReports')}
              className="h-4 w-4 text-accent-blue focus:ring-accent-blue/50 border-border rounded"
            />
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center mb-6">
          <Database className="h-5 w-5 text-muted-foreground mr-2" />
          <h3 className="text-lg font-semibold text-white">Integration Status</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-white">Email Service</div>
                <div className="text-sm text-muted-foreground">Send automated notifications</div>
              </div>
            </div>
            <span className="px-2 py-1 bg-accent-yellow/15 text-accent-yellow text-xs rounded">
              Not Connected
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-white">Calendar Integration</div>
                <div className="text-sm text-muted-foreground">Sync time-off with calendars</div>
              </div>
            </div>
            <span className="px-2 py-1 bg-accent-yellow/15 text-accent-yellow text-xs rounded">
              Not Connected
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-white">Payment Provider</div>
                <div className="text-sm text-muted-foreground">Process employee payments</div>
              </div>
            </div>
            <span className="px-2 py-1 bg-accent-yellow/15 text-accent-yellow text-xs rounded">
              Not Connected
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-accent-blue hover:bg-accent-blue/90"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
