'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCog,
  CreditCard,
  CalendarCheck,
  FileSpreadsheet,
  Wallet,
  GraduationCap,
  Home,
  BookOpen,
  LogOut,
  X,
  Building2,
  BookMarked,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isStaffOrAdmin = ['admin', 'guru', 'staff'].includes(user?.role || '');

  const formatRoleName = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Admin Sekolah';
      case 'guru':
        return 'Guru';
      case 'staff':
        return 'Staff / TU';
      case 'parent':
        return 'Orang Tua';
      default:
        return role || 'Pengguna';
    }
  };

  const adminNav = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Data Siswa', href: '/admin/students', icon: Users },
    { label: 'Data Guru', href: '/admin/teachers', icon: Building2 },
    { label: 'Manajemen User', href: '/admin/users', icon: UserCog },
    { label: 'Pembayaran SPP', href: '/admin/payments', icon: CreditCard },
    { label: 'Presensi Siswa', href: '/admin/attendance', icon: CalendarCheck },
    { label: 'Rapor & Nilai', href: '/admin/grades', icon: FileSpreadsheet },
    { label: 'Uang Saku Siswa', href: '/admin/allowances', icon: Wallet },
    { label: 'Informasi Sekolah', href: '/admin/academics', icon: GraduationCap },
  ];

  const parentNav = [
    { label: 'Dashboard Orang Tua', href: '/parent/dashboard', icon: Home },
    { label: 'Pembayaran SPP', href: '/parent/payments', icon: CreditCard },
    { label: 'Presensi Siswa', href: '/parent/attendance', icon: CalendarCheck },
    { label: 'Nilai & Rapor', href: '/parent/grades', icon: BookOpen },
    { label: 'Uang Saku', href: '/parent/allowance', icon: Wallet },
    { label: 'Info Sekolah', href: '/parent/academics', icon: GraduationCap },
  ];

  const guruBlockedHrefs = [
    '/admin/students',
    '/admin/teachers',
    '/admin/users',
    '/admin/payments',
    '/admin/allowances',
  ];

  const navItems = isStaffOrAdmin
    ? user?.role === 'guru'
      ? adminNav.filter((item) => !guruBlockedHrefs.includes(item.href))
      : adminNav
    : parentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-emerald-100 transition-transform duration-300 ease-in-out flex flex-col shadow-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header Logo */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50/50 via-white to-white">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-sm border border-emerald-100 shrink-0">
              <img src="/logo.png" alt="Logo SMA AL - FURQON" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-xs block">SMA AL - FURQON</span>
              <span className="text-[10px] text-emerald-700 font-bold tracking-wider block uppercase">DRIYOREJO</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-1.5">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-800/70 mb-2.5">
            MENU UTAMA ({isStaffOrAdmin ? (user?.role === 'guru' ? 'GURU' : user?.role === 'staff' ? 'STAFF / TU' : 'ADMIN SEKOLAH') : 'ORANG TUA'})
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md shadow-emerald-700/20'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-700'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-emerald-100 bg-emerald-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold capitalize border border-emerald-200">
                  {formatRoleName(user?.role)}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
