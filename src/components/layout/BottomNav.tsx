'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
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
  QrCode,
  Bell,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications?limit=1');
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        // Silent fallback
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const isStaffOrAdmin = ['admin', 'guru', 'staff'].includes(user.role);

  const parentNav = [
    { label: 'Beranda', href: '/parent/dashboard', icon: Home },
    { label: 'Presensi', href: '/parent/attendance', icon: CalendarCheck },
    { label: 'Nilai', href: '/parent/grades', icon: BookOpen },
    { label: 'SPP', href: '/parent/payments', icon: CreditCard },
    { label: 'Notifikasi', href: '/parent/notifications', icon: Bell, hasBadge: unreadCount > 0 },
  ];

  const adminNav = [
    { label: 'Beranda', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Siswa', href: '/admin/students', icon: Users },
    { label: 'Presensi', href: '/admin/attendance', icon: CalendarCheck },
    { label: 'SPP', href: '/admin/payments', icon: CreditCard },
    { label: 'Notifikasi', href: '/admin/notifications', icon: Bell, hasBadge: unreadCount > 0 },
  ];

  const guruNav = [
    { label: 'Beranda', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'QR Presensi', href: '/admin/teacher-attendance', icon: QrCode },
    { label: 'Presensi Siswa', href: '/admin/attendance', icon: CalendarCheck },
    { label: 'Nilai', href: '/admin/grades', icon: FileSpreadsheet },
    { label: 'Notifikasi', href: '/admin/notifications', icon: Bell, hasBadge: unreadCount > 0 },
  ];

  const navItems = isStaffOrAdmin
    ? user?.role === 'guru'
      ? guruNav
      : adminNav
    : parentNav;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100 px-2 py-1.5 flex items-center justify-around md:hidden shadow-lg shadow-emerald-900/10">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        const showBadge = (item as any).hasBadge && unreadCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 relative ${
              isActive
                ? 'text-emerald-700 font-extrabold scale-105'
                : 'text-slate-400 hover:text-emerald-600 font-medium'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all relative ${
                isActive ? 'bg-emerald-100/80 text-emerald-800 shadow-2xs' : 'bg-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              {showBadge && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
