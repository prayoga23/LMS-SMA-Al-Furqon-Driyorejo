'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  CheckCircle2,
  Send,
  Check,
  ChevronRight,
  AlertTriangle,
  FileText,
  Megaphone,
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

// ─── INTERFACES FOR ADMIN ─────────────────────────────────

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

// ─── INTERFACES FOR GURU ──────────────────────────────────

interface GuruDashboardData {
  teacher: {
    id: number;
    nip: string;
    name: string;
    subject: string;
    email?: string;
    status: string;
  } | null;
  todayDate: string;
  todayAttendance: {
    id: number;
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
    notes?: string;
    createdAt: string;
  } | null;
  teacherStats: {
    totalHadir: number;
    totalHari: number;
    percentage: number;
  };
  schoolStats: {
    totalStudents: number;
    averageGrade: number;
  };
  attendanceBreakdown: {
    Hadir: number;
    Sakit: number;
    Izin: number;
    Alpha: number;
  };
  latestAcademic: Array<{
    id: number;
    title: string;
    category: string;
    description: string;
    date: string;
  }>;
  latestGrades: Array<{
    id: number;
    subject: string;
    score: number;
    predicate: string;
    student?: { name: string; class: string };
  }>;
}

// ═══════════════════════════════════════════════════════════
// 1. ADMIN DASHBOARD VIEW
// ═══════════════════════════════════════════════════════════

