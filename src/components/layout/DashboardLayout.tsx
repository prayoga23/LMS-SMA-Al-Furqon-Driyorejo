'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { useRouter, usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRole?: 'admin' | 'parent';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  allowedRole,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user) {
      if (user.role === 'guru') {
        const guruBlockedRoutes = [
          '/admin/students',
          '/admin/teachers',
          '/admin/users',
          '/admin/payments',
          '/admin/allowances',
        ];
        if (
          !pathname.startsWith('/admin/teacher-attendance') &&
          guruBlockedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
        ) {
          router.push('/admin/dashboard');
          return;
        }
      }

      if (allowedRole) {
        const isStaffOrAdmin = ['admin', 'guru', 'staff'].includes(user.role);
        if (allowedRole === 'admin' && !isStaffOrAdmin) {
          router.push('/parent/dashboard');
        } else if (allowedRole === 'parent' && isStaffOrAdmin) {
          router.push('/admin/dashboard');
        }
      }
    }
  }, [user, loading, allowedRole, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Memuat Aplikasi...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-3.5 sm:p-5 md:p-8 pb-20 md:pb-8 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
