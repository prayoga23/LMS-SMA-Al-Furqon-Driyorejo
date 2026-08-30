'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  BookOpen,
  Wallet,
  GraduationCap,
  FileSpreadsheet,
  UserCheck,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isStaffOrAdmin = ['admin', 'guru', 'staff'].includes(user.role);

  const parentNav = [
    { label: 'Beranda', href: '/parent/dashboard', icon: Home },
    { label: 'SPP', href: '/parent/payments', icon: CreditCard },
    { label: 'Presensi', href: '/parent/attendance', icon: CalendarCheck },
    { label: 'Nilai', href: '/parent/grades', icon: BookOpen },
    { label: 'Uang Saku', href: '/parent/allowance', icon: Wallet },
  ];

  const adminNav = [
    { label: 'Beranda', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Siswa', href: '/admin/students', icon: Users },
    { label: 'SPP', href: '/admin/payments', icon: CreditCard },
    { label: 'Presensi', href: '/admin/attendance', icon: CalendarCheck },
    { label: 'Nilai', href: '/admin/grades', icon: FileSpreadsheet },
  ];

  const guruNav = [
    { label: 'Beranda', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Absen Guru', href: '/admin/teacher-attendance', icon: UserCheck },
    { label: 'Presensi Siswa', href: '/admin/attendance', icon: CalendarCheck },
    { label: 'Nilai', href: '/admin/grades', icon: FileSpreadsheet },
    { label: 'Info', href: '/admin/academics', icon: GraduationCap },
  ];

  const navItems = isStaffOrAdmin
    ? user?.role === 'guru'
      ? guruNav
      : adminNav
    : parentNav;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-emerald-100 px-2 py-1.5 flex items-center justify-around md:hidden shadow-lg shadow-emerald-900/10">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-emerald-700 font-extrabold scale-105'
                : 'text-slate-400 hover:text-emerald-600 font-medium'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-emerald-100/80 text-emerald-800 shadow-2xs' : 'bg-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
