'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import {
  Users,
  CreditCard,
  CalendarCheck,
  Award,
  TrendingUp,
  Clock,
  UserCheck,
  BookMarked,
  RefreshCw,
  Sparkles,
  Database,
  Loader2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface AdminDashboardData {
  total_students: number;
  total_parents: number;
  total_spp_paid: number;
  attendance_percentage: number;
  average_grade: number;
  spp_summary: {
    lunas: number;
    belum_lunas: number;
  };
  attendance_breakdown: {
    Hadir: number;
    Sakit: number;
    Izin: number;
    Alpha: number;
  };
  latest_payments: Array<{
    id: number;
    amount: number;
    status: string;
    semester: string;
    student?: { name: string; class: string };
  }>;
  latest_students: Array<{
    id: number;
    nis: string;
    name: string;
    class: string;
    parent?: { user?: { name: string } };
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    // 0ms Instant Rendering: Tampilkan data cache lokal jika tersedia
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('admin_dashboard_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed);
          setLoading(false);
        } catch (e) {}
      }
    }
    // Pembaruan data otomatis di background
    fetchDashboardData();
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchDashboardData = async (force = false) => {
    try {
      if (!data || force) setLoading(true);
      const res = await api.get('/admin/dashboard-stats' + (force ? '?refresh=true' : ''));
      setData(res.data);
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_dashboard_cache', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error(err);
      if (!data) showToast('error', 'Gagal memuat statistik dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      await api.post('/seed');
      showToast('success', 'Database berhasil di-reset ke akun role user default!');
      fetchDashboardData(true);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Gagal mereset data database');
    } finally {
      setSeeding(false);
    }
  };

  const sppPieData = [
    { name: 'Lunas', value: data?.spp_summary?.lunas || 0, color: '#10b981' },
    { name: 'Belum Lunas', value: data?.spp_summary?.belum_lunas || 0, color: '#f43f5e' },
  ];

  const attendanceBarData = [
    { status: 'Hadir', jumlah: data?.attendance_breakdown?.Hadir || 0, fill: '#10b981' },
    { status: 'Sakit', jumlah: data?.attendance_breakdown?.Sakit || 0, fill: '#f59e0b' },
    { status: 'Izin', jumlah: data?.attendance_breakdown?.Izin || 0, fill: '#0284c7' },
    { status: 'Alpha', jumlah: data?.attendance_breakdown?.Alpha || 0, fill: '#e11d48' },
  ];

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-8 animate-fade-in">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookMarked className="w-6 h-6 text-emerald-700" />
              Dashboard Admin SMA AL - FURQON DRIYOREJO
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Ringkasan statistik siswa, SPP, presensi, & grafik akademik</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Animasi Indikator Loading / Refreshing */}
            {loading && (
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-pulse">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Memuat Data & Grafik...</span>
              </div>
            )}

            <button
              onClick={() => fetchDashboardData(true)}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 transition-all hover:bg-emerald-50 shadow-xs"
              title="Segarkan Data Grafik"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <Clock className="w-4 h-4 text-emerald-700" />
              Tahun Ajaran: 2026/2027
            </div>
          </div>
        </div>

        {/* Banner Kosong jika database 0 siswa */}
        {!loading && data?.total_students === 0 && (
          <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Database Masih Kosong / Data 0</h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Semua data dummy telah dihapus. Klik tombol untuk memproses reset akun login (Admin, Guru, Staff, Orang Tua).
                </p>
              </div>
            </div>
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs shadow-sm transition-all hover:scale-105 shrink-0 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              {seeding ? 'Memproses...' : 'Reset Akun User'}
            </button>
          </div>
        )}

        {/* 5 Card KPI Overview */}
        {loading && !data ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-emerald-100 flex flex-col justify-between p-5">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-8 w-8 bg-slate-200 rounded-xl" />
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              title="Total Siswa"
              value={data?.total_students || 0}
              subtext="Siswa terdaftar"
              icon={Users}
              gradient="from-emerald-50 to-teal-50/50"
              iconBg="bg-emerald-700 text-white"
            />
            <StatCard
              title="Orang Tua Siswa"
              value={data?.total_parents || 0}
              subtext="Akun wali aktif"
              icon={UserCheck}
              gradient="from-teal-50 to-emerald-50/40"
              iconBg="bg-teal-700 text-white"
            />
            <StatCard
              title="Pembayaran SPP"
              value={`Rp ${(data?.total_spp_paid || 0).toLocaleString('id-ID')}`}
              subtext="Total dana lunas"
              icon={CreditCard}
              gradient="from-amber-50 to-orange-50/40"
              iconBg="bg-amber-600 text-white"
            />
            <StatCard
              title="Presensi Siswa"
              value={`${data?.attendance_percentage || 0}%`}
              subtext="Tingkat kehadiran"
              icon={CalendarCheck}
              gradient="from-sky-50 to-blue-50/40"
              iconBg="bg-sky-600 text-white"
            />
            <StatCard
              title="Rata-rata Nilai"
              value={data?.average_grade || 0}
              subtext="Prestasi Akademik"
              icon={Award}
              gradient="from-purple-50 to-emerald-50/30"
              iconBg="bg-purple-600 text-white"
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: SPP Status */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Status Pembayaran SPP</h3>
                <p className="text-xs text-slate-500">Rasio pembayaran siswa lunas & durasi tunggakan</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>

            {loading && !data ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 bg-slate-50/50 rounded-xl border border-dashed border-emerald-200 animate-pulse">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Memuat Grafik Pembayaran...</span>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sppPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sppPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex justify-center items-center gap-6 mt-4 pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <span className="text-slate-700 font-semibold">Lunas ({data?.spp_summary?.lunas || 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600" />
                <span className="text-slate-700 font-semibold">Belum Lunas ({data?.spp_summary?.belum_lunas || 0})</span>
              </div>
            </div>
          </div>

          {/* Chart 2: Attendance Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Distribusi Kehadiran Siswa</h3>
                <p className="text-xs text-slate-500">Total catatan presensi di SMA AL - FURQON DRIYOREJO</p>
              </div>
              <CalendarCheck className="w-5 h-5 text-teal-600" />
            </div>

            {loading && !data ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 bg-slate-50/50 rounded-xl border border-dashed border-teal-200 animate-pulse">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Memuat Grafik Kehadiran...</span>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="status" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }}
                    />
                    <Bar dataKey="jumlah" radius={[8, 8, 0, 0]}>
                      {attendanceBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex justify-around text-xs font-semibold text-slate-600 pt-4 border-t border-slate-100">
              <span className="text-emerald-700">Hadir: {data?.attendance_breakdown?.Hadir || 0}</span>
              <span className="text-amber-700">Sakit: {data?.attendance_breakdown?.Sakit || 0}</span>
              <span className="text-sky-700">Izin: {data?.attendance_breakdown?.Izin || 0}</span>
              <span className="text-rose-700">Alpha: {data?.attendance_breakdown?.Alpha || 0}</span>
            </div>
          </div>
        </div>

        {/* Latest Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table: Latest SPP Payments */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Pembayaran SPP Terbaru
            </h3>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-emerald-50/60 uppercase text-[10px] text-emerald-900 font-bold border-b border-emerald-100">
                  <tr>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">Semester</th>
                    <th className="py-2.5 px-3">Nominal</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.latest_payments?.map((p) => (
                    <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{p.student?.name || 'Siswa'}</td>
                      <td className="py-3 px-3">{p.semester}</td>
                      <td className="py-3 px-3 font-bold text-emerald-700">
                        Rp {Number(p.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={p.status === 'Lunas' ? 'emerald' : 'danger'}>
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(!data?.latest_payments || data.latest_payments.length === 0) && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">
                        Belum ada data transaksi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Latest Registered Students */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Siswa Terdaftar Terbaru
            </h3>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-emerald-50/60 uppercase text-[10px] text-emerald-900 font-bold border-b border-emerald-100">
                  <tr>
                    <th className="py-2.5 px-3">NIS</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Orang Tua / Wali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.latest_students?.map((s) => (
                    <tr key={s.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">{s.nis}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="py-3 px-3">
                        <Badge variant="emerald">{s.class}</Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{s.parent?.user?.name || '-'}</td>
                    </tr>
                  ))}
                  {(!data?.latest_students || data.latest_students.length === 0) && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">
                        Belum ada data siswa
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
