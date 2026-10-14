'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  Bell,
  CheckCheck,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Megaphone,
  Info,
  ChevronRight,
  Check,
  Sparkles,
  Star,
  RefreshCw,
  Wallet,
  Clock,
  ExternalLink,
} from 'lucide-react';
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
  isImportant?: boolean;
}

type FilterOption = 'ALL' | 'IMPORTANT' | 'UNREAD' | 'ATTENDANCE' | 'GRADE' | 'SPP' | 'ANNOUNCEMENT';

export default function ParentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState<{ total: number; unread: number; important: number }>({
    total: 0,
    unread: 0,
    important: 0,
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const router = useRouter();

  const fetchNotifications = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get(`/notifications?limit=50&filter=${filter}`);
      setNotifications(res.data.notifications || []);
      if (res.data.counts) {
        setCounts(res.data.counts);
      } else {
        const notifs = res.data.notifications || [];
        setCounts({
          total: notifs.length,
          unread: res.data.unreadCount || 0,
          important: notifs.filter((n: any) => n.isImportant).length,
        });
      }

      if (filter === 'ALL') {
        try {
          localStorage.setItem('parent_notifs_cache', JSON.stringify(res.data));
        } catch (e) {}
      }
    } catch (error) {
      console.error('Gagal memuat notifikasi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'ALL') {
      try {
        const cached = localStorage.getItem('parent_notifs_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          setNotifications(parsed.notifications || []);
          if (parsed.counts) setCounts(parsed.counts);
          setLoading(false);
          fetchNotifications(true);
          return;
        }
      } catch (e) {}
    }
    fetchNotifications(false);
  }, [filter]);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ', readAt: new Date().toISOString() }))
      );
      setCounts((prev) => ({ ...prev, unread: 0 }));
    } catch (error) {
      console.error('Gagal menandai semua dibaca:', error);
    }
  };

  const handleMarkAsReadSingle = async (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${item.id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n
        )
      );
      setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (item.status !== 'READ') {
      try {
        await api.patch(`/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === item.id ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n
          )
        );
        setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      } catch (err) {
        console.error(err);
      }
    }

    if (item.url) {
      router.push(item.url);
    }
  };

  const handleSeedNotifications = async () => {
    try {
      setSeeding(true);
      await api.post('/notifications', { action: 'seed' });
      fetchNotifications();
    } catch (err) {
      console.error('Gagal memuat contoh notifikasi:', err);
    } finally {
      setSeeding(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'GRADE':
        return {
          label: 'Nilai & Rapor',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          iconBg: 'bg-indigo-600 text-white',
          icon: BookOpen,
        };
      case 'ATTENDANCE':
        return {
          label: 'Presensi',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-emerald-700 text-white',
          icon: CalendarCheck,
        };
      case 'SPP':
        return {
          label: 'Tagihan SPP',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          iconBg: 'bg-amber-600 text-white',
          icon: CreditCard,
        };
      case 'PAYMENT':
        return {
          label: 'Pembayaran Lunas',
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          iconBg: 'bg-teal-700 text-white',
          icon: CreditCard,
        };
      case 'ANNOUNCEMENT':
        return {
          label: 'Pengumuman Resmi',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          iconBg: 'bg-blue-600 text-white',
          icon: Megaphone,
        };
      default:
        return {
          label: 'Sistem & Info',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          iconBg: 'bg-slate-700 text-white',
          icon: Info,
        };
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMin < 2) return 'Baru saja';
      if (diffMin < 60) return `${diffMin} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays === 1) {
        return `Kemarin, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
      }
      return `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    } catch {
      return dateStr;
    }
  };

  return (
    <DashboardLayout allowedRole="parent">
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Page Header */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-900/10 border border-emerald-600/30">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                <Bell className="w-7 h-7 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-200 border border-emerald-500/30">
                    PUSAT INFORMASI
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                    SMA AL - FURQON
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Notifikasi & Informasi</h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                  Update otomatis kehadiran, nilai rapor, pembayaran SPP, dan pengumuman sekolah.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              <button
                onClick={() => fetchNotifications(false)}
                disabled={loading}
                className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all backdrop-blur-md shrink-0 flex items-center gap-1.5"
                title="Segarkan Notifikasi"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Segarkan</span>
              </button>

              {counts.unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl text-xs font-bold transition-all backdrop-blur-md shrink-0 shadow-sm active:scale-95"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-200" />
                  Tandai Semua Dibaca
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs space-y-2.5">
          {/* Primary View Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                filter === 'ALL'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <span>Semua Notifikasi</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === 'ALL' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {counts.total}
              </span>
            </button>

            <button
              onClick={() => setFilter('IMPORTANT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                filter === 'IMPORTANT'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-amber-50/70 text-amber-800 hover:bg-amber-100/70 border border-amber-200/60'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Penting Saja</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === 'IMPORTANT' ? 'bg-white/25 text-white' : 'bg-amber-200 text-amber-900'
                }`}
              >
                {counts.important}
              </span>
            </button>

            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                filter === 'UNREAD'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <span>Belum Dibaca</span>
              {counts.unread > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === 'UNREAD' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {counts.unread}
              </span>
            </button>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none text-[11px]">
            <span className="text-slate-400 font-bold shrink-0 mr-1 text-[10px] uppercase tracking-wider">
              Kategori:
            </span>
            <button
              onClick={() => setFilter('ATTENDANCE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1 border ${
                filter === 'ATTENDANCE'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <CalendarCheck className="w-3 h-3 text-emerald-700" />
              Presensi Siswa
            </button>
            <button
              onClick={() => setFilter('GRADE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1 border ${
                filter === 'GRADE'
                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <BookOpen className="w-3 h-3 text-indigo-700" />
              Nilai & Rapor
            </button>
            <button
              onClick={() => setFilter('SPP')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1 border ${
                filter === 'SPP'
                  ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
              }`}
            >
              <CreditCard className="w-3 h-3 text-amber-700" />
              SPP & Pembayaran
            </button>
            <button
              onClick={() => setFilter('ANNOUNCEMENT')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1 border ${
                filter === 'ANNOUNCEMENT'
                  ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              <Megaphone className="w-3 h-3 text-blue-700" />
              Pengumuman
            </button>
          </div>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-xs">
            <div className="w-9 h-9 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500 mt-4">Memuat riwayat notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Tidak ada notifikasi ditemukan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {filter === 'UNREAD'
                  ? 'Alhamdulillah, semua notifikasi telah selesai Anda baca.'
                  : filter === 'IMPORTANT'
                  ? 'Belum ada notifikasi dengan prioritas tinggi saat ini.'
                  : 'Belum ada notifikasi baru di kategori ini.'}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setFilter('ALL')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Lihat Semua
              </button>
              <button
                onClick={handleSeedNotifications}
                disabled={seeding}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {seeding ? 'Memuat...' : 'Muat Contoh Notifikasi Web App'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {notifications.map((item) => {
              const badge = getTypeBadge(item.type);
              const BadgeIcon = badge.icon;
              const isUnread = item.status !== 'READ';
              const isImportant =
                item.isImportant ||
                ['GRADE', 'SPP', 'PAYMENT', 'ATTENDANCE', 'ANNOUNCEMENT'].includes(item.type);

              return (
                <div
                  key={item.recipientId}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] ${
                    isUnread
                      ? 'bg-gradient-to-r from-emerald-50/80 via-white to-white border-emerald-300 shadow-sm hover:border-emerald-400 hover:shadow-md'
                      : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Category Icon */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${badge.iconBg}`}
                    >
                      <BadgeIcon className="w-5 h-5" />
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                      {/* Meta Badges */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>

                        {isImportant && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            <Star className="w-2.5 h-2.5 fill-current text-amber-600" />
                            Penting
                          </span>
                        )}

                        {isUnread && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Baru
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 ml-auto flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      {/* Title & Body */}
                      <h4
                        className={`text-sm tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors ${
                          isUnread ? 'font-extrabold text-slate-900' : 'font-bold'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.body}</p>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 gap-2 flex-wrap">
                        <span className="truncate">Oleh: <strong className="text-slate-600">{item.authorName}</strong></span>

                        <div className="flex items-center gap-2 ml-auto">
                          {isUnread && (
                            <button
                              onClick={(e) => handleMarkAsReadSingle(e, item)}
                              className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
                              title="Tandai sudah dibaca"
                            >
                              <Check className="w-3.5 h-3.5" /> Tandai Dibaca
                            </button>
                          )}

                          {item.url && (
                            <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-xs">
                              Buka Rincian <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
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
