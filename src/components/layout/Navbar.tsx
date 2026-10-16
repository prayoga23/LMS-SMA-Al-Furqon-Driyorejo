'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { NotificationManager } from '@/components/notifications/NotificationManager';
import { api } from '@/lib/api';
import { Menu, Bell, User as UserIcon, ChevronRight, X, CheckCheck } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const historyLink = ['admin', 'staff', 'guru'].includes(user?.role || '')
    ? '/admin/notifications'
    : '/parent/notifications';

  const handleToggleDropdown = () => {
    if (!showDropdown) {
      fetchUnread();
    }
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (n: QuickNotification) => {
    setShowDropdown(false);
    if (n.status !== 'READ') {
      try {
        await api.patch(`/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, status: 'READ' } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Ignore background error
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((item) => ({ ...item, status: 'READ' })));
      setUnreadCount(0);
    } catch {
      // Ignore background error
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'ATTENDANCE':
        return { label: 'Presensi', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'GRADE':
        return { label: 'Nilai', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'SPP':
      case 'PAYMENT':
        return { label: 'Keuangan', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'ANNOUNCEMENT':
        return { label: 'Pengumuman', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: type || 'Info', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const renderDropdownBody = () => (
    <>
      {/* Header Dropdown */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-100 bg-emerald-50/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Bell className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Notifikasi Terbaru
            </h4>
            {unreadCount > 0 ? (
              <span className="text-[10px] text-emerald-700 font-bold">
                {unreadCount} pesan belum dibaca
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">
                Semua notifikasi dibaca
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-2 py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/70 rounded-lg transition-colors flex items-center gap-1"
              title="Tandai semua telah dibaca"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tandai Dibaca</span>
            </button>
          )}
          <button
            onClick={() => setShowDropdown(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List Notifikasi */}
      <div className="p-3 space-y-2 overflow-y-auto flex-1 min-h-[160px] max-h-[58vh] sm:max-h-72 custom-scrollbar bg-white">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800">Belum ada notifikasi baru</p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px] mx-auto">
              Pemberitahuan akademik, nilai, dan absensi akan muncul di sini.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = n.status !== 'READ';
            const badge = getTypeBadge(n.type);

            return (
              <Link
                key={n.id}
                href={n.url || historyLink}
                onClick={() => handleNotificationClick(n)}
                className={`block p-3 rounded-xl transition-all border text-left ${
                  isUnread
                    ? 'bg-emerald-50/90 border-emerald-200 hover:bg-emerald-100/80 shadow-xs'
                    : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {new Date(n.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <h5
                  className={`text-xs tracking-tight line-clamp-1 ${
                    isUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-700'
                  }`}
                >
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

      {/* Footer */}
      <div className="p-2.5 border-t border-emerald-100 bg-slate-50 shrink-0">
        <Link
          href={historyLink}
          onClick={() => setShowDropdown(false)}
          className="w-full text-center text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200/80 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 border border-emerald-200"
        >
          Buka Semua Notifikasi <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </>
  );

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
            onClick={handleToggleDropdown}
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

          {/* Desktop Dropdown (>= sm) */}
          {showDropdown && (
            <div className="hidden sm:block">
              <div
                className="fixed inset-0 z-40 bg-slate-900/20"
                onClick={() => setShowDropdown(false)}
              />
              <div
                className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-emerald-100 z-50 flex flex-col overflow-hidden animate-fade-in"
                style={{ backgroundColor: '#ffffff' }}
              >
                {renderDropdownBody()}
              </div>
            </div>
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

      {/* Mobile Modal via Portal (< sm) - 100% immune to sticky header containment and APK WebView transparency glitch */}
      {showDropdown &&
        mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="sm:hidden">
            <div
              className="fixed inset-0 z-50 bg-slate-950/70 animate-fade-in"
              onClick={() => setShowDropdown(false)}
            />
            <div
              className="fixed inset-x-3.5 top-16 z-50 max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden animate-fade-in"
              style={{ backgroundColor: '#ffffff' }}
            >
              {renderDropdownBody()}
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
