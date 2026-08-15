import React, { useState, useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from '../../context/AdminAuthContext';
import { AdminHeader, AdminTab } from './AdminHeader';
import { AdminLogin } from './AdminLogin';
import { AdminChangePassword } from './AdminChangePassword';
import { AdminPackagesPage } from './AdminPackagesPage';
import { AdminFounderPage } from './AdminFounderPage';
import { AdminOfficePage } from './AdminOfficePage';
import { Loader2 } from 'lucide-react';

interface AdminPortalInnerProps {
  initialPath: string;
  onNavigateHome: () => void;
}

const AdminPortalInner: React.FC<AdminPortalInnerProps> = ({ initialPath, onNavigateHome }) => {
  const { user, isLoading, logout } = useAdminAuth();
  const [currentPath, setCurrentPath] = useState(initialPath);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine current active tab from pathname
  const getCurrentTab = (): AdminTab => {
    if (currentPath.includes('/admin/founder')) return 'founder';
    if (currentPath.includes('/admin/office')) return 'office';
    return 'packages';
  };

  // If initial auth check is ongoing, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
        <p className="text-xs font-medium">Authenticating Admin Session...</p>
      </div>
    );
  }

  // If not authenticated and on admin route, show Login
  if (!user) {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          navigateTo('/admin/packages');
        }}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  // If authenticated and user must change password (forced first-login change)
  if (user.mustChangePassword) {
    return (
      <AdminChangePassword
        onPasswordChanged={() => {
          navigateTo('/admin/packages');
        }}
        onLogout={logout}
      />
    );
  }

  // If user navigated directly to /admin/change-password voluntarily
  if (currentPath === '/admin/change-password') {
    return (
      <AdminChangePassword
        onPasswordChanged={() => {
          navigateTo('/admin/packages');
        }}
        onLogout={logout}
      />
    );
  }

  // If authenticated but on /admin/login, automatically redirect to /admin/packages
  if (currentPath === '/admin/login') {
    window.history.replaceState({}, '', '/admin/packages');
  }

  const activeTab = getCurrentTab();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <AdminHeader
        currentTab={activeTab}
        onNavigateTab={(tab) => {
          if (tab === 'packages') {
            navigateTo('/admin/packages');
          } else if (tab === 'founder') {
            navigateTo('/admin/founder');
          } else if (tab === 'office') {
            navigateTo('/admin/office');
          }
        }}
        onNavigateHome={onNavigateHome}
      />
      <main className="flex-1">
        {activeTab === 'packages' && <AdminPackagesPage />}
        {activeTab === 'founder' && <AdminFounderPage />}
        {activeTab === 'office' && <AdminOfficePage />}
      </main>
    </div>
  );
};

export const AdminPortal: React.FC<{ initialPath: string; onNavigateHome: () => void }> = ({
  initialPath,
  onNavigateHome,
}) => {
  return (
    <AdminAuthProvider>
      <AdminPortalInner initialPath={initialPath} onNavigateHome={onNavigateHome} />
    </AdminAuthProvider>
  );
};

