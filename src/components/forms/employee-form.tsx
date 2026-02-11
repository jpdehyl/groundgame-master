'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  hourly_rate: number;
}

interface EmployeeFormProps {
  employee?: Record<string, string | number | null | undefined> | null;
  onSave: (data: Record<string, string | number | null>) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function EmployeeForm({ employee, onSave, onCancel, isOpen }: EmployeeFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    client_id: '',
    role_id: '',
    employment_type: 'contractor',
    start_date: '',
    salary_compensation: '',
    pay_frequency: 'biweekly',
    status: 'active',
    internet_speed_up: '',
    internet_speed_down: '',
    computer_specs: '',
    work_location: '',
    time_zone: '',
    preferred_work_hours: ''
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load clients and roles on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [clientsRes, rolesRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/roles')
        ]);

        const clientsData = await clientsRes.json();
        const rolesData = await rolesRes.json();

        if (clientsData.success) setClients(clientsData.data);
        if (rolesData.success) setRoles(rolesData.data);
      } catch (error) {
        console.error('Failed to load form data:', error);
      }
    }

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: String(employee.first_name ?? ''),
        last_name: String(employee.last_name ?? ''),
        email: String(employee.email ?? ''),
        phone: String(employee.phone ?? ''),
        client_id: String(employee.client_id ?? ''),
        role_id: String(employee.role_id ?? ''),
        employment_type: String(employee.employment_type ?? 'contractor'),
        start_date: String(employee.start_date ?? ''),
        salary_compensation: employee.salary_compensation != null ? String(employee.salary_compensation) : '',
        pay_frequency: String(employee.pay_frequency ?? 'biweekly'),
        status: String(employee.status ?? 'active'),
        internet_speed_up: employee.internet_speed_up != null ? String(employee.internet_speed_up) : '',
        internet_speed_down: employee.internet_speed_down != null ? String(employee.internet_speed_down) : '',
        computer_specs: String(employee.computer_specs ?? ''),
        work_location: String(employee.work_location ?? ''),
        time_zone: String(employee.time_zone ?? ''),
        preferred_work_hours: String(employee.preferred_work_hours ?? '')
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.client_id) newErrors.client_id = 'Client is required';
    if (!formData.role_id) newErrors.role_id = 'Role is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Salary validation
    if (formData.salary_compensation && isNaN(Number(formData.salary_compensation))) {
      newErrors.salary_compensation = 'Salary must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Convert string numbers to actual numbers
      const processedData = {
        ...formData,
        salary_compensation: formData.salary_compensation ? Number(formData.salary_compensation) : null,
        internet_speed_up: formData.internet_speed_up ? Number(formData.internet_speed_up) : null,
        internet_speed_down: formData.internet_speed_down ? Number(formData.internet_speed_down) : null,
      };

      await onSave(processedData);
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-lg shadow-black/40 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-white">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/5 rounded-md"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.first_name ? 'border-accent-red/20' : 'border-input-border'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-accent-red">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.last_name ? 'border-accent-red/20' : 'border-input-border'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-accent-red">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.email ? 'border-accent-red/20' : 'border-input-border'
                  }`}
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-accent-red">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="+1-555-123-4567"
                />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Client *
                </label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.client_id ? 'border-accent-red/20' : 'border-input-border'
                  }`}
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.client_id && (
                  <p className="mt-1 text-sm text-accent-red">{errors.client_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Role *
                </label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.role_id ? 'border-accent-red/20' : 'border-input-border'
                  }`}
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} (${role.hourly_rate}/hr)
                    </option>
                  ))}
                </select>
                {errors.role_id && (
                  <p className="mt-1 text-sm text-accent-red">{errors.role_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Employment Type
                </label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="contractor">Contractor</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.start_date ? 'border-accent-red/20' : 'border-input-border'
                  }`}
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-accent-red">{errors.start_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  name="salary_compensation"
                  value={formData.salary_compensation}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.salary_compensation ? 'border-accent-red/20' : 'border-input-border'
                  }`}
                  placeholder="25.00"
                />
                {errors.salary_compensation && (
                  <p className="mt-1 text-sm text-accent-red">{errors.salary_compensation}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Pay Frequency
                </label>
                <select
                  name="pay_frequency"
                  value={formData.pay_frequency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Technical Information */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Technical Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Internet Speed Up (Mbps)
                </label>
                <input
                  type="number"
                  name="internet_speed_up"
                  value={formData.internet_speed_up}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Internet Speed Down (Mbps)
                </label>
                <input
                  type="number"
                  name="internet_speed_down"
                  value={formData.internet_speed_down}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Computer Specifications
                </label>
                <textarea
                  name="computer_specs"
                  value={formData.computer_specs}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="MacBook Pro M1, 16GB RAM, 512GB SSD..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Work Location
                </label>
                <input
                  type="text"
                  name="work_location"
                  value={formData.work_location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Remote - Mexico City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Time Zone
                </label>
                <input
                  type="text"
                  name="time_zone"
                  value={formData.time_zone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="CST (UTC-6)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Preferred Work Hours
                </label>
                <input
                  type="text"
                  name="preferred_work_hours"
                  value={formData.preferred_work_hours}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input-border rounded-md text-sm bg-input-bg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="9:00 AM - 5:00 PM CST"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-hover"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {employee ? 'Update Employee' : 'Add Employee'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
