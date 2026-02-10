import { Button } from '@/components/ui/button';
import { 
  Download,
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Settings
} from 'lucide-react';

const reportTemplates = [
  {
    id: 1,
    name: 'Employee Performance Report',
    description: 'Detailed performance metrics for all employees',
    category: 'Employee',
    frequency: 'Monthly',
    lastGenerated: '2024-02-01',
    icon: Users
  },
  {
    id: 2,
    name: 'Payroll Summary',
    description: 'Complete payroll breakdown with costs and bonuses',
    category: 'Finance',
    frequency: 'Bi-weekly',
    lastGenerated: '2024-02-05',
    icon: DollarSign
  },
  {
    id: 3,
    name: 'Client Billing Report',
    description: 'Client-wise billing and revenue analysis',
    category: 'Client',
    frequency: 'Monthly',
    lastGenerated: '2024-02-01',
    icon: BarChart3
  },
  {
    id: 4,
    name: 'Time-off Analysis',
    description: 'Employee time-off patterns and trends',
    category: 'HR',
    frequency: 'Quarterly',
    lastGenerated: '2024-01-01',
    icon: Calendar
  }
];

const quickStats = [
  {
    title: 'Total Revenue YTD',
    value: '$142,500',
    change: '+18%',
    trend: 'up'
  },
  {
    title: 'Employee Costs YTD',
    value: '$68,472',
    change: '+12%',
    trend: 'up'
  },
  {
    title: 'Profit Margin',
    value: '52%',
    change: '+3%',
    trend: 'up'
  },
  {
    title: 'Avg Revenue/Employee',
    value: '$5,937',
    change: '+8%',
    trend: 'up'
  }
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate insights and analytics for your business</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-4 w-4 mr-2" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">{stat.title}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className={`text-sm flex items-center ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stat.change} from last period
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Report Templates */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Standard Reports</h3>
          <Button variant="outline" size="sm">
            View All Templates
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTemplates.map((template) => (
            <div key={template.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <template.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Generated {template.frequency.toLowerCase()}</span>
                    <span>Last: {new Date(template.lastGenerated).toLocaleDateString()}</span>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Generate New
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          <div className="flex space-x-2">
            <select className="px-3 py-2 border border-gray-200 rounded-md text-sm">
              <option>Last 6 months</option>
              <option>Last year</option>
              <option>All time</option>
            </select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Chart Placeholder */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Revenue chart will be displayed here</p>
            <p className="text-sm text-gray-500 mt-1">Connect analytics service to view charts</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">CSV Export</h4>
            <p className="text-sm text-gray-600 mb-3">Export data for Excel/Sheets</p>
            <Button variant="outline" size="sm">Export CSV</Button>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">PDF Reports</h4>
            <p className="text-sm text-gray-600 mb-3">Formatted reports for sharing</p>
            <Button variant="outline" size="sm">Generate PDF</Button>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Dashboard Export</h4>
            <p className="text-sm text-gray-600 mb-3">Interactive dashboard view</p>
            <Button variant="outline" size="sm">Create Dashboard</Button>
          </div>
        </div>
      </div>
    </div>
  );
}