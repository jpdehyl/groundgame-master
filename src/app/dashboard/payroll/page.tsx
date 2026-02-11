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
          <h1 className="text-2xl font-bold text-white">Payroll</h1>
          <p className="text-muted-foreground">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payroll</h1>
          <p className="text-muted-foreground">Manage bi-weekly payroll and employee payments</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="bg-accent-blue hover:bg-accent-blue/90">
            <Calculator className="h-4 w-4 mr-2" />
            Process Payroll
          </Button>
        </div>
      </div>

      {/* Current Stats */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 bg-accent-blue/15 rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5 text-accent-blue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Payroll Overview</h3>
            <p className="text-sm text-muted-foreground">{stats.totalEmployees} active employees</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Employees</div>
                <div className="text-2xl font-bold text-white">{stats.totalEmployees}</div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
                <div className="text-2xl font-bold text-white">{stats.totalHours || '-'}</div>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Base Pay</div>
                <div className="text-2xl font-bold text-white">${stats.basePay.toLocaleString() || '0'}</div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Bonuses/SPIF</div>
                <div className="text-2xl font-bold text-accent-green">${stats.bonuses.toLocaleString() || '0'}</div>
              </div>
              <DollarSign className="h-8 w-8 text-accent-green" />
            </div>
          </div>
        </div>
      </div>

      {/* Pay Period History */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <h3 className="text-lg font-semibold text-white mb-4">Pay Period History</h3>
        <div className="space-y-4">
          {payPeriods.map((period) => (
            <div key={period.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  period.processed
                    ? 'bg-accent-green/15'
                    : 'bg-accent-blue/15'
                }`}>
                  {period.processed ? (
                    <CheckCircle className="h-5 w-5 text-accent-green" />
                  ) : (
                    <Clock className="h-5 w-5 text-accent-blue" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-white">{period.period}</div>
                  <div className="text-sm text-muted-foreground">
                    {period.employees} employees • Due {new Date(period.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold text-white">{period.totalAmount}</div>
                  <div className={`text-sm ${
                    period.status === 'Completed'
                      ? 'text-accent-green'
                      : 'text-accent-blue'
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
        <div className="bg-card p-8 rounded-xl border border-border text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No pay periods yet</h3>
          <p className="text-muted-foreground">Pay period data will appear here once payroll is processed.</p>
        </div>
      )}
    </div>
  );
}
