import { Button } from '@/components/ui/button';
import { 
  Plus,
  Download,
  Calculator,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const payPeriods = [
  {
    id: 1,
    period: 'Jan 29 - Feb 11, 2024',
    status: 'Processing',
    employees: 24,
    totalAmount: '$24,125.50',
    dueDate: '2024-02-14',
    processed: false
  },
  {
    id: 2,
    period: 'Jan 15 - Jan 28, 2024', 
    status: 'Completed',
    employees: 23,
    totalAmount: '$22,890.75',
    dueDate: '2024-01-31',
    processed: true
  },
  {
    id: 3,
    period: 'Jan 1 - Jan 14, 2024',
    status: 'Completed', 
    employees: 22,
    totalAmount: '$21,456.25',
    dueDate: '2024-01-17',
    processed: true
  }
];

const pendingItems = [
  {
    id: 1,
    type: 'timesheet_missing',
    employee: 'Maria Rodriguez',
    description: 'Missing timesheet for current pay period',
    priority: 'high'
  },
  {
    id: 2,
    type: 'bonus_pending',
    employee: 'John Smith',
    description: 'Lead bonus for AppFolio campaign ($250)',
    priority: 'medium'
  },
  {
    id: 3,
    type: 'document_required',
    employee: 'Ana Garcia',
    description: 'W-8BEN renewal required for payment',
    priority: 'high'
  }
];

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600">Manage bi-weekly payroll and employee payments</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Calculator className="h-4 w-4 mr-2" />
            Process Payroll
          </Button>
        </div>
      </div>

      {/* Current Pay Period Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Current Pay Period</h3>
              <p className="text-sm text-gray-600">January 29 - February 11, 2024</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Payment Due</div>
            <div className="text-lg font-semibold text-red-600">February 14, 2024</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Employees</div>
                <div className="text-2xl font-bold text-gray-900">24</div>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Hours</div>
                <div className="text-2xl font-bold text-gray-900">832</div>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Base Pay</div>
                <div className="text-2xl font-bold text-gray-900">$22,400</div>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Bonuses/SPIF</div>
                <div className="text-2xl font-bold text-green-600">$1,725</div>
              </div>
              <Plus className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Items Requiring Attention</h3>
          </div>
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.id} className={`p-4 rounded-lg border ${
                item.priority === 'high' 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{item.employee}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.priority === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.priority}
                    </span>
                    <Button variant="outline" size="sm">
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay Period History */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pay Period History</h3>
        <div className="space-y-4">
          {payPeriods.map((period) => (
            <div key={period.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  period.processed 
                    ? 'bg-green-100' 
                    : 'bg-blue-100'
                }`}>
                  {period.processed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{period.period}</div>
                  <div className="text-sm text-gray-600">
                    {period.employees} employees • Due {new Date(period.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{period.totalAmount}</div>
                  <div className={`text-sm ${
                    period.status === 'Completed' 
                      ? 'text-green-600' 
                      : 'text-blue-600'
                  }`}>
                    {period.status}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  {period.processed && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">YTD Total Payroll</div>
              <div className="text-2xl font-bold text-gray-900">$68,472.50</div>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Average per Employee</div>
              <div className="text-2xl font-bold text-gray-900">$1,005</div>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Bonus Payments</div>
              <div className="text-2xl font-bold text-gray-900">$4,875</div>
            </div>
            <Plus className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );
}