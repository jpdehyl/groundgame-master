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
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* Search Bar */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees, clients, or documents..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
        </Button>

        {/* User Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center space-x-2 hover:bg-gray-50"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-900">Admin User</div>
              <div className="text-xs text-gray-500">admin@groundgame.com</div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </Button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
              <a
                href="#"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="mr-3 h-4 w-4" />
                Profile
              </a>
              <a
                href="#"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </a>
              <hr className="my-1 border-gray-200" />
              <a
                href="#"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
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