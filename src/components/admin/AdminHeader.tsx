import React from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ShieldCheck, Package, LogOut, ExternalLink, User, Building2, KeyRound } from 'lucide-react';

export type AdminTab = 'packages' | 'founder' | 'office';

interface AdminHeaderProps {
  currentTab: AdminTab;
  onNavigateTab: (tab: AdminTab) => void;
  onNavigateHome: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTab,
  onNavigateTab,
  onNavigateHome,
}) => {
  const { user, logout, isLoading } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/admin/login';
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Admin Badge */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-2 text-left focus:outline-hidden group"
              title="Return to Public Website"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-xs group-hover:bg-orange-500 transition-colors">
                L
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  LEGOMARK INDIA
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    PORTAL
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Admin Control Center</div>
              </div>
            </button>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 pl-6 border-l border-slate-800">
              <button
                onClick={() => onNavigateTab('packages')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  currentTab === 'packages'
                    ? 'bg-slate-800 text-orange-400 border border-slate-700 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Packages</span>
              </button>

              <button
                onClick={() => onNavigateTab('founder')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  currentTab === 'founder'
                    ? 'bg-slate-800 text-orange-400 border border-slate-700 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Founder Profile</span>
              </button>

              <button
                onClick={() => onNavigateTab('office')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  currentTab === 'office'
                    ? 'bg-slate-800 text-orange-400 border border-slate-700 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Registered Office</span>
              </button>
            </nav>
          </div>

          {/* Right: User & Actions */}
          <div className="flex items-center space-x-3">
            {/* View Live Site Link */}
            <button
              onClick={onNavigateHome}
              className="hidden sm:flex items-center space-x-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded-md hover:bg-slate-800"
              title="View Public Website"
            >
              <span>View Site</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {/* User Profile Info */}
            {user && (
              <div className="flex items-center space-x-2 bg-slate-800/70 border border-slate-700/60 rounded-full py-1 px-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-medium">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <div className="font-medium text-slate-200 truncate max-w-[130px]">
                    {user.fullName || user.email}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{user.role}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Change Password Link */}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/admin/change-password');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hidden md:flex items-center space-x-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
              title="Change Account Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Password</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center space-x-1 text-xs font-medium bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-800/60 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
              title="Log out of Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

