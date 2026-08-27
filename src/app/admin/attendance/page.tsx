'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FormInput, FormSelect, FormStudentCombobox } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Plus,
  CalendarCheck,
  Trash2,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
  X,
  Users,
  ChevronDown,
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Lock,
  Save,
  UserCheck,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface StudentOption {
  id: number;
  name: string;
  nis: string;
  class?: string;
  major?: string;
}

interface AttendanceRecord {
  id: number;
  studentId?: number;
  student_id?: number;
  date: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
  subject?: string;
  session?: string;
  student?: {
    id: number;
    name: string;
    nis: string;
    class: string;
    major?: string;
  };
}

const CLASS_OPTIONS = [
  'X IPA 1',
  'X IPA 2',
  'X IPS 1',
  'X IPS 2',
  'XI IPA 1',
  'XI IPA 2',
  'XI IPS 1',
  'XI IPS 2',
  'XII IPA 1',
  'XII IPA 2',
  'XII IPS 1',
  'XII IPS 2',
];

const JAM_PELAJARAN_OPTIONS = [
  'Jam Ke-1 (07:00 - 08:30)',
  'Jam Ke-2 (08:30 - 10:00)',
  'Jam Ke-3 (10:15 - 11:45)',
  'Jam Ke-4 (12:30 - 14:00)',
  'Jam Ke-5 (14:00 - 15:30)',
];

const ALL_SUBJECTS = [
  'Kimia',
  'Fisika',
  'Biologi',
  'Matematika Terapan',
  'Pemrograman Web & Perangkat Bergerak',
  'Basis Data',
  'Bahasa Indonesia',
  'Bahasa Inggris Industri',
  'Pendidikan Agama Islam',
  'Pancasila & Kewarganegaraan',
];

