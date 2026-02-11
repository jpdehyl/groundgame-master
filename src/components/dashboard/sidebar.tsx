'use client';

import { useState, useEffect } from 'react';
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
  Upload,
  Menu,
  X
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-2 h-2 rounded-sm bg-accent-blue"></div>
            <div className="w-2 h-2 rounded-sm bg-accent-green"></div>
            <div className="w-2 h-2 rounded-sm bg-accent-yellow"></div>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">GroundGame</h1>
        </div>
        <button className="md:hidden p-1 hover:bg-white/5 rounded" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all',
                    isActive
                      ? 'bg-accent-blue/15 text-accent-blue'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-4 w-4 flex-shrink-0 transition-colors',
                      isActive ? 'text-accent-blue' : 'text-muted-foreground group-hover:text-white'
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
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          GroundGame v1.0
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 bg-sidebar border-r border-border flex-col shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-sidebar flex flex-col h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
