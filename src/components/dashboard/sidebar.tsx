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
  LayoutDashboard,
  Upload,
  Menu,
  X
} from 'lucide-react';

const mainNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Employees', href: '/dashboard/employees', icon: Users },
  { name: 'Clients', href: '/dashboard/clients', icon: Building2 },
  { name: 'Payroll', href: '/dashboard/payroll', icon: DollarSign },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Time Off', href: '/dashboard/time-off', icon: Calendar },
];

const secondaryNav = [
  { name: 'Import Data', href: '/dashboard/import', icon: Upload },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLink = (item: { name: string; href: string; icon: typeof Users }) => {
    const isActive = pathname === item.href;
    return (
      <li key={item.name}>
        <Link
          href={item.href}
          className={cn(
            'group flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-md transition-all duration-150 relative',
            isActive
              ? 'bg-sidebar-active-bg text-white'
              : 'text-sidebar-text hover:text-white hover:bg-sidebar-hover'
          )}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-active-border" />
          )}
          <item.icon
            className={cn(
              'h-[18px] w-[18px] flex-shrink-0 transition-colors',
              isActive ? 'text-accent-blue' : 'text-sidebar-text group-hover:text-white'
            )}
          />
          {item.name}
        </Link>
      </li>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="h-14 flex items-center px-5 border-b border-sidebar-border justify-between shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">G</span>
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">GroundGame</span>
        </Link>
        <button className="md:hidden p-1 hover:bg-white/10 rounded" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5 text-sidebar-text" />
        </button>
      </div>

      <nav className="flex-1 mt-4 px-3 overflow-y-auto">
        <div className="mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/50">Main Menu</span>
        </div>
        <ul className="space-y-0.5">
          {mainNav.map(navLink)}
        </ul>
        <div className="mt-6 mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/50">Preferences</span>
        </div>
        <ul className="space-y-0.5">
          {secondaryNav.map(navLink)}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">GG</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-white truncate">GroundGame</p>
            <p className="text-[11px] text-sidebar-text">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-card border border-border rounded-lg"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      <div className="hidden md:flex w-56 bg-sidebar-bg border-r border-sidebar-border flex-col shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-56 bg-sidebar-bg flex flex-col h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
