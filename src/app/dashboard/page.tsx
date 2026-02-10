import { 
  Users,
  Building2,
  DollarSign,
  FileCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const stats = [
  {
    name: 'Total Employees',
    value: '24',
    change: '+3 this month',
    changeType: 'increase',
    icon: Users,
    color: 'bg-blue-500'
  },
  {
    name: 'Active Clients',
    value: '8',
    change: '+1 this month', 
    changeType: 'increase',
    icon: Building2,
    color: 'bg-green-500'
  },
  {
    name: 'Monthly Payroll',
    value: '$48,250',
    change: '+12% from last month',
    changeType: 'increase', 
    icon: DollarSign,
    color: 'bg-yellow-500'
  },
  {
    name: 'Pending Documents',
    value: '3',
    change: 'W-8BEN renewals due',
    changeType: 'neutral',
    icon: FileCheck,
    color: 'bg-red-500'
  }
];

const recentActivities = [
  {
    id: 1,
    type: 'employee_added',
    description: 'Maria Rodriguez added to AppFolio role',
    time: '2 hours ago',
    user: 'Admin'
  },
  {
    id: 2,
    type: 'payroll_processed',
    description: 'Bi-weekly payroll processed for 24 employees',
    time: '1 day ago',
    user: 'System'
  },
  {
    id: 3,
    type: 'document_expiring',
    description: 'W-8BEN document expiring for John Smith',
    time: '2 days ago',
    user: 'System'
  }
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your team.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className={`p-2 rounded-md ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'increase' ? 'text-green-600' : 
                  stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-800">View all</a>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.time} • {activity.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/dashboard/employees"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Add New Employee</span>
              </div>
              <span className="text-xs text-gray-500">→</span>
            </a>
            <a
              href="/dashboard/payroll"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Process Payroll</span>
              </div>
              <span className="text-xs text-gray-500">→</span>
            </a>
            <a
              href="/dashboard/reports"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-gray-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Generate Reports</span>
              </div>
              <span className="text-xs text-gray-500">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Attention Required</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div>
              <p className="text-sm font-medium text-amber-800">3 W-8BEN documents expiring soon</p>
              <p className="text-xs text-amber-600">Review and renew before tax season</p>
            </div>
            <a href="/dashboard/documents" className="text-sm font-medium text-amber-700 hover:text-amber-800">
              Review →
            </a>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div>
              <p className="text-sm font-medium text-blue-800">Payroll due in 3 days</p>
              <p className="text-xs text-blue-600">Next pay period ends Friday</p>
            </div>
            <a href="/dashboard/payroll" className="text-sm font-medium text-blue-700 hover:text-blue-800">
              Process →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}