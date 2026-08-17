'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FormInput, FormSelect } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import { downloadTeacherExcelTemplate, parseExcelFile } from '@/lib/excel';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Phone,
  Mail,
  RefreshCw,
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  UserCheck,
  Hash,
  User,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

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
  teacher?: Teacher;
}

export default function AdminTeachersPage() {
  const [activeTab, setActiveTab] = useState<'teachers' | 'attendance'>('teachers');

  // Teacher State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [searchTeacher, setSearchTeacher] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTeacherAttendanceModalOpen, setIsTeacherAttendanceModalOpen] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form State Single Teacher
  const [teacherFormData, setTeacherFormData] = useState({
    nip: '',
    name: '',
    subject: '',
    phone: '',
    email: '',
    status: 'Aktif',
  });

  // Excel Import State
  const [importedTeachers, setImportedTeachers] = useState<any[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Teacher Attendance State
  const [attendances, setAttendances] = useState<TeacherAttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchAttendanceStatuses, setBatchAttendanceStatuses] = useState<Record<number, { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'; notes: string }>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, [searchTeacher, statusFilter]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchTeacherAttendances();
    }
  }, [activeTab, attendanceDate]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  // --- FETCH TEACHERS ---
  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const params: Record<string, string> = {};
      if (searchTeacher.trim()) params.search = searchTeacher.trim();
      if (statusFilter.trim()) params.status = statusFilter.trim();

      const res = await api.get('/teachers', { params });
      if (Array.isArray(res.data)) {
        setTeachers(res.data);
      } else {
        setTeachers([]);
      }
    } catch (err: any) {
      console.error('Fetch teachers error:', err);
      const msg = err.response?.data?.message || 'Gagal memuat data guru';
      showToast('error', msg);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // --- FETCH TEACHER ATTENDANCES ---
  const fetchTeacherAttendances = async () => {
    try {
      setLoadingAttendance(true);
      const params: Record<string, string> = {};
      if (attendanceDate) params.date = attendanceDate;

      const res = await api.get('/teachers/attendance', { params });
      if (Array.isArray(res.data)) {
        setAttendances(res.data);
      } else {
        setAttendances([]);
      }
    } catch (err: any) {
      console.error('Fetch teacher attendances error:', err);
      const msg = err.response?.data?.message || 'Gagal memuat presensi guru';
      showToast('error', msg);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // --- TEACHER CRUD HANDLERS ---
  const handleOpenAddTeacher = () => {
    setTeacherFormData({
      nip: '',
      name: '',
      subject: '',
      phone: '',
      email: '',
      status: 'Aktif',
    });
    setError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditTeacher = (t: Teacher) => {
    setSelectedTeacher(t);
    setTeacherFormData({
      nip: t.nip,
      name: t.name,
      subject: t.subject,
      phone: t.phone || '',
      email: t.email || '',
      status: t.status || 'Aktif',
    });
    setError('');
    setIsEditModalOpen(true);
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherFormData.nip.trim() || !teacherFormData.name.trim() || !teacherFormData.subject.trim()) {
      setError('NIP, Nama Guru, dan Mata Pelajaran wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/teachers', teacherFormData);
      setIsAddModalOpen(false);
      showToast('success', `Guru ${teacherFormData.name} berhasil ditambahkan.`);
      fetchTeachers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menambahkan guru.');
      showToast('error', 'Gagal menambahkan guru');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/teachers/${selectedTeacher.id}`, teacherFormData);
      setIsEditModalOpen(false);
      showToast('success', `Data guru ${teacherFormData.name} berhasil diperbarui.`);
      fetchTeachers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memperbarui data guru.');
      showToast('error', 'Gagal memperbarui guru');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id: number, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data guru ${name}?`)) return;
    try {
      await api.delete(`/teachers/${id}`);
      showToast('info', `Guru ${name} telah dihapus.`);
      fetchTeachers();
    } catch (err) {
      showToast('error', 'Gagal menghapus data guru');
    }
  };

  // --- IMPORT EXCEL TEACHERS ---
  const handleOpenImportModal = () => {
    setImportedTeachers([]);
    setImportFile(null);
    setError('');
    setIsImportModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    try {
      const rawData = await parseExcelFile(file);
      const mapped = rawData.map((row: any) => ({
        nip: String(row['NIP'] || row['nip'] || ''),
        name: String(row['Nama Guru'] || row['Nama'] || row['name'] || ''),
        subject: String(row['Mata Pelajaran'] || row['Mapel'] || row['subject'] || ''),
        phone: String(row['No HP'] || row['HP'] || row['phone'] || ''),
        email: String(row['Email'] || row['email'] || ''),
        status: String(row['Status'] || row['status'] || 'Aktif'),
      }));
      setImportedTeachers(mapped);
    } catch (err) {
      console.error(err);
      setError('Gagal membaca file Excel. Pastikan format file sesuai.');
    }
  };

  const handleSaveImportTeachers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (importedTeachers.length === 0) {
      setError('Tidak ada data Excel untuk diimport.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/teachers/import', { teachers: importedTeachers });
      setIsImportModalOpen(false);
      showToast('success', res.data.message || 'Import data guru berhasil!');
      fetchTeachers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengimport data guru.');
      showToast('error', 'Gagal import Excel');
    } finally {
      setSubmitting(false);
    }
  };

  // --- TEACHER ATTENDANCE BATCH HANDLERS ---
  const handleOpenTeacherAttendanceModal = () => {
    const activeTeachers = teachers.filter((t) => t.status === 'Aktif');
    const initial: Record<number, { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'; notes: string }> = {};
    activeTeachers.forEach((t) => {
      // Find if attendance record already exists for this date
      const existing = attendances.find((a) => a.teacherId === t.id);
      initial[t.id] = {
        status: existing?.status || 'Hadir',
        notes: existing?.notes || '',
      };
    });
    setBatchAttendanceStatuses(initial);
    setError('');
    setIsTeacherAttendanceModalOpen(true);
  };

  const handleSaveTeacherAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeTeachers = teachers.filter((t) => t.status === 'Aktif');
    if (activeTeachers.length === 0) {
      setError('Tidak ada guru aktif untuk dicatat presensinya.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const items = activeTeachers.map((t) => ({
        teacher_id: t.id,
        status: batchAttendanceStatuses[t.id]?.status || 'Hadir',
        notes: batchAttendanceStatuses[t.id]?.notes || '',
      }));

      await api.post('/teachers/attendance', {
        date: attendanceDate,
        items,
      });

      setIsTeacherAttendanceModalOpen(false);
      showToast('success', `Presensi untuk ${items.length} guru berhasil disimpan.`);
      fetchTeacherAttendances();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan presensi guru.');
      showToast('error', 'Gagal menyimpan presensi guru');
    } finally {
      setSubmitting(false);
    }
  };

  // Attendance summary metrics
  const attendanceSummary = {
    Hadir: attendances.filter((a) => a.status === 'Hadir').length,
    Sakit: attendances.filter((a) => a.status === 'Sakit').length,
    Izin: attendances.filter((a) => a.status === 'Izin').length,
    Alpha: attendances.filter((a) => a.status === 'Alpha').length,
  };

  const attendanceChartData = [
    { name: 'Hadir', count: attendanceSummary.Hadir, fill: '#10b981' },
    { name: 'Sakit', count: attendanceSummary.Sakit, fill: '#f59e0b' },
    { name: 'Izin', count: attendanceSummary.Izin, fill: '#3b82f6' },
    { name: 'Alpha', count: attendanceSummary.Alpha, fill: '#ef4444' },
  ];

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-6 animate-fade-in">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-emerald-700" />
              Manajemen Data Guru & Presensi Guru
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Kelola data NIP guru, bidang studi/jabatan, pencatatan presensi guru, dan import Excel
            </p>
          </div>

          {/* Tab Selection Navigation */}
          <div className="flex items-center bg-emerald-50/80 p-1.5 rounded-2xl border border-emerald-100/80 shrink-0">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'teachers'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-white/50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Data & Profil Guru
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-white/50'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              Presensi Guru
            </button>
          </div>
        </div>

        {/* TAB 1: DATA GURU */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            {/* Toolbar Action Header */}
            <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
              <div className="w-full lg:w-96">
                <FormInput
                  icon={Search}
                  placeholder="Cari NIP, Nama Guru, Mapel, atau Email..."
                  value={searchTeacher}
                  onChange={(e) => setSearchTeacher(e.target.value)}
                  onClear={searchTeacher ? () => setSearchTeacher('') : undefined}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
                  <FormSelect
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-36"
                  >
                    <option value="">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </FormSelect>
                </div>

                <button
                  onClick={handleOpenImportModal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Import Excel Guru
                </button>

                <button
                  onClick={handleOpenAddTeacher}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Guru Baru
                </button>

                <button
                  onClick={fetchTeachers}
                  className="p-2.5 text-slate-600 hover:text-emerald-700 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingTeachers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Teachers Table */}
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-emerald-50/70 uppercase text-[10px] text-emerald-950 font-bold border-b border-emerald-100 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">NIP</th>
                      <th className="py-3.5 px-4">Nama Guru</th>
                      <th className="py-3.5 px-4">Mata Pelajaran / Jabatan</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">No. Telepon / WhatsApp</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingTeachers ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-xs text-slate-500 font-medium">Memuat data guru...</p>
                        </td>
                      </tr>
                    ) : teachers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-600">Tidak ada data guru ditemukan</p>
                        </td>
                      </tr>
                    ) : (
                      teachers.map((t) => (
                        <tr key={t.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">{t.nip}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{t.name}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800">{t.subject}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {t.email ? (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{t.email}</span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">
                            {t.phone ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{t.phone}</span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={t.status === 'Aktif' ? 'success' : 'slate'}>
                              {t.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditTeacher(t)}
                                className="p-2 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100/70 rounded-xl transition-colors"
                                title="Edit Data Guru"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTeacher(t.id, t.name)}
                                className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors"
                                title="Hapus Guru"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRESENSI GURU */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <div className="flex items-center gap-3">
                <FormInput
                  label="Pilih Tanggal Presensi"
                  type="date"
                  icon={Calendar}
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-44"
                />
                <button
                  onClick={fetchTeacherAttendances}
                  className="p-2.5 mt-5 text-slate-600 hover:text-emerald-700 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 transition-colors"
                  title="Refresh Presensi"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingAttendance ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <button
                onClick={handleOpenTeacherAttendanceModal}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <CalendarCheck className="w-4 h-4" />
                Catat Presensi Guru (Harian)
              </button>
            </div>

            {/* KPI Summary Cards & Visual Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="grid grid-cols-2 gap-4 lg:col-span-1">
                <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/60 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">{attendanceSummary.Hadir}</h3>
                </div>
                <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/60 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Sakit
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">{attendanceSummary.Sakit}</h3>
                </div>
                <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-200/60 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Izin
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">{attendanceSummary.Izin}</h3>
                </div>
                <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200/60 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Alpha
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">{attendanceSummary.Alpha}</h3>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Grafik Rekapitulasi Presensi Guru ({attendanceDate})
                </h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {attendanceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Attendance Records Table */}
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-emerald-50/70 uppercase text-[10px] text-emerald-950 font-bold border-b border-emerald-100 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Tanggal</th>
                      <th className="py-3.5 px-4">Nama Guru</th>
                      <th className="py-3.5 px-4">NIP</th>
                      <th className="py-3.5 px-4">Mata Pelajaran</th>
                      <th className="py-3.5 px-4">Status Kehadiran</th>
                      <th className="py-3.5 px-4">Catatan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingAttendance ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12">
                          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-xs text-slate-500 font-medium">Memuat presensi guru...</p>
                        </td>
                      </tr>
                    ) : attendances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-600">Belum ada catatan presensi guru pada tanggal ini</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Klik tombol "Catat Presensi Guru (Harian)" untuk menginput kehadiran guru.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      attendances.map((a) => (
                        <tr key={a.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{a.date}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{a.teacher?.name}</td>
                          <td className="py-3.5 px-4 font-mono text-emerald-800 font-bold">{a.teacher?.nip}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">{a.teacher?.subject}</td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={
                                a.status === 'Hadir'
                                  ? 'success'
                                  : a.status === 'Sakit'
                                  ? 'warning'
                                  : a.status === 'Izin'
                                  ? 'info'
                                  : 'danger'
                              }
                            >
                              {a.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{a.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: TAMBAH GURU */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Tambah Data Guru Baru"
          subtitle="Isi NIP, nama guru, mata pelajaran, dan kontak guru"
        >
          <form onSubmit={handleCreateTeacher} className="space-y-4">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="NIP Guru"
                required
                icon={Hash}
                placeholder="198501012010011001"
                value={teacherFormData.nip}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, nip: e.target.value })}
              />

              <FormInput
                label="Nama Lengkap Guru"
                required
                icon={User}
                placeholder="Drs. H. Ahmad Wijaya, M.Pd"
                value={teacherFormData.name}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Mata Pelajaran / Jabatan"
                required
                icon={BookOpen}
                placeholder="Matematika Terapan"
                value={teacherFormData.subject}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, subject: e.target.value })}
              />

              <FormSelect
                label="Status Keaktifan"
                value={teacherFormData.status}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, status: e.target.value })}
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </FormSelect>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <FormInput
                label="Email Guru"
                type="email"
                icon={Mail}
                placeholder="guru@sekolah.sch.id"
                value={teacherFormData.email}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
              />

              <FormInput
                label="No. HP / WhatsApp"
                type="tel"
                icon={Phone}
                placeholder="081234567890"
                value={teacherFormData.phone}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Data Guru'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL 2: EDIT GURU */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Data Guru"
          subtitle={selectedTeacher ? `${selectedTeacher.name} — NIP: ${selectedTeacher.nip}` : ''}
        >
          <form onSubmit={handleUpdateTeacher} className="space-y-4">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="NIP Guru"
                required
                icon={Hash}
                value={teacherFormData.nip}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, nip: e.target.value })}
              />

              <FormInput
                label="Nama Lengkap Guru"
                required
                icon={User}
                value={teacherFormData.name}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Mata Pelajaran / Jabatan"
                required
                icon={BookOpen}
                value={teacherFormData.subject}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, subject: e.target.value })}
              />

              <FormSelect
                label="Status Keaktifan"
                value={teacherFormData.status}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, status: e.target.value })}
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </FormSelect>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <FormInput
                label="Email Guru"
                type="email"
                icon={Mail}
                value={teacherFormData.email}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
              />

              <FormInput
                label="No. HP / WhatsApp"
                type="tel"
                icon={Phone}
                value={teacherFormData.phone}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  'Perbarui Data Guru'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL 3: IMPORT EXCEL DATA GURU */}
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Data Guru dari File Excel"
          subtitle="Unggah file .xlsx, .xls, atau .csv untuk menambahkan data guru sekaligus"
        >
          <form onSubmit={handleSaveImportTeachers} className="space-y-5">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Unduh Format Template Excel Guru</p>
                <p className="text-[11px] text-slate-500">Gunakan template resmi agar kolom NIP, Nama, Mapel, Email, HP sesuai format.</p>
              </div>
              <button
                type="button"
                onClick={downloadTeacherExcelTemplate}
                className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 rounded-lg shadow-2xs transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Template (.xlsx)
              </button>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/20 p-6 rounded-2xl text-center cursor-pointer transition-colors">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-teacher-file-input"
              />
              <label htmlFor="excel-teacher-file-input" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {importFile ? importFile.name : 'Klik untuk memilih file Excel (.xlsx / .csv)'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Mendukung format Microsoft Excel & CSV</p>
              </label>
            </div>

            {/* Preview Data */}
            {importedTeachers.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Preview Import ({importedTeachers.length} Baris Data)
                </h4>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-[11px] text-slate-700">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">NIP</th>
                        <th className="py-2 px-3">Nama Guru</th>
                        <th className="py-2 px-3">Mata Pelajaran</th>
                        <th className="py-2 px-3">No. HP</th>
                        <th className="py-2 px-3">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importedTeachers.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-emerald-800">{row.nip}</td>
                          <td className="py-2 px-3 font-semibold">{row.name}</td>
                          <td className="py-2 px-3">{row.subject}</td>
                          <td className="py-2 px-3">{row.phone || '-'}</td>
                          <td className="py-2 px-3">{row.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importedTeachers.length > 10 && (
                    <p className="text-[10px] text-slate-400 text-center py-2 bg-slate-50 border-t border-slate-100">
                      + {importedTeachers.length - 10} baris lainnya...
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || importedTeachers.length === 0}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Meng-import...
                  </>
                ) : (
                  `Simpan ${importedTeachers.length} Data Guru`
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL 4: CATAT PRESENSI GURU BATCH */}
        <Modal
          isOpen={isTeacherAttendanceModalOpen}
          onClose={() => setIsTeacherAttendanceModalOpen(false)}
          title="Catat Presensi Guru (Harian)"
          subtitle={`Pencatatan kehadiran guru untuk tanggal: ${attendanceDate}`}
        >
          <form onSubmit={handleSaveTeacherAttendance} className="space-y-5">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div>
                <span className="text-xs font-bold text-slate-800">Tanggal Presensi</span>
                <p className="text-[11px] text-slate-500">{attendanceDate}</p>
              </div>
              <FormInput
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-40"
              />
            </div>

            {/* List active teachers with status controls */}
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1 custom-scrollbar border border-slate-200 rounded-xl p-3">
              {teachers.filter((t) => t.status === 'Aktif').length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400">
                  <p className="font-semibold text-xs">Belum ada guru dengan status Aktif</p>
                </div>
              ) : (
                teachers
                  .filter((t) => t.status === 'Aktif')
                  .map((t) => {
                    const stData = batchAttendanceStatuses[t.id] || { status: 'Hadir', notes: '' };
                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-slate-50/80 hover:bg-emerald-50/30 border border-slate-100 transition-colors space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{t.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              NIP: {t.nip} | {t.subject}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {[
                              { key: 'Hadir', label: 'Hadir', color: 'emerald' },
                              { key: 'Sakit', label: 'Sakit', color: 'amber' },
                              { key: 'Izin', label: 'Izin', color: 'sky' },
                              { key: 'Alpha', label: 'Alpha', color: 'rose' },
                            ].map((stOpt) => {
                              const isSel = stData.status === stOpt.key;
                              const activeStyles: Record<string, string> = {
                                emerald: 'bg-emerald-600 text-white font-bold',
                                amber: 'bg-amber-500 text-white font-bold',
                                sky: 'bg-sky-600 text-white font-bold',
                                rose: 'bg-rose-600 text-white font-bold',
                              };
                              return (
                                <button
                                  key={stOpt.key}
                                  type="button"
                                  onClick={() =>
                                    setBatchAttendanceStatuses((prev) => ({
                                      ...prev,
                                      [t.id]: { ...stData, status: stOpt.key as any },
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded-md text-[11px] border transition-all ${
                                    isSel
                                      ? activeStyles[stOpt.color]
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {stOpt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Catatan / keterangan tambahan (opsional)..."
                          value={stData.notes}
                          onChange={(e) =>
                            setBatchAttendanceStatuses((prev) => ({
                              ...prev,
                              [t.id]: { ...stData, notes: e.target.value },
                            }))
                          }
                          className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTeacherAttendanceModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Presensi Guru'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
