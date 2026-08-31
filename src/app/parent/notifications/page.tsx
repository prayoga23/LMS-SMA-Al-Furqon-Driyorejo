'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { Bell, CheckCheck, BookOpen, CalendarCheck, CreditCard, Megaphone, Info, ChevronRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationItem {
  id: number;
  recipientId: number;
  title: string;
  body: string;
  type: string;
  url?: string;
  imageUrl?: string;
  createdAt: string;
  status: string;
  readAt?: string;
  authorName: string;
}

export default function ParentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error('Gagal memuat notifikasi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Gagal menandai dibaca:', error);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    try {
      if (item.status !== 'READ') {
        await api.patch(`/notifications/${item.id}/read`);
      }
    } catch (err) {
      console.error(err);
    }

    if (item.url) {
      router.push(item.url);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'GRADE':
        return { label: 'Nilai', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: BookOpen };
      case 'ATTENDANCE':
        return { label: 'Presensi', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CalendarCheck };
      case 'SPP':
      case 'PAYMENT':
        return { label: 'SPP / Bayar', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: CreditCard };
      case 'ANNOUNCEMENT':
        return { label: 'Pengumuman', bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: Megaphone };
      default:
        return { label: 'Informasi', bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: Info };
    }
  };

  const filteredItems = notifications.filter((item) => {
    if (filter === 'UNREAD') return item.status !== 'READ';
    return true;
  });

  return (
    <DashboardLayout allowedRole="parent">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bell className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Pemberitahuan & Notifikasi</h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                  Informasi akademik, presensi, SPP, dan pengumuman untuk Orang Tua / Wali.
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-xs font-bold transition-all backdrop-blur-md shrink-0"
              >
                <CheckCheck className="w-4 h-4 text-emerald-200" />
                Tandai Semua Dibaca
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === 'ALL'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                  : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border border-emerald-100'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === 'UNREAD'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                  : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border border-emerald-100'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-emerald-100">
            <div className="w-8 h-8 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500 mt-3">Memuat riwayat notifikasi...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-emerald-100">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Tidak ada notifikasi</h3>
            <p className="text-xs text-slate-500 mt-1">
              {filter === 'UNREAD' ? 'Semua notifikasi telah Anda baca.' : 'Belum ada notifikasi baru untuk saat ini.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const badge = getTypeBadge(item.type);
              const BadgeIcon = badge.icon;
              const isUnread = item.status !== 'READ';

              return (
                <div
                  key={item.recipientId}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                    isUnread
                      ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/90 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-emerald-200 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg}`}
                    >
                      <BadgeIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {isUnread && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Baru
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {new Date(item.createdAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      <h4 className={`text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors ${isUnread ? 'font-extrabold' : 'font-bold'}`}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.body}</p>

                      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                        <span>Oleh: {item.authorName}</span>
                        {item.url && (
                          <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Buka Fitur <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
