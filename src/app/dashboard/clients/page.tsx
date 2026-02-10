import { Button } from '@/components/ui/button';
import { 
  Plus,
  Search,
  Filter,
  Download,
  Building2,
  Users,
  DollarSign,
  Calendar,
  ExternalLink
} from 'lucide-react';

const clients = [
  {
    id: 1,
    name: 'AppFolio',
    industry: 'Property Management Software',
    employees: 8,
    monthlyRate: '$15,600',
    status: 'Active',
    startDate: '2023-11-15',
    contact: 'Sarah Johnson',
    email: 'sarah@appfolio.com',
    phone: '+1 (805) 555-0123'
  },
  {
    id: 2,
    name: 'RentSpree',
    industry: 'Real Estate Technology',
    employees: 6,
    monthlyRate: '$12,000',
    status: 'Active',
    startDate: '2024-01-08',
    contact: 'Mike Chen',
    email: 'mike@rentspree.com',
    phone: '+1 (323) 555-0456'
  },
  {
    id: 3,
    name: 'PropertyRadar',
    industry: 'Real Estate Analytics',
    employees: 4,
    monthlyRate: '$8,800',
    status: 'Active',
    startDate: '2024-02-01',
    contact: 'Lisa Rodriguez',
    email: 'lisa@propertyradar.com',
    phone: '+1 (415) 555-0789'
  },
  {
    id: 4,
    name: 'TechCorp (Trial)',
    industry: 'SaaS Platform',
    employees: 2,
    monthlyRate: '$3,200',
    status: 'Trial',
    startDate: '2024-02-10',
    contact: 'David Kim',
    email: 'david@techcorp.com',
    phone: '+1 (555) 123-4567'
  }
];

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage client relationships and pricing</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
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

      {/* Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-600">{client.industry}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                client.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : client.status === 'Trial'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {client.status}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-600">Employees</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{client.employees}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-600">Monthly</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{client.monthlyRate}</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Primary Contact:</span>
                <span className="text-sm text-gray-600">{client.contact}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Email:</span>
                <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                  {client.email}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Phone:</span>
                <a href={`tel:${client.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                  {client.phone}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Start Date:</span>
                <span className="text-sm text-gray-600">
                  {new Date(client.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4 border-t border-gray-200">
              <Button variant="outline" size="sm" className="flex-1">
                View Details
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Users className="h-4 w-4 mr-1" />
                Employees
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">8</div>
            <div className="text-sm text-gray-600">Total Clients</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">7</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">20</div>
            <div className="text-sm text-gray-600">Assigned Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">$39,600</div>
            <div className="text-sm text-gray-600">Monthly Revenue</div>
          </div>
        </div>
      </div>
    </div>
  );
}