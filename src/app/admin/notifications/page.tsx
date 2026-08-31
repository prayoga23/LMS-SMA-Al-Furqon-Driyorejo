'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { Bell, Send, Users, User, ShieldCheck, CheckCircle2, XCircle, Clock, History, AlertCircle } from 'lucide-react';

interface NotificationHistory {
  id: number;
  title: string;
  body: string;
  type: string;
  url?: string;
  createdAt: string;
  authorName: string;
  totalRecipients: number;
  sentCount: number;
  readCount: number;
  failedCount: number;
}

interface UserOption {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminNotificationsPage() {
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('ANNOUNCEMENT');
  const [targetType, setTargetType] = useState<'INDIVIDUAL' | 'ALL_PARENTS' | 'ALL_TEACHERS' | 'ALL_USERS'>('INDIVIDUAL');
  const [targetUserId, setTargetUserId] = useState('');
  const [url, setUrl] = useState('/parent/notifications');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [histRes, userRes] = await Promise.all([
        api.get('/admin/notifications'),
        api.get('/users'),
      ]);
      setHistory(histRes.data || []);
      setUsers(userRes.data || []);
    } catch (error: any) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!title.trim() || !body.trim()) {
      setStatusMessage({ type: 'error', text: 'Judul dan isi notifikasi wajib diisi.' });
      return;
    }

    if (targetType === 'INDIVIDUAL' && !targetUserId) {
      setStatusMessage({ type: 'error', text: 'Pilih pengguna tujuan untuk pengiriman individu.' });
      return;
    }

    try {
      setSending(true);
      const res = await api.post('/admin/notifications', {
        title,
        body,
        type,
        targetType,
        targetUserId: targetUserId ? Number(targetUserId) : undefined,
        url,
      });

      setStatusMessage({ type: 'success', text: res.data.message || 'Notifikasi berhasil dikirim!' });

      // Reset form
      setTitle('');
      setBody('');
      setTargetUserId('');

      // Refresh history
      fetchData();
    } catch (error: any) {
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.message || 'Gagal mengirim notifikasi.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Bell className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Pusat Notifikasi & Push FCM</h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                Kirim notifikasi langsung ke browser Web dan Android WebView App pengguna LMS.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Composer */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-emerald-100 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-emerald-100 pb-4">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Buat Notifikasi Baru</h3>
                <p className="text-xs text-slate-500">Tentukan sasaran dan isi pesan notifikasi</p>
              </div>
            </div>

            {statusMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Penerima
                </label>
                <select
                  value={targetType}
                  onChange={(e: any) => setTargetType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-white"
                >
                  <option value="INDIVIDUAL">Pengguna Individu</option>
                  <option value="ALL_PARENTS">Semua Orang Tua / Wali</option>
                  <option value="ALL_TEACHERS">Semua Guru</option>
                  <option value="ALL_USERS">Semua Pengguna Terdaftar</option>
                </select>
              </div>

              {targetType === 'INDIVIDUAL' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pilih Pengguna
                  </label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-white"
                  >
                    <option value="">-- Pilih User --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()}) - {u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jenis / Kategori
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-white"
                >
                  <option value="ANNOUNCEMENT">Pengumuman (ANNOUNCEMENT)</option>
                  <option value="GRADE">Nilai (GRADE)</option>
                  <option value="ATTENDANCE">Presensi (ATTENDANCE)</option>
                  <option value="SPP">SPP / Keuangan (SPP)</option>
                  <option value="SYSTEM">Sistem (SYSTEM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Judul Notifikasi
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Pengumuman Rapat Orang Tua"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Isi Pesan Notifikasi
                </label>
                <textarea
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Tuliskan detail pesan yang ingin disampaikan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tautan Tujuan (URL Deep Link)
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/parent/notifications"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim FCM...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim Push Notification
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-700" />
                Riwayat Pengiriman Notifikasi
              </h3>
              <span className="text-xs text-slate-500 font-semibold">{history.length} Record</span>
            </div>

            {loading ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-emerald-100">
                <div className="w-8 h-8 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500 mt-3">Memuat riwayat pengiriman...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-emerald-100">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">Belum ada riwayat notifikasi yang dikirim.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase border border-emerald-200">
                            {item.type}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">{item.body}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 flex-wrap gap-2">
                      <span>Pengirim: {item.authorName}</span>

                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {item.sentCount} Terkirim
                        </span>
                        <span className="inline-flex items-center gap-1 text-blue-700 font-bold">
                          <Users className="w-3.5 h-3.5" /> {item.readCount} Dibaca
                        </span>
                        {item.failedCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                            <XCircle className="w-3.5 h-3.5" /> {item.failedCount} Gagal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
