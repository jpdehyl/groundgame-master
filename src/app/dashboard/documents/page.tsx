import { Button } from '@/components/ui/button';
import { 
  Upload,
  Search,
  FileText,
  AlertTriangle,
  Calendar,
  Download,
  Eye
} from 'lucide-react';

const documents = [
  {
    id: 1,
    employee: 'Maria Rodriguez',
    type: 'W-8BEN',
    status: 'Active',
    uploadDate: '2024-01-15',
    expiryDate: '2025-01-15',
    isExpiring: false
  },
  {
    id: 2,
    employee: 'John Smith',
    type: 'W-8BEN',
    status: 'Expiring',
    uploadDate: '2023-02-20',
    expiryDate: '2024-02-20',
    isExpiring: true
  },
  {
    id: 3,
    employee: 'Ana Garcia',
    type: 'Contract',
    status: 'Active',
    uploadDate: '2024-01-10',
    expiryDate: null,
    isExpiring: false
  }
];

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage employee documents and compliance</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents or employees..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Types</option>
            <option value="w8ben">W-8BEN</option>
            <option value="contract">Contract</option>
            <option value="id">ID Document</option>
          </select>
        </div>
      </div>

      {/* Expiring Documents Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-600 mr-3" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-amber-800">
              1 document expires within 30 days
            </h3>
            <p className="text-sm text-amber-700">
              Review and renew expiring W-8BEN documents to ensure compliance
            </p>
          </div>
          <Button variant="outline" size="sm" className="text-amber-700 border-amber-300">
            Review Now
          </Button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Documents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {doc.employee}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      {doc.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      doc.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : doc.status === 'Expiring'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doc.expiryDate ? (
                      <div className={`flex items-center ${doc.isExpiring ? 'text-yellow-600' : ''}`}>
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(doc.expiryDate).toLocaleDateString()}
                        {doc.isExpiring && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">47</div>
            <div className="text-sm text-gray-600">Total Documents</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">44</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">1</div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">2</div>
            <div className="text-sm text-gray-600">Missing</div>
          </div>
        </div>
      </div>
    </div>
  );
}