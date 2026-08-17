'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FormInput, FormSelect, FormStudentCombobox } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Search,
  Award,
  Filter,
  User,
  Calendar,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';

interface Grade {
  id: number;
  studentId: number;
  subject: string;
  semester: string;
  score: number;
  predicate: string;
  student?: {
    id: number;
    name: string;
    nis: string;
    class: string;
  };
}

interface Student {
  id: number;
  name: string;
  nis: string;
  class: string;
}

const POPULAR_SUBJECTS = [
  'Pemrograman Web & Perangkat Bergerak',
  'Basis Data',
  'Pemodelan Perangkat Lunak',
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Pendidikan Agama Islam',
  'Pancasila & Kewarganegaraan',
];

export default function AdminGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [predicateFilter, setPredicateFilter] = useState('');

  // Modals & Toast
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    subject: '',
    semester: 'Semester 1',
    score: 80,
    predicate: 'B',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGrades();
    fetchStudents();
  }, [semesterFilter]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const res = await api.get('/grades', {
        params: { semester: semesterFilter || undefined },
      });
      setGrades(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data nilai rapor');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
      if (res.data.length > 0) {
        setFormData((prev) => ({ ...prev, student_id: res.data[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredGrades = grades.filter((g) => {
    let match = true;
    if (search) {
      const q = search.toLowerCase();
      match =
        (g.student?.name || '').toLowerCase().includes(q) ||
        (g.student?.nis || '').toLowerCase().includes(q) ||
        (g.subject || '').toLowerCase().includes(q);
    }
    if (match && predicateFilter) {
      match = g.predicate === predicateFilter;
    }
    return match;
  });

  const calculatePredicate = (scoreNum: number) => {
    if (scoreNum >= 85) return 'A';
    if (scoreNum >= 75) return 'B';
    if (scoreNum >= 65) return 'C';
    return 'D';
  };

  const handleScoreChange = (val: string | number) => {
    const num = Math.min(100, Math.max(0, Number(val) || 0));
    const pred = calculatePredicate(num);
    setFormData((prev) => ({ ...prev, score: num, predicate: pred }));
  };

  const handleOpenAddModal = () => {
    setError('');
    setFormData({
      student_id: students.length > 0 ? students[0].id.toString() : '',
      subject: POPULAR_SUBJECTS[0],
      semester: 'Semester 1',
      score: 80,
      predicate: 'B',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (grade: Grade) => {
    setError('');
    setSelectedGrade(grade);
    setFormData({
      student_id: grade.studentId.toString(),
      subject: grade.subject,
      semester: grade.semester,
      score: grade.score,
      predicate: grade.predicate,
    });
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || !formData.subject.trim()) {
      setError('Siswa dan mata pelajaran wajib diisi.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      await api.post('/grades', formData);
      setIsAddModalOpen(false);
      showToast('success', `Nilai ${formData.subject} berhasil disimpan.`);
      fetchGrades();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan nilai.');
      showToast('error', 'Gagal menyimpan nilai');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade) return;
    setError('');
    setSubmitting(true);

    try {
      await api.put(`/grades/${selectedGrade.id}`, formData);
      setIsEditModalOpen(false);
      showToast('success', `Nilai ${formData.subject} berhasil diperbarui.`);
      fetchGrades();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memperbarui nilai.');
      showToast('error', 'Gagal memperbarui nilai');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, subjectName?: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus nilai mata pelajaran ${subjectName || ''}?`)) return;
    try {
      await api.delete(`/grades/${id}`);
      showToast('info', 'Nilai mata pelajaran telah dihapus.');
      fetchGrades();
    } catch (err) {
      showToast('error', 'Gagal menghapus nilai');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSemesterFilter('');
    setPredicateFilter('');
  };

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-6 animate-fade-in">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-purple-600" />
              Manajemen Rapor & Nilai Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-1">Input nilai mata pelajaran, kalkulasi predikat otomatis, & pengisian rekapitulasi</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Input Nilai Mata Pelajaran
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="w-full lg:w-80">
            <FormInput
              icon={Search}
              placeholder="Cari Siswa, NIS, atau Mata Pelajaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={search ? () => setSearch('') : undefined}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-600 shrink-0" />
              <FormSelect
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-36"
              >
                <option value="">Semua Semester</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </FormSelect>
            </div>

            <FormSelect
              value={predicateFilter}
              onChange={(e) => setPredicateFilter(e.target.value)}
              className="w-36"
            >
              <option value="">Semua Predikat</option>
              <option value="A">Predikat A (Sangat Baik)</option>
              <option value="B">Predikat B (Baik)</option>
              <option value="C">Predikat C (Cukup)</option>
              <option value="D">Predikat D (Perlu Pembinaan)</option>
            </FormSelect>

            {(search || semesterFilter || predicateFilter) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            <button
              onClick={fetchGrades}
              className="p-2.5 text-slate-600 hover:text-purple-700 rounded-xl bg-slate-50 border border-slate-200 hover:bg-purple-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-purple-50/60 uppercase text-[10px] text-purple-950 font-bold border-b border-purple-100 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Semester</th>
                  <th className="py-3.5 px-4">Mata Pelajaran</th>
                  <th className="py-3.5 px-4">Nilai Akhir</th>
                  <th className="py-3.5 px-4">Predikat</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Memuat data nilai rapor...</p>
                    </td>
                  </tr>
                ) : filteredGrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Belum ada nilai terdaftar</p>
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map((g) => (
                    <tr key={g.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {g.student?.name}
                        <span className="block text-[10px] text-slate-500 font-mono font-normal">
                          NIS: {g.student?.nis}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="purple">{g.student?.class}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{g.semester}</td>
                      <td className="py-3.5 px-4 font-bold text-purple-900">{g.subject}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">{g.score}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            g.predicate === 'A'
                              ? 'success'
                              : g.predicate === 'B'
                              ? 'info'
                              : g.predicate === 'C'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          Predikat {g.predicate}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(g)}
                            className="p-2 text-purple-700 hover:text-purple-950 hover:bg-purple-100/70 rounded-xl transition-colors"
                            title="Edit Nilai"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(g.id, g.subject)}
                            className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Hapus Nilai"
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

        {/* Modal Add Grade */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Input Nilai Mata Pelajaran"
          subtitle="Masukkan nilai siswa per mata pelajaran"
        >
          <form onSubmit={handleCreate} className="space-y-6">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  label="Mata Pelajaran"
                  required
                  icon={BookOpen}
                  placeholder="Pemrograman Web"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-medium mr-0.5">Cepat:</span>
                  {POPULAR_SUBJECTS.slice(0, 3).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, subject: sub }))}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 transition-colors"
                    >
                      {sub.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <FormSelect
                label="Semester"
                required
                icon={Calendar}
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </FormSelect>
            </div>

            {/* Score Card */}
            <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                  Nilai Akhir (0 - 100) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-slate-400">Predikat:</span>
                  <Badge
                    variant={
                      formData.predicate === 'A' ? 'success'
                      : formData.predicate === 'B' ? 'info'
                      : formData.predicate === 'C' ? 'warning'
                      : 'danger'
                    }
                  >
                    {formData.predicate} ({formData.score >= 85 ? 'Sangat Baik' : formData.score >= 75 ? 'Baik' : formData.score >= 65 ? 'Cukup' : 'Perlu Pembinaan'})
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-3 flex items-center gap-4">
                  <FormInput
                    type="number"
                    required
                    min={0}
                    max={100}
                    icon={Award}
                    value={formData.score}
                    onChange={(e) => handleScoreChange(e.target.value)}
                    className="w-24 text-center font-bold"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => handleScoreChange(e.target.value)}
                    className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>

                <div className="md:col-span-1">
                  <FormInput
                    label="Predikat Custom"
                    icon={Sparkles}
                    value={formData.predicate}
                    onChange={(e) => setFormData({ ...formData, predicate: e.target.value.toUpperCase() })}
                  />
                </div>
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
                  'Simpan Nilai'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Edit Grade */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Nilai Mata Pelajaran"
          subtitle="Perbarui nilai dan predikat siswa"
        >
          <form onSubmit={handleUpdate} className="space-y-6">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Mata Pelajaran"
                required
                icon={BookOpen}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
              <FormSelect
                label="Semester"
                required
                icon={Calendar}
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </FormSelect>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                  Nilai Akhir <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-slate-400">Predikat:</span>
                  <Badge
                    variant={
                      formData.predicate === 'A' ? 'success'
                      : formData.predicate === 'B' ? 'info'
                      : formData.predicate === 'C' ? 'warning'
                      : 'danger'
                    }
                  >
                    {formData.predicate}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-3 flex items-center gap-4">
                  <FormInput
                    type="number"
                    required
                    min={0}
                    max={100}
                    icon={Award}
                    value={formData.score}
                    onChange={(e) => handleScoreChange(e.target.value)}
                    className="w-24 text-center font-bold"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => handleScoreChange(e.target.value)}
                    className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>
                <div className="md:col-span-1">
                  <FormInput
                    label="Predikat Custom"
                    icon={Sparkles}
                    value={formData.predicate}
                    onChange={(e) => setFormData({ ...formData, predicate: e.target.value.toUpperCase() })}
                  />
                </div>
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
                  'Perbarui Nilai'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
