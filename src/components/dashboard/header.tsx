'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';

export function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-background/95 backdrop-blur-md border-b border-border px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search Bar */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees, clients, or documents..."
            className="w-full pl-10 pr-4 py-2 bg-input-bg border border-input-border rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue/50 transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-accent-red rounded-full animate-pulse-glow"></span>
        </button>

        <div className="relative">
          <button
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="h-8 w-8 bg-accent-blue rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-white">Admin User</div>
              <div className="text-xs text-muted-foreground">admin@groundgame.com</div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-border py-1 z-50">
              <a href="#" className="flex items-center px-4 py-2.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                <User className="mr-3 h-4 w-4" />
                Profile
              </a>
              <a href="/dashboard/settings" className="flex items-center px-4 py-2.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </a>
              <hr className="my-1 border-border" />
              <a href="#" className="flex items-center px-4 py-2.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}