'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationManager } from '@/components/notifications/NotificationManager';
import { api } from '@/lib/api';
import { Menu, Bell, User as UserIcon, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  onToggleSidebar: () => void;
}

interface QuickNotification {
  id: number;
  title: string;
  body: string;
  type: string;
  status: string;
  createdAt: string;
  url?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<QuickNotification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchUnread = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications?limit=5');
      setNotifications(res.data.notifications || []);
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

  const historyLink = ['admin', 'staff'].includes(user?.role || '')
    ? '/admin/notifications'
    : '/parent/notifications';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-emerald-100 px-4 md:px-8 flex items-center justify-between shadow-xs">
      <NotificationManager />

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition-colors md:hidden"
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

      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-xl text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors relative"
            title="Notifikasi"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-emerald-100 z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-700" /> Notifikasi Terbaru
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Belum ada notifikasi.</p>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.url || historyLink}
                        onClick={() => setShowDropdown(false)}
                        className={`block p-3 rounded-xl transition-all ${
                          n.status !== 'READ'
                            ? 'bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-50'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-bold text-slate-900 truncate">{n.title}</h5>
                          <span className="text-[9px] text-slate-400 shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.body}</p>
                      </Link>
                    ))
                  )}
                </div>

                <Link
                  href={historyLink}
                  onClick={() => setShowDropdown(false)}
                  className="block text-center text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  Lihat Semua Notifikasi <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-500 leading-tight">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
