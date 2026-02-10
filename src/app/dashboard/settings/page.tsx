import { Button } from '@/components/ui/button';
import { 
  Save,
  Settings,
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
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your GroundGame system</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => (
          <div key={section.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <section.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{section.description}</p>
            <Button variant="outline" size="sm" className="w-full">
              Configure
            </Button>
          </div>
        ))}
      </div>

      {/* Company Info Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <Globe className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="GroundGame Master"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Zone
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Pacific Time (PT)</option>
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
              <option>Mountain Time (MT)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Currency
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>USD ($)</option>
              <option>CAD (CA$)</option>
              <option>EUR (€)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pay Period
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Bi-weekly</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <Bell className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Payroll Reminders</div>
              <div className="text-sm text-gray-600">Get notified when payroll is due</div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Document Expiry</div>
              <div className="text-sm text-gray-600">Alerts for expiring W-8BEN documents</div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Time-off Requests</div>
              <div className="text-sm text-gray-600">New employee time-off requests</div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Weekly Reports</div>
              <div className="text-sm text-gray-600">Automated weekly summary emails</div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <Database className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Integration Status</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Email Service</div>
                <div className="text-sm text-gray-600">Send automated notifications</div>
              </div>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              Not Connected
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Calendar Integration</div>
                <div className="text-sm text-gray-600">Sync time-off with calendars</div>
              </div>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              Not Connected
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Payment Provider</div>
                <div className="text-sm text-gray-600">Process employee payments</div>
              </div>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              Not Connected
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}