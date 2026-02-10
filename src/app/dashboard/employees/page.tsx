import { Button } from '@/components/ui/button';
import { 
  Plus,
  Search,
  Filter,
  Download,
  User,
  Phone,
  Mail,
  Building2,
  Calendar
} from 'lucide-react';

const employees = [
  {
    id: 1,
    name: 'Maria Rodriguez',
    email: 'maria@example.com',
    phone: '+1 (555) 123-4567',
    role: 'AppFolio SDR',
    client: 'AppFolio',
    status: 'Active',
    startDate: '2024-01-15',
    documentsStatus: 'Complete'
  },
  {
    id: 2,
    name: 'John Smith',
    email: 'john@example.com', 
    phone: '+1 (555) 987-6543',
    role: 'Lead Generation',
    client: 'Multiple',
    status: 'Active',
    startDate: '2024-02-01',
    documentsStatus: 'W-8BEN Expiring'
  },
  {
    id: 3,
    name: 'Ana Garcia',
    email: 'ana@example.com',
    phone: '+1 (555) 456-7890',
    role: 'Data Entry',
    client: 'RentSpree',
    status: 'Active', 
    startDate: '2024-01-10',
    documentsStatus: 'Complete'
  }
];

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage your team members and contractors</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                <p className="text-sm text-gray-600">{employee.role}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                employee.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.status}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {employee.email}
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {employee.phone}
              </div>
              <div className="flex items-center text-gray-600">
                <Building2 className="h-4 w-4 mr-2" />
                {employee.client}
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                Started {new Date(employee.startDate).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Documents:</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  employee.documentsStatus === 'Complete' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {employee.documentsStatus}
                </span>
              </div>
              <div className="mt-3 flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">24</div>
            <div className="text-sm text-gray-600">Total Employees</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">22</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">3</div>
            <div className="text-sm text-gray-600">Documents Due</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">5</div>
            <div className="text-sm text-gray-600">New This Month</div>
          </div>
        </div>
      </div>
    </div>
  );
}