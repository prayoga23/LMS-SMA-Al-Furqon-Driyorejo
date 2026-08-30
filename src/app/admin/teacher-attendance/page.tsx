'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  UserCheck,
  Building2,
  FileText,
  Send,
  RefreshCw,
  Search,
  Filter,
  User,
  BookOpen,
  Award,
  Check,
  Edit,
  Trash2,
  Users,
  Eye,
} from 'lucide-react';

// ─── SHARED INTERFACES ───────────────────────────

interface Teacher {
  id: number;
  nip: string;
  name: string;
  subject: string;
  phone?: string;
  email?: string;
  status: string;
}

interface TeacherAttendanceRecord {
  id: number;
  teacherId: number;
  date: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
  notes?: string;
  createdAt: string;
  teacher?: Teacher;
}

interface Stats {
  totalHadir: number;
  totalSakit: number;
  totalIzin: number;
  totalAlpha: number;
  totalHari: number;
  percentage: number;
}

// ═══════════════════════════════════════════════════
// ADMIN VIEW: Rekap Presensi Semua Guru
// ═══════════════════════════════════════════════════

function AdminTeacherAttendanceView() {
  const [attendances, setAttendances] = useState<TeacherAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Clock
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    fetchAttendances();
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

  useEffect(() => {
    fetchAttendances();
  }, [dateFilter]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers/attendance', {
        params: { date: dateFilter },
      });
      setAttendances(res.data);
    } catch (err: any) {
      console.error('Error fetching teacher attendances:', err);
      showToast('error', 'Gagal memuat data presensi guru.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, teacherName: string) => {
    if (!confirm(`Hapus record presensi guru "${teacherName}"?`)) return;
    try {
      await api.delete(`/teachers/attendance?id=${id}`);
      showToast('info', `Presensi guru "${teacherName}" berhasil dihapus.`);
      fetchAttendances();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Gagal menghapus presensi guru.');
    }
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return dateObj.toLocaleDateString('id-ID', {
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

  const setDatePreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysOffset);
    setDateFilter(d.toISOString().split('T')[0]);
  };

  // Filter
  const filteredAttendances = attendances.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      (item.teacher?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.teacher?.nip || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.teacher?.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Summary stats
  const summary = {
    total: filteredAttendances.length,
    hadir: filteredAttendances.filter((a) => a.status === 'Hadir').length,
    sakit: filteredAttendances.filter((a) => a.status === 'Sakit').length,
    izin: filteredAttendances.filter((a) => a.status === 'Izin').length,
    alpha: filteredAttendances.filter((a) => a.status === 'Alpha').length,
  };

  return (
    <DashboardLayout allowedRole="admin">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 rounded-3xl text-white shadow-xl shadow-emerald-900/10 border border-emerald-600/30">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-white/15 text-emerald-200 border border-white/10">
                <Eye className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Rekap Presensi Guru
              </h1>
            </div>
            <p className="text-emerald-100/90 text-xs sm:text-sm font-medium">
              Lihat rekapan kehadiran seluruh guru berdasarkan tanggal
            </p>
          </div>

          {/* Clock & Date Badge */}
          <div className="flex items-center gap-3 bg-white/15 px-4 py-3 rounded-2xl border border-white/15 shrink-0 self-start sm:self-auto">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-200">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                {formatDateIndo(new Date().toISOString().split('T')[0])}
              </p>
              <p className="text-lg font-black tracking-tight font-mono text-white">
                {currentTime || '--:--:--'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Presensi
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs border border-emerald-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 w-48"
                />
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDatePreset(0)}
                    className="py-1 px-2.5 text-[10px] font-bold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition-colors"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset(1)}
                    className="py-1 px-2.5 text-[10px] font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                  >
                    Kemarin
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full md:w-52">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Semua Status</option>
                <option value="Hadir">Hadir</option>
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
                <option value="Alpha">Alpha</option>
              </select>
            </div>

            <div className="w-full md:w-64">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                <Search className="w-3.5 h-3.5" /> Cari Guru
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, NIP, atau mapel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={fetchAttendances}
              title="Refresh Data"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors shrink-0 self-end"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Hadir</span>
            <span className="text-xl font-black text-emerald-900">{summary.hadir}</span>
          </div>
          <div className="bg-sky-50 rounded-xl p-3.5 border border-sky-200 text-center">
            <span className="text-[10px] font-bold text-sky-800 uppercase block">Sakit</span>
            <span className="text-xl font-black text-sky-900">{summary.sakit}</span>
          </div>
          <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-center">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Izin</span>
            <span className="text-xl font-black text-amber-900">{summary.izin}</span>
          </div>
          <div className="bg-rose-50 rounded-xl p-3.5 border border-rose-200 text-center">
            <span className="text-[10px] font-bold text-rose-800 uppercase block">Alpha</span>
            <span className="text-xl font-black text-rose-900">{summary.alpha}</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Daftar Presensi Guru — {formatDateIndo(dateFilter)}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Total <span className="font-bold text-slate-900">{filteredAttendances.length}</span> record presensi
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Memuat data presensi guru...</p>
            </div>
          ) : filteredAttendances.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CalendarCheck className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                Belum ada data presensi guru ditemukan
              </p>
              <p className="text-xs text-slate-400">
                Tidak ada catatan presensi guru pada tanggal yang dipilih.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 w-14 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Guru</th>
                    <th className="py-3.5 px-4">NIP</th>
                    <th className="py-3.5 px-4">Mata Pelajaran</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Catatan</th>
                    <th className="py-3.5 px-4">Waktu</th>
                    <th className="py-3.5 px-4 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendances.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-emerald-50/30 transition-colors duration-150 text-slate-700"
                    >
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{item.teacher?.name || '-'}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {item.teacher?.nip || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {item.teacher?.subject || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        {item.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id, item.teacher?.name || 'Guru')}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus presensi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════
// GURU VIEW: Self-Attendance (Original)
// ═══════════════════════════════════════════════════

function GuruSelfAttendanceView() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<TeacherAttendanceRecord | null>(null);
  const [history, setHistory] = useState<TeacherAttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalHadir: 0,
    totalSakit: 0,
    totalIzin: 0,
    totalAlpha: 0,
    totalHari: 0,
    percentage: 100,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form State
  const [selectedStatus, setSelectedStatus] = useState<'Hadir' | 'Sakit' | 'Izin' | 'Alpha'>('Hadir');
  const [notes, setNotes] = useState('');
  const [isEditingToday, setIsEditingToday] = useState(false);

  // Table Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Clock state
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    fetchData();
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/teachers/my-attendance');
      const data = res.data;
      setTeacher(data.teacher);
      setTodayAttendance(data.todayAttendance);
      setHistory(data.history || []);
      setStats(data.stats);

      if (data.todayAttendance) {
        setSelectedStatus(data.todayAttendance.status);
        setNotes(data.todayAttendance.notes || '');
      }
    } catch (err: any) {
      console.error('Error fetching teacher attendance:', err);
      setError(err.response?.data?.message || 'Gagal memuat data presensi guru.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/teachers/my-attendance', {
        status: selectedStatus,
        notes: notes,
      });

      showToast('success', `Presensi (${selectedStatus}) berhasil dicatat!`);

      setIsEditingToday(false);
      fetchData();
    } catch (err: any) {
      console.error('Error submitting attendance:', err);
      showToast('error', err.response?.data?.message || 'Gagal mencatat presensi.');
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      message,
    });
  };

  // Filter history
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.date.includes(searchTerm) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    const matchesDate = dateFilter ? item.date === dateFilter : true;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Hadir':
        return 'success';
      case 'Sakit':
        return 'info';
      case 'Izin':
        return 'warning';
      case 'Alpha':
        return 'danger';
      default:
        return 'slate';
    }
  };

  return (
    <DashboardLayout>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 rounded-3xl text-white shadow-xl shadow-emerald-900/10 border border-emerald-600/30">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-white/15 text-emerald-200 border border-white/10">
                <UserCheck className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Presensi Guru
              </h1>
            </div>
            <p className="text-emerald-100/90 text-xs sm:text-sm font-medium">
              Kelola pencatatan kehadiran harian Anda secara mandiri dan cepat
            </p>
          </div>

          {/* Clock & Date Badge */}
          <div className="flex items-center gap-3 bg-white/15 px-4 py-3 rounded-2xl border border-white/15 shrink-0 self-start sm:self-auto">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-200">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                {formatDateIndo(new Date().toISOString().split('T')[0])}
              </p>
              <p className="text-lg font-black tracking-tight font-mono text-white">
                {currentTime || '--:--:--'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-3 shadow-xs">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Profile Card & Presensi Hari Ini Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teacher Profile Summary */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Profil Pengajar
                </span>
                <Badge variant="success">{teacher?.status || 'Aktif'}</Badge>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-emerald-700/20 shrink-0">
                  {teacher?.name ? teacher.name.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base text-slate-900 truncate">
                    {teacher?.name || user?.name || 'Guru SMA Al-Furqon'}
                  </h3>
                  <p className="text-xs font-bold text-emerald-700 truncate">
                    NIP: {teacher?.nip || '-'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {teacher?.subject || 'Mata Pelajaran'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs space-y-2 text-slate-600">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-700">Ampuan:</span>
                <span className="truncate">{teacher?.subject || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-700">Email:</span>
                <span className="truncate">{teacher?.email || user?.email || '-'}</span>
              </div>
            </div>
          </div>

          {/* Today's Attendance Action Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -z-0 opacity-60 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-700" />
                  <h2 className="font-extrabold text-lg text-slate-900">
                    Status Presensi Hari Ini
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {formatDateIndo(new Date().toISOString().split('T')[0])}
                </span>
              </div>

              {todayAttendance && !isEditingToday ? (
                /* Already Checked In Display */
                <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 border border-emerald-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-700">Status Kehadiran:</p>
                          <Badge variant={getStatusBadgeVariant(todayAttendance.status)}>
                            {todayAttendance.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Tercatat pada jam{' '}
                          <span className="font-bold text-slate-800">
                            {new Date(todayAttendance.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsEditingToday(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 transition-colors flex items-center gap-1.5 self-start sm:self-auto border border-emerald-200"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Ubah Presensi
                    </button>
                  </div>

                  {todayAttendance.notes && (
                    <div className="bg-white/80 rounded-xl p-3 border border-emerald-100 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block mb-0.5">Catatan / Keterangan:</span>
                      {todayAttendance.notes}
                    </div>
                  )}
                </div>
              ) : (
                /* Attendance Input Form */
                <form onSubmit={handleSubmitAttendance} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs font-medium flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        {todayAttendance
                          ? 'Anda sedang mengedit status presensi hari ini.'
                          : 'Anda belum mencatat presensi hari ini. Silakan pilih status dan tekan simpan.'}
                      </span>
                    </div>
                    {todayAttendance && (
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
                      Pilih Status Kehadiran:
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
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Mengikuti rapat dinas / Sakit flu / Hadir tepat waktu"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 hover:from-emerald-800 hover:to-teal-800 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
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
          </div>
        </div>

        {/* Statistical Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <StatCard
            title="Total Hadir"
            value={stats.totalHadir}
            subtext="Hari Kehadiran"
            icon={CheckCircle2}
            gradient="from-emerald-50 to-emerald-100/40"
            iconBg="bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
          />
          <StatCard
            title="Sakit"
            value={stats.totalSakit}
            subtext="Hari Sakit"
            icon={AlertTriangle}
            gradient="from-sky-50 to-sky-100/40"
            iconBg="bg-sky-600 text-white shadow-md shadow-sky-600/20"
          />
          <StatCard
            title="Izin"
            value={stats.totalIzin}
            subtext="Hari Izin"
            icon={Calendar}
            gradient="from-amber-50 to-amber-100/40"
            iconBg="bg-amber-600 text-white shadow-md shadow-amber-600/20"
          />
          <StatCard
            title="Alpha"
            value={stats.totalAlpha}
            subtext="Tanpa Keterangan"
            icon={XCircle}
            gradient="from-rose-50 to-rose-100/40"
            iconBg="bg-rose-600 text-white shadow-md shadow-rose-600/20"
          />
          <StatCard
            title="Persentase"
            value={`${stats.percentage}%`}
            subtext="Tingkat Kehadiran"
            icon={Award}
            gradient="from-teal-50 to-emerald-100/40"
            iconBg="bg-teal-700 text-white shadow-md shadow-teal-700/20"
          />
        </div>

        {/* Attendance History Table */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Riwayat Presensi Saya
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Daftar rekapan pencatatan kehadiran yang telah dilakukan
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari tanggal/catatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-44"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-slate-700"
              >
                <option value="">Semua Status</option>
                <option value="Hadir">Hadir</option>
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
                <option value="Alpha">Alpha</option>
              </select>

              <button
                onClick={fetchData}
                title="Refresh Data"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Memuat riwayat presensi...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CalendarCheck className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                Belum ada data presensi ditemukan
              </p>
              <p className="text-xs text-slate-400">
                Data presensi akan muncul setelah Anda mencatat presensi harian.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Hari</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Catatan / Keterangan</th>
                    <th className="py-3 px-4">Waktu Submit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-emerald-50/30 transition-colors duration-150 text-slate-700"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.date}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {formatDateIndo(item.date).split(',')[0]}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        {item.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════
// PAGE EXPORT: Route to correct view based on role
// ═══════════════════════════════════════════════════

export default function TeacherAttendancePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Memuat...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Admin & Staff: View all teacher attendance records
  if (user?.role === 'admin' || user?.role === 'staff') {
    return <AdminTeacherAttendanceView />;
  }

  // Guru: Self-attendance
  return <GuruSelfAttendanceView />;
}
