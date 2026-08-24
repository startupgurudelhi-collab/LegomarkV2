import React, { useState, useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from '../../context/AdminAuthContext';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar, AdminNavSection } from './AdminSidebar';
import { AdminDashboard } from './AdminDashboard';
import { AdminLogin } from './AdminLogin';
import { AdminChangePassword } from './AdminChangePassword';
import { AdminPackagesPage } from './AdminPackagesPage';
import { AdminServicesPage } from './AdminServicesPage';
import { AdminLeadsPage } from './AdminLeadsPage';
import { AdminWebsiteCMS } from './AdminWebsiteCMS';
import { AdminTestimonialsCMS } from './AdminTestimonialsCMS';
import { AdminMediaLibrary } from './AdminMediaLibrary';
import { AdminBlogCMS } from './AdminBlogCMS';
import { AdminWebsiteSettingsCMS } from './AdminWebsiteSettingsCMS';
import { AdminClientLogosCMS } from './AdminClientLogosCMS';
import { AdminPlaceholderView } from './AdminPlaceholderView';
import { AdminErrorBoundary } from './AdminErrorBoundary';
import { Loader2 } from 'lucide-react';

interface AdminPortalInnerProps {
  initialPath: string;
  onNavigateHome: () => void;
}

const AdminPortalInner: React.FC<AdminPortalInnerProps> = ({ initialPath, onNavigateHome }) => {
  const { user, isLoading, logout } = useAdminAuth();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  // Determine current active section from pathname
  const getCurrentSection = (): AdminNavSection => {
    if (currentPath.includes('/admin/packages')) return 'packages';
    if (
      currentPath.includes('/admin/client-logos') ||
      currentPath.includes('/admin/clientlogos') ||
      currentPath.includes('/admin/logos')
    ) {
      return 'client-logos';
    }
    if (
      currentPath.includes('/admin/website') ||
      currentPath.includes('/admin/founder') ||
      currentPath.includes('/admin/office') ||
      currentPath.includes('/admin/association') ||
      currentPath.includes('/admin/associations')
    ) {
      return 'website';
    }
    if (currentPath.includes('/admin/services')) return 'services';
    if (currentPath.includes('/admin/leads')) return 'leads';
    if (currentPath.includes('/admin/testimonials') || currentPath.includes('/admin/reviews')) {
      return 'testimonials';
    }
    if (currentPath.includes('/admin/media') || currentPath.includes('/admin/assets')) {
      return 'media';
    }
    if (currentPath.includes('/admin/blogs')) return 'blogs';
    if (currentPath.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  const handleNavigateSection = (section: AdminNavSection) => {
    const routeMap: Record<AdminNavSection, string> = {
      dashboard: '/admin/dashboard',
      website: '/admin/website',
      'client-logos': '/admin/client-logos',
      services: '/admin/services',
      packages: '/admin/packages',
      leads: '/admin/leads',
      testimonials: '/admin/testimonials',
      media: '/admin/media',
      blogs: '/admin/blogs',
      settings: '/admin/settings',
    };
    navigateTo(routeMap[section]);
  };

  // Loading indicator while validating session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
        <div className="text-sm font-semibold tracking-wide text-slate-200">
          Verifying LEGOMARK Admin Session...
        </div>
      </div>
    );
  }

  // If not authenticated, render the Enterprise Admin Login screen
  if (!user) {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          navigateTo('/admin/dashboard');
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
          navigateTo('/admin/dashboard');
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
          navigateTo('/admin/dashboard');
        }}
        onLogout={logout}
      />
    );
  }

  // If authenticated but on /admin/login, automatically redirect to /admin/dashboard
  if (currentPath === '/admin/login') {
    window.history.replaceState({}, '', '/admin/dashboard');
  }

  const activeSection = getCurrentSection();

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex">
      {/* 1. Sidebar Navigation */}
      <AdminSidebar
        currentSection={activeSection}
        onNavigateSection={handleNavigateSection}
        onNavigateHome={onNavigateHome}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        user={user}
      />

      {/* 2. Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Header Bar */}
        <AdminHeader
          currentSection={activeSection}
          onNavigateSection={handleNavigateSection}
          onNavigateHome={onNavigateHome}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Dynamic Section Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'dashboard' && (
            <AdminDashboard
              user={user}
              onNavigateSection={handleNavigateSection}
              onNavigateHome={onNavigateHome}
            />
          )}
          {activeSection === 'website' && (
            <AdminWebsiteCMS
              initialTab={
                currentPath.includes('association')
                  ? 'associations'
                  : currentPath.includes('office')
                  ? 'office'
                  : currentPath.includes('founder')
                  ? 'founder'
                  : currentPath.includes('company-logo')
                  ? 'company-logo'
                  : undefined
              }
            />
          )}
          {activeSection === 'client-logos' && <AdminClientLogosCMS />}
          {activeSection === 'services' && <AdminServicesPage />}
          {activeSection === 'packages' && <AdminPackagesPage />}
          {activeSection === 'leads' && <AdminLeadsPage />}
          {activeSection === 'testimonials' && <AdminTestimonialsCMS />}
          {activeSection === 'media' && <AdminMediaLibrary />}
          {activeSection === 'blogs' && <AdminBlogCMS />}
          {activeSection === 'settings' && (
            <AdminWebsiteSettingsCMS
              onNavigateToSection={(sec) => {
                if (sec === 'founder' || sec === 'office') {
                  handleNavigateSection('website');
                } else {
                  handleNavigateSection(sec as any);
                }
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export const AdminPortal: React.FC<{ initialPath: string; onNavigateHome: () => void }> = ({
  initialPath,
  onNavigateHome,
}) => {
  return (
    <AdminErrorBoundary onNavigateHome={onNavigateHome}>
      <AdminAuthProvider>
        <AdminPortalInner initialPath={initialPath} onNavigateHome={onNavigateHome} />
      </AdminAuthProvider>
    </AdminErrorBoundary>
  );
};
