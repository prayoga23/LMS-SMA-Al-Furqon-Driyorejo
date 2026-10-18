'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationManager } from '@/components/notifications/NotificationManager';
import { api } from '@/lib/api';
import { Menu, Bell, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications?limit=1');
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // Ignore background fetch error
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const historyLink = ['admin', 'staff', 'guru'].includes(user?.role || '')
    ? '/admin/notifications'
    : '/parent/notifications';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-emerald-100 px-4 md:px-8 flex items-center justify-between shadow-xs">
      <NotificationManager />

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition-colors md:hidden"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/logo.png" alt="Logo SMA AL - FURQON" className="w-6 h-6 object-contain shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight truncate">
              SMA AL - FURQON DRIYOREJO
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block truncate">
              Portal Pemantauan Akademik & Karakter Siswa
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tombol Notifikasi Lonceng Dipojok Kanan Atas - Diarahkan ke halaman notifikasi */}
        <Link
          href={historyLink}
          className="p-2 rounded-xl text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all relative flex items-center justify-center group active:scale-95"
          title="Buka Halaman Notifikasi"
        >
          <Bell className="w-5 h-5 text-slate-700 group-hover:text-emerald-800 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile - Diarahkan ke Halaman Profile */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-emerald-50 transition-all group cursor-pointer active:scale-95 border border-transparent hover:border-emerald-100"
          title="Profile Pengguna"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs transition-colors shrink-0">
            <UserIcon className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="hidden md:block text-left max-w-[140px] lg:max-w-[180px]">
            <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-emerald-800 transition-colors truncate">
              {user?.name || 'Pengguna'}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight truncate">
              {user?.email}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
};
