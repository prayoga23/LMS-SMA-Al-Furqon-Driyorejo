'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FormInput, FormSelect } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import { downloadStudentExcelTemplate, TargetFieldDef } from '@/lib/excel';
import { ExcelImportModal } from '@/components/ui/ExcelImportModal';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Phone,
  UserCheck,
  GraduationCap,
  RefreshCw,
  BookMarked,
  User,
  Hash,
  Mail,
  Calendar,
  X,
  Sparkles,
  FileSpreadsheet,
  Upload,
  Download,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
} from 'lucide-react';

interface Student {
  id: number;
  nis: string;
  name: string;
  class: string;
  major: string;
  entry_year?: number;
  entryYear?: number;
  isSantri?: boolean;
  is_santri?: boolean;
  residenceType?: string;
  residence_type?: string;
  sppNominal?: number;
  spp_nominal?: number;
  activityNominal?: number;
  activity_nominal?: number;
  hasDiscount?: boolean;
  has_discount?: boolean;
  discountNotes?: string;
  discount_notes?: string;
  parent?: {
    id: number;
    phone: string;
    user?: {
      name: string;
      email: string;
    };
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
  'IPA',
  'IPS',
];

const STUDENT_TARGET_FIELDS: TargetFieldDef[] = [
  {
    key: 'nis',
    label: 'NIS (Nomor Induk Siswa)',
    required: true,
    description: 'Kode unik nomor induk siswa',
    aliases: ['nis', 'no induk', 'nomor induk', 'nisn', 'id siswa'],
  },
  {
    key: 'name',
    label: 'Nama Lengkap Siswa',
    required: true,
    description: 'Nama siswa sesuai dokumen resmi',
    aliases: ['nama', 'nama siswa', 'nama lengkap', 'student name'],
  },
  {
    key: 'class',
    label: 'Kelas',
    required: true,
    description: 'Contoh: X IPA 1, XI IPS 2',
    aliases: ['kelas', 'rombel', 'rombongan belajar', 'class'],
    defaultValue: 'X IPA 1',
  },
  {
    key: 'major',
    label: 'Jurusan / Peminatan',
    required: false,
    description: 'Contoh: IPA (MIPA), IPS, Bahasa',
    aliases: ['jurusan', 'peminatan', 'program', 'major'],
    defaultValue: 'IPA (MIPA)',
  },
  {
    key: 'entry_year',
    label: 'Tahun Masuk',
    required: false,
    description: 'Contoh: 2024',
    type: 'number',
    aliases: ['tahun masuk', 'tahun', 'angkatan', 'entry year'],
    defaultValue: 2024,
  },
  {
    key: 'parent_name',
    label: 'Nama Orang Tua / Wali',
    required: false,
    description: 'Nama ayah/ibu/wali siswa',
    aliases: ['nama orang tua', 'nama ortu', 'nama ayah', 'nama ibu', 'nama wali', 'parent name', 'ortu'],
  },
  {
    key: 'parent_email',
    label: 'Email Orang Tua',
    required: false,
    description: 'Email untuk login akun wali',
    aliases: ['email orang tua', 'email ortu', 'email wali', 'email parent', 'email'],
  },
  {
    key: 'parent_phone',
    label: 'No HP Orang Tua',
    required: false,
    description: 'Nomor WhatsApp/HP orang tua',
    aliases: ['no hp orang tua', 'no hp ortu', 'no telp ortu', 'telepon ortu', 'hp ortu', 'no hp', 'phone'],
  },
];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBatchAttendanceOpen, setIsBatchAttendanceOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form State Single Student
  const [formData, setFormData] = useState({
    nis: '',
    name: '',
    class: 'X IPA 1',
    major: 'IPA (MIPA)',
    entry_year: '2024',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    is_santri: false,
    residence_type: 'Non-Asrama',
    spp_nominal: '500000',
    activity_nominal: '150000',
    has_discount: false,
    discount_notes: '',
  });