export default function AdminAttendancePage() {
  const { user } = useAuth();
  const isGuru = user?.role === 'guru';
  const isAdmin = user?.role === 'admin';
  const teacherSubject = user?.subject || 'Kimia';

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State per Mengajar
  const [selectedSubject, setSelectedSubject] = useState(isGuru ? teacherSubject : 'Kimia');
  const [selectedClass, setSelectedClass] = useState('X IPA 1');
  const [selectedSession, setSelectedSession] = useState('Jam Ke-1 (07:00 - 08:30)');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  // Attendance Status State for students in current class
  const [attendanceState, setAttendanceState] = useState<Record<number, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form Single State
  const [formData, setFormData] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Hadir' as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha',
    subject: isGuru ? teacherSubject : 'Kimia',
    session: 'Jam Ke-1 (07:00 - 08:30)',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isGuru && teacherSubject) {
      setSelectedSubject(teacherSubject);
      setFormData((prev) => ({ ...prev, subject: teacherSubject }));
    }
  }, [user, isGuru, teacherSubject]);

  useEffect(() => {
    fetchAttendances();
    fetchStudents();
  }, [selectedDate, selectedClass, selectedSubject, selectedSession]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendances', {
        params: {
          date: selectedDate,
          class: selectedClass,
          subject: isGuru ? teacherSubject : selectedSubject,
          session: selectedSession,
        },
      });
      setAttendances(res.data);

      // Populate attendanceState mapping
      const mapping: Record<number, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'> = {};
      (res.data || []).forEach((att: AttendanceRecord) => {
        const stId = att.studentId || att.student_id || att.student?.id;
        if (stId) {
          mapping[stId] = att.status;
        }
      });
      setAttendanceState(mapping);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data presensi');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
      if (res.data.length > 0 && !formData.student_id) {
        setFormData((prev) => ({ ...prev, student_id: String(res.data[0].id) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter students for selected class & search query
  const classStudents = students.filter((s) => s.class === selectedClass);
  const filteredStudents = classStudents.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  // Helper to update status of a student
  const handleStatusChange = (studentId: number, newStatus: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha') => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: newStatus,
    }));
  };

  // Mark all students in current class as Hadir
  const handleMarkAllHadir = () => {
    const updated: Record<number, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'> = { ...attendanceState };
    classStudents.forEach((st) => {
      updated[st.id] = 'Hadir';
    });
    setAttendanceState(updated);
    showToast('info', `Seluruh siswa kelas ${selectedClass} diset Hadir.`);
  };

  // Save Batch Attendance for Current Class & Subject Session
  const handleSaveBatchAttendance = async () => {
    if (classStudents.length === 0) {
      showToast('error', 'Tidak ada siswa pada kelas ini.');
      return;
    }
    setSubmitting(true);
    try {
      const items = classStudents.map((st) => ({
        student_id: st.id,
        status: attendanceState[st.id] || 'Hadir',
        subject: isGuru ? teacherSubject : selectedSubject,
        session: selectedSession,
      }));

      await api.post('/attendances', {
        date: selectedDate,
        subject: isGuru ? teacherSubject : selectedSubject,
        session: selectedSession,
        items,
      });

      showToast(
        'success',
        `Presensi ${items.length} siswa kelas ${selectedClass} (${isGuru ? teacherSubject : selectedSubject} - ${selectedSession}) berhasil disimpan.`
      );
      fetchAttendances();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan presensi kelas');
    } finally {
      setSubmitting(false);
    }
  };

  // Single Attendance submit
  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id) {
      setError('Silakan pilih siswa.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/attendances', {
        ...formData,
        subject: isGuru ? teacherSubject : formData.subject,
      });
      setIsModalOpen(false);
      showToast('success', 'Catatan presensi individu berhasil disimpan.');
      fetchAttendances();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menginput absensi.');
      showToast('error', 'Gagal menginput presensi');
    } finally {
      setSubmitting(false);
    }
  };

  const setDatePreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysOffset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Summary counters for current class view
  const summaryCurrentClass = {
    total: classStudents.length,
    hadir: classStudents.filter((s) => (attendanceState[s.id] || 'Hadir') === 'Hadir').length,
    sakit: classStudents.filter((s) => attendanceState[s.id] === 'Sakit').length,
    izin: classStudents.filter((s) => attendanceState[s.id] === 'Izin').length,
    alpha: classStudents.filter((s) => attendanceState[s.id] === 'Alpha').length,
  };

  const chartData = [
    { name: 'Hadir', count: summaryCurrentClass.hadir, fill: '#10b981' },
    { name: 'Sakit', count: summaryCurrentClass.sakit, fill: '#f59e0b' },
    { name: 'Izin', count: summaryCurrentClass.izin, fill: '#3b82f6' },
    { name: 'Alpha', count: summaryCurrentClass.alpha, fill: '#ef4444' },
  ];

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-6 animate-fade-in">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <CalendarCheck className="w-6 h-6 text-emerald-700" />
              {isAdmin ? 'Rekap Presensi Siswa' : 'Presensi Siswa per Mata Pelajaran & Jam Pelajaran'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin
                ? 'Lihat rekapan presensi siswa per mata pelajaran, kelas, dan jam pelajaran'
                : 'Input dan kelola absensi siswa saat jam mengajar mata pelajaran di setiap kelas'}
            </p>
          </div>

          {!isAdmin && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-2xs transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-700" />
                Input Absensi Individu
              </button>
              <button
                onClick={handleSaveBatchAttendance}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Simpan Presensi Kelas
              </button>
            </div>
          )}
        </div>

        {/* Toolbar Header Filter Per Mengajar */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-md border border-emerald-700/40 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-700/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-white shrink-0 border border-white/20">
                <BookOpen className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                  Mata Pelajaran Guru
                </span>
                <h3 className="text-lg font-black tracking-tight text-yellow-300 flex items-center gap-2">
                  {isGuru ? teacherSubject : selectedSubject}
                  {isGuru && (
                    <span title="Terkunci sesuai Mapel Guru">
                      <Lock className="w-3.5 h-3.5 text-emerald-300" />
                    </span>
                  )}
                </h3>
              </div>
            </div>

            {!isGuru && (
              <div className="w-full md:w-64">
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 mb-1 block">
                  Pilih Mata Pelajaran
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {ALL_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub} className="bg-slate-900 text-white">
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Grid Filters: Kelas, Jam Pelajaran, Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Kelas
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs border border-emerald-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Jam Mata Pelajaran
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs border border-emerald-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {JAM_PELAJARAN_OPTIONS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Presensi
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs border border-emerald-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-1.5 bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-700/50">
                <button
                  type="button"
                  onClick={() => setDatePreset(0)}
                  className="flex-1 py-1 px-2 text-[10px] font-bold rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white transition-colors text-center"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset(1)}
                  className="flex-1 py-1 px-2 text-[10px] font-bold rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 transition-colors text-center"
                >
                  Kemarin
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Mini Cards & Search */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
          <div className="grid grid-cols-4 gap-2 lg:col-span-3">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Hadir</span>
              <span className="text-lg font-black text-emerald-900">{summaryCurrentClass.hadir}</span>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Sakit</span>
              <span className="text-lg font-black text-amber-900">{summaryCurrentClass.sakit}</span>
            </div>
            <div className="bg-sky-50 rounded-xl p-3 border border-sky-200 text-center">
              <span className="text-[10px] font-bold text-sky-800 uppercase block">Izin</span>
              <span className="text-lg font-black text-sky-900">{summaryCurrentClass.izin}</span>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-200 text-center">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Alpha</span>
              <span className="text-lg font-black text-rose-900">{summaryCurrentClass.alpha}</span>
            </div>
          </div>

          <div className="lg:col-span-1">
            <FormInput
              icon={Search}
              placeholder="Cari nama atau NIS siswa..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              onClear={search ? () => setSearch('') : undefined}
            />
          </div>
        </div>

        {/* Action Header & Quick Actions */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Absensi Kelas: <span className="text-emerald-700 font-extrabold">{selectedClass}</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">Total {filteredStudents.length} Siswa</span>
          </div>

          <div className="flex items-center gap-2">
            {!isAdmin && (
              <button
                onClick={handleMarkAllHadir}
                type="button"
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                Hadirkan Semua Siswa
              </button>
            )}
            <button
              onClick={fetchAttendances}
              className="p-2 text-slate-500 hover:text-emerald-700 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabel Presensi (Sesuai Sketsa Gambar) */}
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden">
          {/* Notebook Header Strip matching drawing */}
          <div className="bg-emerald-50/80 px-5 py-3 border-b border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                Mata Pelajaran: <span className="text-emerald-800">{isGuru ? teacherSubject : selectedSubject}</span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Kelas: <span className="font-bold text-slate-900">{selectedClass}</span> | Jam Pelajaran: <span className="font-bold text-emerald-800">{selectedSession}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold font-mono bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-900 shadow-2xs">
                Tgl: {selectedDate}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 uppercase text-[10px] text-slate-800 font-extrabold border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">No.</th>
                  <th className="py-3.5 px-5">Nama Siswa</th>
                  <th className="py-3.5 px-5 text-center w-56">Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12">
                      <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Memuat daftar siswa & presensi...</p>
                    </td>
                  </tr>
                ) : paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada siswa ditemukan pada kelas {selectedClass}</p>
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((st, index) => {
                    const rowNo = startIndex + index + 1;
                    const currentStatus = attendanceState[st.id] || 'Hadir';

                    const statusStyles: Record<string, { bg: string; text: string; border: string; icon: any }> = {
                      Hadir: { bg: 'bg-emerald-50 hover:bg-emerald-100/80', text: 'text-emerald-800', border: 'border-emerald-300', icon: CheckCircle2 },
                      Sakit: { bg: 'bg-amber-50 hover:bg-amber-100/80', text: 'text-amber-800', border: 'border-amber-300', icon: AlertTriangle },
                      Izin: { bg: 'bg-sky-50 hover:bg-sky-100/80', text: 'text-sky-800', border: 'border-sky-300', icon: FileText },
                      Alpha: { bg: 'bg-rose-50 hover:bg-rose-100/80', text: 'text-rose-800', border: 'border-rose-300', icon: XCircle },
                    };

                    const activeStyle = statusStyles[currentStatus] || statusStyles.Hadir;
                    const IconComp = activeStyle.icon;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-600">{rowNo}.</td>
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-slate-900 text-sm tracking-tight">{st.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">NIS: {st.nis}</span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          {isAdmin ? (
                            /* Admin: Read-only status badge */
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-xs ${activeStyle.bg} ${activeStyle.text} ${activeStyle.border}`}>
                              <IconComp className="w-3.5 h-3.5" />
                              {currentStatus}
                            </span>
                          ) : (
                            /* Guru/Staff: Editable status dropdown */
                            <div className="relative inline-block w-40">
                              <select
                                value={currentStatus}
                                onChange={(e) =>
                                  handleStatusChange(st.id, e.target.value as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha')
                                }
                                className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl border font-black text-xs transition-all shadow-xs cursor-pointer ${activeStyle.bg} ${activeStyle.text} ${activeStyle.border} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                              >
                                <option value="Hadir" className="bg-white text-emerald-800 font-bold">
                                  Hadir
                                </option>
                                <option value="Izin" className="bg-white text-sky-800 font-bold">
                                  Izin
                                </option>
                                <option value="Sakit" className="bg-white text-amber-800 font-bold">
                                  Sakit
                                </option>
                                <option value="Alpha" className="bg-white text-rose-800 font-bold">
                                  Alpha
                                </option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-600">
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
              <span>
                Menampilkan{' '}
                <span className="font-bold text-slate-900">
                  {filteredStudents.length === 0 ? 0 : startIndex + 1}
                </span>{' '}
                -{' '}
                <span className="font-bold text-slate-900">
                  {Math.min(startIndex + itemsPerPage, filteredStudents.length)}
                </span>{' '}
                dari <span className="font-bold text-slate-900">{filteredStudents.length}</span> Siswa
              </span>

              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px] text-slate-500">Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Pagination Button Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={validCurrentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 transition-all flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      validCurrentPage === pg
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={validCurrentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 transition-all flex items-center gap-1"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL ABSENSI INDIVIDU — Hidden for Admin */}
        {!isAdmin && <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Catat Presensi Siswa Individu"
          subtitle="Pilih siswa, tanggal, mata pelajaran, dan status kehadiran"
        >
          <form onSubmit={handleSubmitSingle} className="space-y-6">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormStudentCombobox
                label="Pilih Siswa"
                required
                students={students}
                value={formData.student_id}
                onChange={(studentId) => setFormData({ ...formData, student_id: studentId })}
                placeholder="Cari nama atau NIS siswa..."
              />

              <div>
                <FormInput
                  label="Tanggal Presensi"
                  type="date"
                  required
                  icon={Calendar}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FormInput
                  label="Mata Pelajaran"
                  required
                  icon={isGuru ? Lock : BookOpen}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  disabled={isGuru}
                  readOnly={isGuru}
                />
              </div>

              <FormSelect
                label="Jam Mata Pelajaran"
                required
                icon={Clock}
                value={formData.session}
                onChange={(e) => setFormData({ ...formData, session: e.target.value })}
              >
                {JAM_PELAJARAN_OPTIONS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                Status Kehadiran <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-3 max-w-xl">
                {[
                  { key: 'Hadir', label: 'Hadir', icon: CheckCircle2, color: 'emerald' },
                  { key: 'Sakit', label: 'Sakit', icon: AlertTriangle, color: 'amber' },
                  { key: 'Izin', label: 'Izin', icon: FileText, color: 'sky' },
                  { key: 'Alpha', label: 'Alpha', icon: XCircle, color: 'rose' },
                ].map((item) => {
                  const IconComp = item.icon;
                  const isSelected = formData.status === item.key;
                  const colorMap: Record<string, { active: string; icon: string }> = {
                    emerald: { active: 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-1 ring-emerald-400/30', icon: 'text-emerald-600' },
                    amber: { active: 'bg-amber-50 border-amber-400 text-amber-700 ring-1 ring-amber-400/30', icon: 'text-amber-600' },
                    sky: { active: 'bg-sky-50 border-sky-400 text-sky-700 ring-1 ring-sky-400/30', icon: 'text-sky-600' },
                    rose: { active: 'bg-rose-50 border-rose-400 text-rose-700 ring-1 ring-rose-400/30', icon: 'text-rose-600' },
                  };
                  const colors = colorMap[item.color];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: item.key as any })}
                      className={`py-3 px-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all text-[12px] font-semibold ${
                        isSelected ? colors.active : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 ${isSelected ? colors.icon : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[13px] font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Presensi'
                )}
              </button>
            </div>
          </form>
        </Modal>}
      </div>
    </DashboardLayout>
  );
}
