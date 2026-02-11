'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EmployeeForm } from '@/components/forms/employee-form';
import {
  Plus,
  Search,
  Filter,
  Download,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  client: string;
  status: string;
  startDate: string;
  documentsStatus: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Record<string, string | number | null | undefined> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();
      if (result.success) {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEditEmployee = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      const result = await response.json();
      if (result.success) {
        setEditingEmployee(result.data);
        setShowForm(true);
      }
    } catch (error) {
      console.error('Failed to fetch employee details:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) {
      return;
    }

    setDeleting(employeeId);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        await fetchEmployees(); // Refresh the list
      } else {
        alert('Failed to deactivate employee: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Failed to deactivate employee');
    } finally {
      setDeleting(null);
    }
  };

  const handleSaveEmployee = async (formData: Record<string, string | number | null>) => {
    try {
      const url = editingEmployee
        ? `/api/employees/${editingEmployee.id}`
        : '/api/employees';

      const method = editingEmployee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setShowForm(false);
        setEditingEmployee(null);
        await fetchEmployees(); // Refresh the list
      } else {
        alert('Failed to save employee: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to save employee:', error);
      alert('Failed to save employee');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-muted-foreground">Manage your team members and contractors</p>
        </div>
        <Button
          onClick={handleAddEmployee}
          className="bg-accent-blue hover:bg-accent-blue/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input-border bg-input-bg rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50 placeholder:text-muted-foreground"
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
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="bg-card p-6 rounded-xl border border-border hover:shadow-lg hover:shadow-black/20 transition-shadow card-hover">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-accent-blue/15 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-accent-blue" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{employee.name}</h3>
                <p className="text-sm text-muted-foreground">{employee.role}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  employee.status === 'active'
                    ? 'bg-accent-green/15 text-accent-green'
                    : 'bg-white/10 text-muted-foreground'
                }`}>
                  {employee.status}
                </div>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="p-1 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle dropdown menu
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                {employee.email}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                {employee.phone}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Building2 className="h-4 w-4 mr-2" />
                {employee.client}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Started {new Date(employee.startDate).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Documents:</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  employee.documentsStatus === 'Complete'
                    ? 'bg-accent-green/15 text-accent-green'
                    : 'bg-accent-yellow/15 text-accent-yellow'
                }`}>
                  {employee.documentsStatus}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditEmployee(employee.id)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteEmployee(employee.id)}
                  disabled={deleting === employee.id}
                  className="text-accent-red border-accent-red/30 hover:bg-accent-red/10"
                >
                  {deleting === employee.id ? (
                    'Deleting...'
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && !loading && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {searchTerm ? 'No employees found' : 'No employees yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? `No employees match "${searchTerm}". Try adjusting your search.`
              : 'Get started by adding your first employee.'
            }
          </p>
          {!searchTerm && (
            <Button onClick={handleAddEmployee} className="bg-accent-blue hover:bg-accent-blue/90">
              <Plus className="h-4 w-4 mr-2" />
              Add First Employee
            </Button>
          )}
        </div>
      )}

      {/* Employee Form Modal */}
      <EmployeeForm
        employee={editingEmployee}
        onSave={handleSaveEmployee}
        onCancel={handleCancelForm}
        isOpen={showForm}
      />

      {/* Stats Footer */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{employees.length}</div>
            <div className="text-sm text-muted-foreground">Total Employees</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-green">
              {employees.filter(e => e.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-yellow">
              {employees.filter(e => e.documentsStatus !== 'Complete').length}
            </div>
            <div className="text-sm text-muted-foreground">Documents Due</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-blue">
              {employees.filter(e => {
                const startDate = new Date(e.startDate);
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                return startDate >= oneMonthAgo;
              }).length}
            </div>
            <div className="text-sm text-muted-foreground">New This Month</div>
          </div>
        </div>
      </div>
    </div>
  );
}
