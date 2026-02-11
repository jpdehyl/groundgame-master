'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Users,
  Building2,
  DollarSign,
  FileText,
  Calendar,
  Settings,
  BarChart3,
  Home,
  Upload
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Employees', href: '/dashboard/employees', icon: Users },
  { name: 'Clients', href: '/dashboard/clients', icon: Building2 },
  { name: 'Payroll', href: '/dashboard/payroll', icon: DollarSign },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Time Off', href: '/dashboard/time-off', icon: Calendar },
  { name: 'Import Data', href: '/dashboard/import', icon: Upload },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">GroundGame</h1>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          GroundGame Master v1.0
        </div>
      </div>
    </div>
  );
}