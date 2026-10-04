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
                className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-2xs"
                onClick={() => setShowDropdown(false)}
              />
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-white rounded-2xl shadow-2xl border border-emerald-100 z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5 shrink-0">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-700" /> Notifikasi Terbaru
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>

                <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 max-h-72">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Belum ada notifikasi.</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isUnread = n.status !== 'READ';
                      return (
                        <Link
                          key={n.id}
                          href={n.url || historyLink}
                          onClick={() => setShowDropdown(false)}
                          className={`block p-3 rounded-xl transition-all border ${
                            isUnread
                              ? 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/60 shadow-2xs'
                              : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 uppercase">
                                {n.type}
                              </span>
                              {isUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {new Date(n.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                          <h5 className={`text-xs tracking-tight ${isUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-800'}`}>
                            {n.title}
                          </h5>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                            {n.body}
                          </p>
                        </Link>
                      );
                    })
                  )}
                </div>

                <Link
                  href={historyLink}
                  onClick={() => setShowDropdown(false)}
                  className="block text-center text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 py-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1 border border-emerald-100"
                >
                  Buka Semua Notifikasi <ChevronRight className="w-3.5 h-3.5" />
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
