'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Download,
  Calculator,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react';

interface PayPeriod {
  id: string;
  period: string;
  status: string;
  employees: number;
  totalAmount: string;
  dueDate: string;
  processed: boolean;
}

interface PayrollData {
  payPeriods: PayPeriod[];
  stats: {
    totalEmployees: number;
    totalHours: number;
    basePay: number;
    bonuses: number;
  };
}

export default function PayrollPage() {
  const [data, setData] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayroll() {
      try {
        const response = await fetch('/api/payroll');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch payroll:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayroll();
  }, []);

  const payPeriods = data?.payPeriods ?? [];
  const stats = data?.stats ?? { totalEmployees: 0, totalHours: 0, basePay: 0, bonuses: 0 };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    );
  }

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

      {/* Current Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payroll Overview</h3>
            <p className="text-sm text-gray-600">{stats.totalEmployees} active employees</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Employees</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</div>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Hours</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalHours || '-'}</div>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Base Pay</div>
                <div className="text-2xl font-bold text-gray-900">${stats.basePay.toLocaleString() || '0'}</div>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Bonuses/SPIF</div>
                <div className="text-2xl font-bold text-green-600">${stats.bonuses.toLocaleString() || '0'}</div>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

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

      {payPeriods.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pay periods yet</h3>
          <p className="text-gray-600">Pay period data will appear here once payroll is processed.</p>
        </div>
      )}
    </div>
  );
}