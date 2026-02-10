import { Button } from '@/components/ui/button';
import { 
  Plus,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Clock3
} from 'lucide-react';

const timeOffRequests = [
  {
    id: 1,
    employee: 'Maria Rodriguez',
    type: 'Vacation',
    startDate: '2024-02-20',
    endDate: '2024-02-22',
    days: 3,
    status: 'Pending',
    reason: 'Family vacation',
    requestDate: '2024-02-05'
  },
  {
    id: 2,
    employee: 'John Smith',
    type: 'Sick Leave',
    startDate: '2024-02-15',
    endDate: '2024-02-15',
    days: 1,
    status: 'Approved',
    reason: 'Medical appointment',
    requestDate: '2024-02-14'
  },
  {
    id: 3,
    employee: 'Ana Garcia',
    type: 'Personal',
    startDate: '2024-02-25',
    endDate: '2024-02-26',
    days: 2,
    status: 'Approved',
    reason: 'Personal matters',
    requestDate: '2024-02-01'
  }
];

const upcomingTimeOff = [
  {
    employee: 'John Smith',
    type: 'Sick Leave',
    date: '2024-02-15',
    status: 'Today'
  },
  {
    employee: 'Ana Garcia', 
    type: 'Personal',
    date: '2024-02-25',
    status: 'In 15 days'
  },
  {
    employee: 'Maria Rodriguez',
    type: 'Vacation',
    date: '2024-02-20',
    status: 'In 10 days'
  }
];

export default function TimeOffPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Off</h1>
          <p className="text-gray-600">Manage employee time-off requests and schedules</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Pending Requests</div>
              <div className="text-2xl font-bold text-yellow-600">1</div>
            </div>
            <Clock3 className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Approved This Month</div>
              <div className="text-2xl font-bold text-green-600">8</div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Days Off This Month</div>
              <div className="text-2xl font-bold text-blue-600">12</div>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Avg Days/Employee</div>
              <div className="text-2xl font-bold text-gray-900">1.8</div>
            </div>
            <User className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-4">
            {timeOffRequests.map((request) => (
              <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{request.employee}</div>
                    <div className="text-sm text-gray-600">{request.type}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    request.status === 'Pending' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : request.status === 'Approved'
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {request.status}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  <span className="ml-2 text-gray-500">({request.days} day{request.days > 1 ? 's' : ''})</span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <strong>Reason:</strong> {request.reason}
                </div>
                {request.status === 'Pending' && (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="text-green-600 border-green-300">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-300">
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Time Off */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Time Off</h3>
            <Button variant="outline" size="sm">Calendar View</Button>
          </div>
          <div className="space-y-3">
            {upcomingTimeOff.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-gray-900">{item.employee}</div>
                    <div className="text-sm text-gray-600">{item.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Integration Placeholder */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar Integration</h3>
        <p className="text-gray-600 mb-4">
          Connect with Google Calendar or Outlook to sync time-off schedules
        </p>
        <Button variant="outline">
          Setup Calendar Integration
        </Button>
      </div>
    </div>
  );
}