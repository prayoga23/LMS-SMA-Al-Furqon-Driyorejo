'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FormInput, FormSelect, FormStudentCombobox } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  Plus,
  CalendarCheck,
  Edit,
  Trash2,
  Calendar,
  UserCheck,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  User,
  RefreshCw,
  X,
  Users,
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
  student_id: number;
  date: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
  student?: {
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

const MAJOR_OPTIONS = [
  'IPA (MIPA)',
  'IPS',
];

export default function AdminAttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Modals & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form Single State
  const [formData, setFormData] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Hadir' as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha',
  });

  // Batch Form State per Kelas & Jurusan
  const [batchClass, setBatchClass] = useState('X RPL 1');
  const [batchMajor, setBatchMajor] = useState('Rekayasa Perangkat Lunak');
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<number, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendances();
    fetchStudents();
  }, [selectedDate]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendances', {
        params: { date: selectedDate },
      });
      setAttendances(res.data);
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

  const filteredAttendances = attendances.filter((a) => {
    let match = true;
    if (search) {
      const q = search.toLowerCase();
      match =
        (a.student?.name || '').toLowerCase().includes(q) ||
        (a.student?.nis || '').toLowerCase().includes(q) ||
        (a.student?.class || '').toLowerCase().includes(q);
    }
    if (match && statusFilter) {
      match = a.status === statusFilter;
    }
    if (match && selectedClass) {
      match = a.student?.class === selectedClass;
    }
    return match;
  });

  // --- SINGLE ATTENDANCE ---
  const handleOpenAddModal = () => {
    setFormData({
      student_id: students.length > 0 ? String(students[0].id) : '',
      date: new Date().toISOString().split('T')[0],
      status: 'Hadir',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id) {
      setError('Silakan pilih siswa.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/attendances', formData);
      setIsModalOpen(false);
      showToast('success', 'Catatan presensi berhasil disimpan.');
      fetchAttendances();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menginput absensi.');
      showToast('error', 'Gagal menginput presensi');
    } finally {
      setSubmitting(false);
    }
  };

  // --- BATCH ATTENDANCE PER KELAS & JURUSAN ---
  const handleOpenBatchModal = () => {
    setBatchClass('X RPL 1');
    setBatchMajor('Rekayasa Perangkat Lunak');
    setBatchDate(new Date().toISOString().split('T')[0]);
    setError('');
    setIsBatchModalOpen(true);
  };

  const batchStudents = students.filter(
    (s) => s.class === batchClass && (!batchMajor || s.major === batchMajor)
  );

  useEffect(() => {
    if (isBatchModalOpen) {
      const initial: Record<number, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'> = {};
      batchStudents.forEach((s) => {
        initial[s.id] = attendanceStatuses[s.id] || 'Hadir';
      });
      setAttendanceStatuses(initial);
    }
  }, [isBatchModalOpen, batchClass, batchMajor]);

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchStudents.length === 0) {
      setError('Tidak ada siswa pada kelas & jurusan ini.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const items = batchStudents.map((s) => ({
        student_id: s.id,
        status: attendanceStatuses[s.id] || 'Hadir',
      }));

      await api.post('/attendances', {
        date: batchDate,
        items,
      });

      setIsBatchModalOpen(false);
      showToast('success', `Presensi untuk ${items.length} siswa kelas ${batchClass} berhasil disimpan.`);
      fetchAttendances();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan absensi kelas.');
      showToast('error', 'Gagal menginput presensi batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, studentName?: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data presensi ${studentName || ''}?`)) return;
    try {
      await api.delete(`/attendances/${id}`);
      showToast('info', 'Catatan presensi telah dihapus.');
      fetchAttendances();
    } catch (err) {
      showToast('error', 'Gagal menghapus absensi');
    }
  };

  const setDatePreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysOffset);
    setFormData((prev) => ({ ...prev, date: d.toISOString().split('T')[0] }));
  };

  const summary = {
    Hadir: attendances.filter((a) => a.status === 'Hadir').length,
    Sakit: attendances.filter((a) => a.status === 'Sakit').length,
    Izin: attendances.filter((a) => a.status === 'Izin').length,
    Alpha: attendances.filter((a) => a.status === 'Alpha').length,
  };

  const chartData = [
    { name: 'Hadir', count: summary.Hadir, fill: '#10b981' },
    { name: 'Sakit', count: summary.Sakit, fill: '#f59e0b' },
    { name: 'Izin', count: summary.Izin, fill: '#3b82f6' },
    { name: 'Alpha', count: summary.Alpha, fill: '#ef4444' },
  ];

  const resetFilters = () => {
    setSearch('');
    setSelectedDate('');
    setStatusFilter('');
    setSelectedClass('');
  };

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-6 animate-fade-in">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <CalendarCheck className="w-6 h-6 text-emerald-700" />
              Manajemen Presensi & Kehadiran Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-1">Pencatatan presensi harian per siswa & per kelas/jurusan, grafik rekapitulasi</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenBatchModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Users className="w-4 h-4" />
              Presensi per Kelas & Jurusan
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Input Presensi Individu
            </button>
          </div>
        </div>

        {/* Summary KPI Cards & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="grid grid-cols-2 gap-4 lg:col-span-1">
            <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/60 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{summary.Hadir}</h3>
            </div>
            <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/60 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Sakit
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{summary.Sakit}</h3>
            </div>
            <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-200/60 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Izin
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{summary.Izin}</h3>
            </div>
            <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200/60 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Alpha
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{summary.Alpha}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>Rekapitulasi Visual Kehadiran Siswa</span>
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="w-full lg:w-72">
            <FormInput
              icon={Search}
              placeholder="Cari Siswa, NIS, atau Kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={search ? () => setSearch('') : undefined}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <FormSelect
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-36"
            >
              <option value="">Semua Kelas</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </FormSelect>

            <FormInput
              type="date"
              icon={Calendar}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />

            <FormSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36"
            >
              <option value="">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Sakit">Sakit</option>
              <option value="Izin">Izin</option>
              <option value="Alpha">Alpha</option>
            </FormSelect>

            {(search || selectedDate || statusFilter || selectedClass) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            <button
              onClick={fetchAttendances}
              className="p-2.5 text-slate-600 hover:text-emerald-700 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50/70 uppercase text-[10px] text-emerald-950 font-bold border-b border-emerald-100 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Kelas & Jurusan</th>
                  <th className="py-3.5 px-4">Status Kehadiran</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Memuat data presensi...</p>
                    </td>
                  </tr>
                ) : filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Belum ada catatan presensi</p>
                    </td>
                  </tr>
                ) : (
                  filteredAttendances.map((a) => (
                    <tr key={a.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{a.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {a.student?.name}
                        <span className="block text-[10px] text-slate-500 font-mono font-normal">
                          NIS: {a.student?.nis}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="purple">{a.student?.class}</Badge>
                        {a.student?.major && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">{a.student.major}</span>
                        )}
                      </td>
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
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(a.id, a.student?.name)}
                          className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Hapus Presensi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: BATCH ATTENDANCE PER KELAS & JURUSAN */}
        <Modal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          title="Catat Presensi Siswa per Kelas & Jurusan"
          subtitle="Pilih kelas & jurusan untuk melakukan checklist absensi siswa secara serentak"
        >
          <form onSubmit={handleSubmitBatch} className="space-y-5">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
              <FormSelect
                label="Pilih Kelas"
                value={batchClass}
                onChange={(e) => setBatchClass(e.target.value)}
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </FormSelect>

              <FormSelect
                label="Pilih Jurusan"
                value={batchMajor}
                onChange={(e) => setBatchMajor(e.target.value)}
              >
                {MAJOR_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </FormSelect>

              <FormInput
                label="Tanggal Presensi"
                type="date"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Siswa ({batchStudents.length} Siswa)
                </span>
                <span className="text-[11px] text-slate-500">
                  {batchClass} — {batchMajor}
                </span>
              </div>

              {batchStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  <p className="font-semibold text-xs">Tidak ada siswa terdaftar di kelas & jurusan ini</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar border border-slate-200 rounded-xl p-2">
                  {batchStudents.map((st) => {
                    const currentStatus = attendanceStatuses[st.id] || 'Hadir';
                    return (
                      <div
                        key={st.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50/80 hover:bg-emerald-50/30 border border-slate-100 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{st.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">NIS: {st.nis}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {[
                            { key: 'Hadir', label: 'Hadir', color: 'emerald' },
                            { key: 'Sakit', label: 'Sakit', color: 'amber' },
                            { key: 'Izin', label: 'Izin', color: 'sky' },
                            { key: 'Alpha', label: 'Alpha', color: 'rose' },
                          ].map((stOpt) => {
                            const isSel = currentStatus === stOpt.key;
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
                                  setAttendanceStatuses((prev) => ({ ...prev, [st.id]: stOpt.key as any }))
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
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || batchStudents.length === 0}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Presensi Kelas'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL 2: SINGLE ATTENDANCE */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Catat Presensi Siswa Individu"
          subtitle="Pilih siswa, tanggal, dan status kehadiran"
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
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-medium text-slate-400 mr-1">Cepat:</span>
                  <button
                    type="button"
                    onClick={() => setDatePreset(0)}
                    className="px-2 py-0.5 text-[11px] font-medium bg-white hover:border-emerald-300 hover:text-emerald-700 rounded-md text-slate-600 border border-slate-200 transition-colors"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset(1)}
                    className="px-2 py-0.5 text-[11px] font-medium bg-white hover:border-emerald-300 hover:text-emerald-700 rounded-md text-slate-600 border border-slate-200 transition-colors"
                  >
                    Kemarin
                  </button>
                </div>
              </div>
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
        </Modal>
      </div>
    </DashboardLayout>
  );
}