function AdminDashboardView() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('admin_dashboard_cache');
      if (cached) {
        try {
          setData(JSON.parse(cached));
          setLoading(false);
        } catch (e) {}
      }
    }
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
      if (!data) showToast('error', 'Gagal memuat statistik dashboard admin');
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
              Dashboard Admin Sekolah
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              SMA AL - FURQON DRIYOREJO — Ringkasan statistik siswa, SPP, presensi, & keuangan
            </p>
          </div>

          <div className="flex items-center gap-2">
            {loading && (
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-pulse">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Memuat Data...</span>
              </div>
            )}

            <button
              onClick={() => fetchDashboardData(true)}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 transition-all hover:bg-emerald-50 shadow-xs"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <Clock className="w-4 h-4 text-emerald-700" />
              Tahun Ajaran: 2026/2027
            </div>
          </div>
        </div>

        {/* Reset Database Banner */}
        {!loading && data?.total_students === 0 && (
          <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Database Masih Kosong / Data 0</h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Klik tombol untuk memproses reset akun login default.
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
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Status Pembayaran SPP</h3>
                <p className="text-xs text-slate-500">Rasio pembayaran siswa lunas & tunggakan</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>

            {loading && !data ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 bg-slate-50/50 rounded-xl border border-dashed border-emerald-200 animate-pulse">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Memuat Grafik...</span>
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

          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Distribusi Kehadiran Siswa</h3>
                <p className="text-xs text-slate-500">Total catatan presensi siswa</p>
              </div>
              <CalendarCheck className="w-5 h-5 text-teal-600" />
            </div>

            {loading && !data ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 bg-slate-50/50 rounded-xl border border-dashed border-teal-200 animate-pulse">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Memuat Grafik...</span>
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

        {/* Latest Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

// ═══════════════════════════════════════════════════════════
// 2. GURU DASHBOARD VIEW (DEDICATED FOR TEACHERS)
// ═══════════════════════════════════════════════════════════

function GuruDashboardView() {
  const { user } = useAuth();
  const [data, setData] = useState<GuruDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form State untuk Presensi Hari Ini
  const [selectedStatus, setSelectedStatus] = useState<'Hadir' | 'Sakit' | 'Izin' | 'Alpha'>('Hadir');
  const [notes, setNotes] = useState('');
  const [isEditingToday, setIsEditingToday] = useState(false);

  // Realtime Clock
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    fetchGuruDashboardStats();

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchGuruDashboardStats = async (force = false) => {
    try {
      if (!data || force) setLoading(true);
      const res = await api.get('/guru/dashboard-stats');
      setData(res.data);

      if (res.data.todayAttendance) {
        setSelectedStatus(res.data.todayAttendance.status);
        setNotes(res.data.todayAttendance.notes || '');
      }
    } catch (err: any) {
      console.error('Error fetching guru dashboard stats:', err);
      showToast('error', 'Gagal memuat statistik dashboard guru');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAttendance(true);
      await api.post('/teachers/my-attendance', {
        status: selectedStatus,
        notes: notes,
      });

      showToast('success', `Presensi (${selectedStatus}) hari ini berhasil disimpan!`);
      setIsEditingToday(false);
      fetchGuruDashboardStats(true);
    } catch (err: any) {
      console.error('Error submitting teacher attendance:', err);
      showToast('error', err.response?.data?.message || 'Gagal mencatat presensi.');
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const formatDateIndo = (dateStr?: string) => {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    return targetDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Hadir': return 'success';
      case 'Sakit': return 'info';
      case 'Izin': return 'warning';
      case 'Alpha': return 'danger';
      default: return 'slate';
    }
  };

  const attendanceBarData = [
    { status: 'Hadir', jumlah: data?.attendanceBreakdown?.Hadir || 0, fill: '#10b981' },
    { status: 'Sakit', jumlah: data?.attendanceBreakdown?.Sakit || 0, fill: '#f59e0b' },
    { status: 'Izin', jumlah: data?.attendanceBreakdown?.Izin || 0, fill: '#0284c7' },
    { status: 'Alpha', jumlah: data?.attendanceBreakdown?.Alpha || 0, fill: '#e11d48' },
  ];

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* ─── 1. WELCOME HEADER BANNER (GURU) ─── */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 border border-emerald-600/30 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-extrabold uppercase tracking-wider border border-white/15">
                Dashboard Pengajar
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                SMA AL - FURQON
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Selamat Datang, {data?.teacher?.name || user?.name || 'Bapak/Ibu Guru'}! 👋
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
              Portal Pengajar SMA AL-FURQON DRIYOREJO — Pengelolaan presensi harian guru, presensi siswa, penilaian rapor, & informasi akademik sekolah.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-emerald-200">
              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-xl">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                NIP: <span className="font-mono text-white">{data?.teacher?.nip || 'GURU-0001'}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-xl">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Mapel: <span className="text-white">{data?.teacher?.subject || 'Mata Pelajaran'}</span>
              </span>
            </div>
          </div>

          {/* Clock & Realtime Badge */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/15 shrink-0 self-start md:self-auto relative z-10">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-200">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                {formatDateIndo()}
              </p>
              <p className="text-xl font-black tracking-tight font-mono text-white">
                {currentTime || '--:--:--'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── 2. PRESENSI MANDIRI GURU HARI INI WIDGET ─── */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-slate-900">
                  Presensi Mandiri Guru Hari Ini
                </h2>
                <p className="text-xs text-slate-500">
                  {formatDateIndo(data?.todayDate)}
                </p>
              </div>
            </div>

            {data?.todayAttendance && !isEditingToday && (
              <button
                onClick={() => setIsEditingToday(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5"
              >
                Ubah Presensi
              </button>
            )}
          </div>

          {data?.todayAttendance && !isEditingToday ? (
            /* Sudah Presensi Display */
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200/80 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Status Kehadiran Anda:</span>
                      <Badge variant={getStatusBadgeVariant(data.todayAttendance.status)}>
                        {data.todayAttendance.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Tercatat pada pukul{' '}
                      <span className="font-bold text-slate-900 font-mono">
                        {new Date(data.todayAttendance.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                {data.todayAttendance.notes && (
                  <div className="bg-white rounded-xl p-3 border border-emerald-100 text-xs text-slate-700 max-w-md">
                    <span className="font-bold text-slate-900 block mb-0.5">Keterangan:</span>
                    {data.todayAttendance.notes}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Form Presensi Hari Ini */
            <form onSubmit={handleSubmitAttendance} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {data?.todayAttendance
                      ? 'Mengubah status presensi guru hari ini.'
                      : 'Anda belum mencatat presensi hari ini. Silakan pilih status dan klik simpan.'}
                  </span>
                </div>
                {data?.todayAttendance && (
                  <button
                    type="button"
                    onClick={() => setIsEditingToday(false)}
                    className="text-xs font-bold text-slate-600 underline hover:text-slate-900"
                  >
                    Batal
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Pilih Status Kehadiran Guru:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as const).map((st) => {
                    const isSelected = selectedStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStatus(st)}
                        className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-200 ${
                          isSelected
                            ? st === 'Hadir'
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20 scale-[1.02]'
                              : st === 'Sakit'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20 scale-[1.02]'
                              : st === 'Izin'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20 scale-[1.02]'
                              : 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20 scale-[1.02]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Mengajar jam ke-1 s.d 4 / Sakit flu"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingAttendance}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 hover:from-emerald-800 hover:to-teal-800 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingAttendance ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Simpan Presensi Hari Ini
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ─── 3. KPI STAT CARDS (GURU) ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          <StatCard
            title="Kehadiran Guru"
            value={`${data?.teacherStats?.percentage || 100}%`}
            subtext={`${data?.teacherStats?.totalHadir || 0} dari ${data?.teacherStats?.totalHari || 0} hari`}
            icon={UserCheck}
            gradient="from-emerald-50 to-teal-50/50"
            iconBg="bg-emerald-700 text-white"
          />
          <StatCard
            title="Mata Pelajaran"
            value={data?.teacher?.subject || 'Mapel'}
            subtext="Diampu di Sekolah"
            icon={BookOpen}
            gradient="from-teal-50 to-emerald-50/40"
            iconBg="bg-teal-700 text-white"
          />
          <StatCard
            title="Total Siswa"
            value={data?.schoolStats?.totalStudents || 0}
            subtext="Siswa Terdaftar"
            icon={Users}
            gradient="from-sky-50 to-blue-50/40"
            iconBg="bg-sky-600 text-white"
          />
          <StatCard
            title="Rata-rata Nilai"
            value={data?.schoolStats?.averageGrade || 0}
            subtext="Prestasi Siswa"
            icon={Award}
            gradient="from-purple-50 to-emerald-50/30"
            iconBg="bg-purple-600 text-white"
          />
        </div>

        {/* ─── 4. MENU PINTASAN GURU (SHORTCUT CARDS) ─── */}
        <div>
          <h2 className="text-base font-extrabold text-slate-900 mb-3.5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Menu Pintasan Pengajar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/teacher-attendance"
              className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all group flex items-start justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">
                    Presensi Saya (Guru)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Riwayat & rekap absensi mandiri guru
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0 mt-1" />
            </Link>

            <Link
              href="/admin/attendance"
              className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all group flex items-start justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition-colors flex items-center justify-center font-bold">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-800 transition-colors">
                    Presensi Siswa
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Input & rekap absensi harian siswa
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 transition-colors shrink-0 mt-1" />
            </Link>

            <Link
              href="/admin/grades"
              className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all group flex items-start justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-700 group-hover:text-white transition-colors flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-800 transition-colors">
                    Rapor & Nilai Siswa
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Input nilai tugas, UTS, UAS, & predikat
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition-colors shrink-0 mt-1" />
            </Link>

            <Link
              href="/admin/academics"
              className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all group flex items-start justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 group-hover:bg-sky-700 group-hover:text-white transition-colors flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-sky-800 transition-colors">
                    Info Akademik Sekolah
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pengumuman & agenda kegiatan sekolah
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-600 transition-colors shrink-0 mt-1" />
            </Link>
          </div>
        </div>

        {/* ─── 5. CHARTS & LATEST RECORDS SECTION ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Presensi Siswa */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Ringkasan Kehadiran Siswa</h3>
                <p className="text-xs text-slate-500">Distribusi presensi siswa terdaftar</p>
              </div>
              <CalendarCheck className="w-5 h-5 text-teal-600" />
            </div>

            {loading ? (
              <div className="h-60 flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-xl">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Memuat grafik presensi...</span>
              </div>
            ) : (
              <div className="h-60">
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
              <span className="text-emerald-700">Hadir: {data?.attendanceBreakdown?.Hadir || 0}</span>
              <span className="text-amber-700">Sakit: {data?.attendanceBreakdown?.Sakit || 0}</span>
              <span className="text-sky-700">Izin: {data?.attendanceBreakdown?.Izin || 0}</span>
              <span className="text-rose-700">Alpha: {data?.attendanceBreakdown?.Alpha || 0}</span>
            </div>
          </div>

          {/* Pengumuman & Informasi Sekolah Terbaru */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-emerald-600" />
                  Pengumuman Akademik Terbaru
                </h3>
                <Link
                  href="/admin/academics"
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Lihat Semua
                </Link>
              </div>

              <div className="space-y-3">
                {data?.latestAcademic?.map((info) => (
                  <div
                    key={info.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-emerald-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {info.category}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {info.date}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{info.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{info.description}</p>
                  </div>
                ))}

                {(!data?.latestAcademic || data.latestAcademic.length === 0) && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada pengumuman akademik terbaru.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 text-center">
              <Link
                href="/admin/academics"
                className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 flex items-center justify-center gap-1"
              >
                Buka Portal Informasi Sekolah
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// 3. MAIN DASHBOARD PAGE EXPORT (ROUTER BY ROLE)
// ═══════════════════════════════════════════════════════════

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Memuat Dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Jika user role 'guru', tampilkan GuruDashboardView
  if (user?.role === 'guru') {
    return <GuruDashboardView />;
  }

  // Untuk Admin & Staff, tampilkan AdminDashboardView
  return <AdminDashboardView />;
}
