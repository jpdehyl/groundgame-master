'use client';

import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="h-12 bg-background border-b border-border px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees, clients, or documents..."
            className="w-full pl-9 pr-4 py-1.5 bg-input-bg border border-input-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-md text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-accent-red rounded-full"></span>
        </button>
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
          <span className="text-[11px] font-semibold text-primary">A</span>
        </div>
      </div>
    </header>
  );
}