  // Batch Attendance State per Kelas & Jurusan
  const [batchClass, setBatchClass] = useState('X IPA 1');
  const [batchMajor, setBatchMajor] = useState('IPA (MIPA)');
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<number, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [search, selectedClass, selectedMajor]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students', {
        params: { search, class: selectedClass },
      });
      let data: Student[] = res.data;
      if (selectedMajor) {
        data = data.filter((s) => s.major === selectedMajor);
      }
      setStudents(data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ABSENSI BATCH PER KELAS & JURUSAN ---
  const handleOpenBatchAttendance = () => {
    setBatchClass(selectedClass || 'X IPA 1');
    setBatchMajor(selectedMajor || 'IPA (MIPA)');
    setBatchDate(new Date().toISOString().split('T')[0]);
    setError('');
    setIsBatchAttendanceOpen(true);
  };

  // Filter students for batch attendance
  const batchStudents = students.filter(
    (s) => s.class === batchClass && (!batchMajor || s.major === batchMajor)
  );

  // Initialize status Hadir when modal or student list changes
  useEffect(() => {
    if (isBatchAttendanceOpen) {
      const initial: Record<number, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'> = {};
      batchStudents.forEach((s) => {
        initial[s.id] = attendanceStatuses[s.id] || 'Hadir';
      });
      setAttendanceStatuses(initial);
    }
  }, [isBatchAttendanceOpen, batchClass, batchMajor]);

  const handleSaveBatchAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchStudents.length === 0) {
      setError('Tidak ada siswa pada kelas & jurusan yang dipilih.');
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

      setIsBatchAttendanceOpen(false);
      showToast('success', `Berhasil menyimpan absensi ${batchStudents.length} siswa kelas ${batchClass}!`);
      fetchStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan absensi kelas.');
      showToast('error', 'Gagal menyimpan absensi');
    } finally {
      setSubmitting(false);
    }
  };

  // --- HANDLER IMPORT EXCEL ---
  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleImportStudentsSubmit = async (mappedData: Record<string, any>[]) => {
    const res = await api.post('/students/import', { students: mappedData });
    fetchStudents();
    showToast('success', res.data.message || 'Import data siswa berhasil!');
    return {
      successCount: res.data.successCount || 0,
      updateCount: res.data.updateCount || 0,
      errors: res.data.errors || [],
      message: res.data.message,
    };
  };

  // --- HANDLERS SINGLE STUDENT CRUD ---
  const handleOpenAddModal = () => {
    setFormData({
      nis: '',
      name: '',
      class: 'X IPA 1',
      major: 'IPA (MIPA)',
      entry_year: '2024',
      parent_name: '',
      parent_email: '',
      parent_phone: '',
      is_santri: false,
      residence_type: 'Non-Asrama',
      spp_nominal: '500000',
      activity_nominal: '150000',
      has_discount: false,
      discount_notes: '',
    });
    setError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      nis: student.nis,
      name: student.name,
      class: student.class,
      major: student.major,
      entry_year: String(student.entryYear || student.entry_year || 2024),
      parent_name: student.parent?.user?.name || '',
      parent_email: student.parent?.user?.email || '',
      parent_phone: student.parent?.phone || '',
      is_santri: Boolean(student.isSantri ?? student.is_santri ?? false),
      residence_type: student.residenceType || student.residence_type || 'Non-Asrama',
      spp_nominal: String(student.sppNominal ?? student.spp_nominal ?? 500000),
      activity_nominal: String(student.activityNominal ?? student.activity_nominal ?? 150000),
      has_discount: Boolean(student.hasDiscount ?? student.has_discount ?? false),
      discount_notes: student.discountNotes || student.discount_notes || '',
    });
    setError('');
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis.trim() || !formData.name.trim()) {
      setError('NIS dan Nama siswa wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/students', formData);
      setIsAddModalOpen(false);
      showToast('success', `Berhasil menambahkan data siswa: ${formData.name}`);
      fetchStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menambahkan data siswa.');
      showToast('error', 'Gagal menambahkan siswa baru');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/students/${selectedStudent.id}`, formData);
      setIsEditModalOpen(false);
      showToast('success', `Data siswa ${formData.name} berhasil diperbarui.`);
      fetchStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memperbarui data siswa.');
      showToast('error', 'Gagal memperbarui data siswa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, studentName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data siswa ${studentName}?`)) return;
    try {
      await api.delete(`/students/${id}`);
      showToast('info', `Siswa ${studentName} telah dihapus.`);
      fetchStudents();
    } catch (err) {
      showToast('error', 'Gagal menghapus data siswa');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedClass('');
    setSelectedMajor('');
  };

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-6 animate-fade-in">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Top Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <BookMarked className="w-6 h-6 text-emerald-700" />
              Manajemen Data Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-1">Kelola NIS, profil siswa, presensi per kelas/jurusan, dan import Excel</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenBatchAttendance}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CalendarCheck className="w-4 h-4" />
              Catat Presensi Kelas & Jurusan
            </button>

            <button
              onClick={handleOpenImportModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import Excel
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Tambah Siswa Baru
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="w-full lg:w-96">
            <FormInput
              icon={Search}
              placeholder="Cari NIS, Nama Siswa, atau Orang Tua..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={search ? () => setSearch('') : undefined}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
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
            </div>

            <FormSelect
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-44"
            >
              <option value="">Semua Jurusan</option>
              {MAJOR_OPTIONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </FormSelect>

            {(search || selectedClass || selectedMajor) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            <button
              onClick={fetchStudents}
              className="p-2.5 text-slate-600 hover:text-emerald-700 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50/70 uppercase text-[10px] text-emerald-950 font-bold border-b border-emerald-100 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">NIS</th>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Kategori & Status</th>
                  <th className="py-3.5 px-4">Tarif Pembayaran</th>
                  <th className="py-3.5 px-4">Kelas & Jurusan</th>
                  <th className="py-3.5 px-4">Orang Tua / Wali</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Memuat data siswa...</p>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada data siswa ditemukan</p>
                      <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter kelas.</p>
                    </td>
                  </tr>
                ) : (
                  students.map((s) => {
                    const isSantri = Boolean(s.isSantri ?? s.is_santri);
                    const residence = s.residenceType || s.residence_type || 'Non-Asrama';
                    const spp = s.sppNominal ?? s.spp_nominal ?? 500000;
                    const activity = s.activityNominal ?? s.activity_nominal ?? 150000;
                    const hasDiscount = Boolean(s.hasDiscount ?? s.has_discount);
                    const discountNotes = s.discountNotes || s.discount_notes;

                    return (
                      <tr key={s.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">{s.nis}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>
                            <span>{s.name}</span>
                            {hasDiscount && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title={discountNotes || 'Keringanan Biaya'}>
                                Keringanan
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={isSantri ? 'success' : 'slate'}>
                              {isSantri ? 'Santri' : 'Non-Santri'}
                            </Badge>
                            <Badge variant={residence === 'Asrama' ? 'purple' : 'info'}>
                              {residence}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-[11px]">
                            <div className="text-amber-900 font-semibold" title="Saluran: Yayasan Pondok Pesantren Al-Furqon">
                              SPP: Rp {Number(spp).toLocaleString('id-ID')}
                            </div>
                            <div className="text-emerald-800 font-medium" title="Saluran: Sekolah (SMA Al-Furqon)">
                              Kegiatan: Rp {Number(activity).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800">{s.class}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{s.major}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {s.parent?.user?.name ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{s.parent.user.name}</span>
                              </div>
                              {s.parent.phone && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{s.parent.phone}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal">-</span>
                          )}
                        </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-2 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100/70 rounded-xl transition-colors"
                            title="Edit Data Siswa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: CATAT PRESENSI PER KELAS & JURUSAN */}
        <Modal
          isOpen={isBatchAttendanceOpen}
          onClose={() => setIsBatchAttendanceOpen(false)}
          title="Catat Presensi Siswa per Kelas & Jurusan"
          subtitle="Pilihan kelas, jurusan, dan checklist presensi siswa sekaligus"
        >
          <form onSubmit={handleSaveBatchAttendance} className="space-y-5">
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

            {/* List Siswa & Status Selection */}
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
                onClick={() => setIsBatchAttendanceOpen(false)}
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

        {/* MODAL 2: IMPORT EXCEL DATA SISWA */}
        <ExcelImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Data Siswa dari Excel"
          subtitle="Unggah file Excel dan sesuaikan kolom untuk menambahkan data siswa secara otomatis"
          targetFields={STUDENT_TARGET_FIELDS}
          downloadTemplateFn={downloadStudentExcelTemplate}
          onImportSubmit={handleImportStudentsSubmit}
        />

        {/* MODAL CREATE SINGLE STUDENT */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Tambah Data Siswa Baru"
          subtitle="Isi data siswa dan informasi wali murid"
        >
          <form onSubmit={handleCreate} className="space-y-6">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">1. Profil Siswa</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <FormInput
                    label="NIS Siswa"
                    required
                    icon={Hash}
                    placeholder="20241099"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  />
                </div>
                <div className="md:col-span-3">
                  <FormInput
                    label="Nama Lengkap Siswa"
                    required
                    icon={User}
                    placeholder="Ahmad Zaki Pratama"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormSelect
                label="Kelas"
                required
                icon={GraduationCap}
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </FormSelect>
              <FormSelect
                label="Jurusan"
                required
                icon={Sparkles}
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              >
                {MAJOR_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </FormSelect>
              <FormSelect
                label="Tahun Masuk"
                required
                icon={Calendar}
                value={formData.entry_year}
                onChange={(e) => setFormData({ ...formData, entry_year: e.target.value })}
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </FormSelect>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                2. Status Santri & Tarif Pembayaran Tersendiri
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/40 p-3.5 rounded-xl border border-amber-100 mb-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
                    Status Santri Pondok
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-800">
                      <input
                        type="radio"
                        name="is_santri_add"
                        checked={formData.is_santri === true}
                        onChange={() => setFormData({ ...formData, is_santri: true })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      Santri Pondok
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-800">
                      <input
                        type="radio"
                        name="is_santri_add"
                        checked={formData.is_santri === false}
                        onChange={() => setFormData({ ...formData, is_santri: false })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      Non-Santri
                    </label>
                  </div>
                </div>

                <FormSelect
                  label="Status Tempat Tinggal"
                  value={formData.residence_type}
                  onChange={(e) => setFormData({ ...formData, residence_type: e.target.value })}
                >
                  <option value="Non-Asrama">Non-Asrama (Pulang-Pergi)</option>
                  <option value="Asrama">Asrama Pondok</option>
                </FormSelect>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Nominal SPP Tersendiri (Rp)"
                  type="number"
                  value={formData.spp_nominal}
                  onChange={(e) => setFormData({ ...formData, spp_nominal: e.target.value })}
                  helperText="Saluran: Yayasan Pondok Pesantren Al-Furqon"
                />
                <FormInput
                  label="Nominal Anggaran Kegiatan (Rp)"
                  type="number"
                  value={formData.activity_nominal}
                  onChange={(e) => setFormData({ ...formData, activity_nominal: e.target.value })}
                  helperText="Saluran: Sekolah (SMA Al-Furqon)"
                />
              </div>

              <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_discount}
                    onChange={(e) => setFormData({ ...formData, has_discount: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  Siswa Meminta / Mendapat Keringanan Biaya (Diskon Khusus)
                </label>

                {formData.has_discount && (
                  <FormInput
                    label="Catatan / Permohonan Keringanan"
                    placeholder="Misal: Keringanan Santri Yatim / Permohonan Wali"
                    value={formData.discount_notes}
                    onChange={(e) => setFormData({ ...formData, discount_notes: e.target.value })}
                  />
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">3. Informasi Orang Tua / Wali</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="Nama Orang Tua / Wali"
                  required
                  icon={UserCheck}
                  placeholder="Bambang Pratama"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                />
                <FormInput
                  label="Email Orang Tua (Login Portal)"
                  type="email"
                  required
                  icon={Mail}
                  placeholder="orangtua@gmail.com"
                  value={formData.parent_email}
                  onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                />
                <FormInput
                  label="No. HP / WhatsApp Wali"
                  type="tel"
                  required
                  icon={Phone}
                  placeholder="08123456789"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
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
                  'Simpan Data Siswa'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL EDIT SINGLE STUDENT */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Data Siswa"
          subtitle={selectedStudent ? `${selectedStudent.name} — ${selectedStudent.nis}` : ''}
        >
          <form onSubmit={handleUpdate} className="space-y-6">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">1. Profil Siswa</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <FormInput
                    label="NIS Siswa"
                    required
                    icon={Hash}
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  />
                </div>
                <div className="md:col-span-3">
                  <FormInput
                    label="Nama Lengkap Siswa"
                    required
                    icon={User}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormSelect
                label="Kelas"
                required
                icon={GraduationCap}
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </FormSelect>
              <FormSelect
                label="Jurusan"
                required
                icon={Sparkles}
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              >
                {MAJOR_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </FormSelect>
              <FormSelect
                label="Tahun Masuk"
                required
                icon={Calendar}
                value={formData.entry_year}
                onChange={(e) => setFormData({ ...formData, entry_year: e.target.value })}
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </FormSelect>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                2. Status Santri & Tarif Pembayaran Tersendiri
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/40 p-3.5 rounded-xl border border-amber-100 mb-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
                    Status Santri Pondok
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-800">
                      <input
                        type="radio"
                        name="is_santri_edit"
                        checked={formData.is_santri === true}
                        onChange={() => setFormData({ ...formData, is_santri: true })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      Santri Pondok
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-800">
                      <input
                        type="radio"
                        name="is_santri_edit"
                        checked={formData.is_santri === false}
                        onChange={() => setFormData({ ...formData, is_santri: false })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      Non-Santri
                    </label>
                  </div>
                </div>

                <FormSelect
                  label="Status Tempat Tinggal"
                  value={formData.residence_type}
                  onChange={(e) => setFormData({ ...formData, residence_type: e.target.value })}
                >
                  <option value="Non-Asrama">Non-Asrama (Pulang-Pergi)</option>
                  <option value="Asrama">Asrama Pondok</option>
                </FormSelect>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Nominal SPP Tersendiri (Rp)"
                  type="number"
                  value={formData.spp_nominal}
                  onChange={(e) => setFormData({ ...formData, spp_nominal: e.target.value })}
                  helperText="Saluran: Yayasan Pondok Pesantren Al-Furqon"
                />
                <FormInput
                  label="Nominal Anggaran Kegiatan (Rp)"
                  type="number"
                  value={formData.activity_nominal}
                  onChange={(e) => setFormData({ ...formData, activity_nominal: e.target.value })}
                  helperText="Saluran: Sekolah (SMA Al-Furqon)"
                />
              </div>

              <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_discount}
                    onChange={(e) => setFormData({ ...formData, has_discount: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  Siswa Meminta / Mendapat Keringanan Biaya (Diskon Khusus)
                </label>

                {formData.has_discount && (
                  <FormInput
                    label="Catatan / Permohonan Keringanan"
                    placeholder="Misal: Keringanan Santri Yatim / Permohonan Wali"
                    value={formData.discount_notes}
                    onChange={(e) => setFormData({ ...formData, discount_notes: e.target.value })}
                  />
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">3. Informasi Orang Tua / Wali</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Nama Orang Tua / Wali"
                  icon={UserCheck}
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                />
                <FormInput
                  label="No. HP / WA Wali"
                  type="tel"
                  icon={Phone}
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
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
                    Memperbarui...
                  </>
                ) : (
                  'Perbarui Data Siswa'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
