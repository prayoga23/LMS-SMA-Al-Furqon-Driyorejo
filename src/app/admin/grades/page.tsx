'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FormInput, FormSelect, FormStudentCombobox } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
  Lock,
  Eye,
  Download,
  TrendingUp,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    major?: string;
  };
}

interface Student {
  id: number;
  name: string;
  nis: string;
  class: string;
  major?: string;
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
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'subjects'>('students');

  const isGuru = user?.role === 'guru';
  const teacherSubject = user?.subject || '';

  // Filters
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [predicateFilter, setPredicateFilter] = useState('');

  // Detail Student Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [detailSemester, setDetailSemester] = useState('Semester 1');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Modals & Toast
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);

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

  const handleOpenAddModal = (studentId?: number) => {
    setError('');
    setFormData({
      student_id: studentId ? studentId.toString() : (students.length > 0 ? students[0].id.toString() : ''),
      subject: isGuru && teacherSubject ? teacherSubject : POPULAR_SUBJECTS[0],
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

  const handleOpenDetailModal = (student: Student) => {
    setSelectedStudentDetail(student);
    setDetailSemester(semesterFilter || 'Semester 1');
    setIsDetailModalOpen(true);
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

  const handleDownloadPDF = async () => {
    if (!pdfRef.current || !selectedStudentDetail) return;
    setDownloadingPdf(true);
    try {
      const element = pdfRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Rapor_${selectedStudentDetail.name.replace(/\s+/g, '_')}_${detailSemester}.pdf`);
    } catch (err) {
      console.error('PDF export error', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSemesterFilter('');
    setPredicateFilter('');
  };

  // Grouping students summary
  const studentSummaries = students.map((s) => {
    const studentGrades = grades.filter((g) => {
      if (g.studentId !== s.id) return false;
      if (semesterFilter && g.semester !== semesterFilter) return false;
      return true;
    });

    const totalScore = studentGrades.reduce((sum, g) => sum + g.score, 0);
    const avgScore = studentGrades.length > 0 ? Number((totalScore / studentGrades.length).toFixed(1)) : 0;
    const overallPred = studentGrades.length > 0 ? calculatePredicate(avgScore) : '-';

    return {
      student: s,
      subjectCount: studentGrades.length,
      averageScore: avgScore,
      overallPredicate: overallPred,
      gradesList: studentGrades,
    };
  });

  const filteredStudentSummaries = studentSummaries.filter(({ student, overallPredicate }) => {
    let match = true;
    if (search) {
      const q = search.toLowerCase();
      match =
        student.name.toLowerCase().includes(q) ||
        student.nis.toLowerCase().includes(q) ||
        student.class.toLowerCase().includes(q);
    }
    if (match && predicateFilter) {
      match = overallPredicate === predicateFilter;
    }
    return match;
  });

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

  // Selected student grades for Detail Modal
  const detailGrades = selectedStudentDetail
    ? grades.filter(
        (g) => g.studentId === selectedStudentDetail.id && (!detailSemester || g.semester === detailSemester)
      )
    : [];

  const detailAvgScore =
    detailGrades.length > 0
      ? Number((detailGrades.reduce((acc, curr) => acc + curr.score, 0) / detailGrades.length).toFixed(1))
      : 0;

  const detailChartData = detailGrades.map((g) => ({
    subject: g.subject.length > 15 ? g.subject.substring(0, 15) + '...' : g.subject,
    score: g.score,
  }));

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
            <p className="text-xs text-slate-500 mt-1">
              Rekapitulasi rapor per siswa, transkrip nilai digital, dan pengisian nilai mata pelajaran
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/grades/create"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Input Nilai Mata Pelajaran
            </Link>
          </div>
        </div>

        {/* Banner Mode Guru */}
        {isGuru && (
          <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-emerald-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white shrink-0 border border-white/20">
                <BookOpen className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                  Mode Pengelolaan Nilai Guru ({user?.name})
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Anda memiliki akses penilai khusus untuk Mata Pelajaran:{' '}
                  <span className="font-black text-amber-300 underline">
                    {teacherSubject || 'Sesuai Penugasan'}
                  </span>
                </p>
              </div>
            </div>
            <Badge variant="emerald" className="bg-emerald-950/60 text-emerald-200 border border-emerald-400/40 px-3 py-1 text-xs">
              Mapel: {teacherSubject || 'Guru'}
            </Badge>
          </div>
        )}

        {/* Toolbar & View Tabs */}
        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('students')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'students'
                    ? 'bg-white text-purple-900 shadow-xs border border-purple-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 text-purple-600" />
                Rekap Rapor Per Siswa
              </button>
              <button
                onClick={() => setActiveTab('subjects')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'subjects'
                    ? 'bg-white text-purple-900 shadow-xs border border-purple-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Daftar Per Mata Pelajaran
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
              <div className="w-full sm:w-64">
                <FormInput
                  icon={Search}
                  placeholder="Cari Siswa, NIS, atau Mapel..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClear={search ? () => setSearch('') : undefined}
                />
              </div>

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
        </div>

        {/* TAB 1: REKAP PER SISWA (DEFAULT) */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-purple-50/70 uppercase text-[10px] text-purple-950 font-bold border-b border-purple-100 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">NIS</th>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4">Kelas & Jurusan</th>
                    <th className="py-3.5 px-4">Jumlah Mapel</th>
                    <th className="py-3.5 px-4">Rata-Rata Nilai</th>
                    <th className="py-3.5 px-4">Predikat Utama</th>
                    <th className="py-3.5 px-4 text-center">Aksi Rapor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-medium">Memuat rekap data rapor siswa...</p>
                      </td>
                    </tr>
                  ) : filteredStudentSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">Tidak ada data siswa ditemukan</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudentSummaries.map(({ student, subjectCount, averageScore, overallPredicate }) => (
                      <tr key={student.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-900">{student.nis}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {student.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="purple">{student.class}</Badge>
                            {student.major && (
                              <span className="text-[10px] font-semibold text-slate-500">{student.major}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {subjectCount} Mapel
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                          {subjectCount > 0 ? averageScore : '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          {subjectCount > 0 ? (
                            <Badge
                              variant={
                                overallPredicate === 'A'
                                  ? 'success'
                                  : overallPredicate === 'B'
                                  ? 'info'
                                  : overallPredicate === 'C'
                                  ? 'warning'
                                  : 'danger'
                              }
                            >
                              Predikat {overallPredicate}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 font-normal">Belum diinput</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/admin/grades/student/${student.id}`}
                              className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-950 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                              title="Lihat Detail Rapor Digital Siswa"
                            >
                              <Eye className="w-3.5 h-3.5 text-purple-600" />
                              <span>Detail Rapor</span>
                            </Link>

                            <button
                              onClick={() => handleOpenAddModal(student.id)}
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Input Nilai Mapel Siswa Ini"
                            >
                              <Plus className="w-4 h-4" />
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
        )}

        {/* TAB 2: DAFTAR PER MATA PELAJARAN */}
        {activeTab === 'subjects' && (
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
        )}

        {/* MODAL DETAIL RAPOR SISWA */}
        <Modal
          isOpen={isDetailModalOpen}
          maxWidth="max-w-4xl"
          onClose={() => setIsDetailModalOpen(false)}
          title="Detail Rapor Hasil Belajar Siswa"
          subtitle={
            selectedStudentDetail
              ? `${selectedStudentDetail.name} — NIS: ${selectedStudentDetail.nis} (${selectedStudentDetail.class})`
              : 'Transkrip nilai rapor siswa'
          }
        >
          {selectedStudentDetail && (
            <div className="space-y-6">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Filter Semester Rapor:</span>
                  <select
                    value={detailSemester}
                    onChange={(e) => setDetailSemester(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenAddModal(selectedStudentDetail.id);
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Nilai</span>
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingPdf ? 'Mengunduh...' : 'Download PDF Rapor'}</span>
                  </button>
                </div>
              </div>

              {/* Printable Content Area */}
              <div ref={pdfRef} className="space-y-6 p-2 bg-white rounded-2xl">
                {/* Profile Banner Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
                      TRANSKRIP RAPOR DIGITAL — SMA AL-FURQON DRIYOREJO
                    </span>
                    <h3 className="text-xl font-black mt-1 tracking-tight">{selectedStudentDetail.name}</h3>
                    <p className="text-xs text-purple-200 mt-1">
                      NIS: <span className="font-mono font-bold text-white">{selectedStudentDetail.nis}</span> • Kelas:{' '}
                      <span className="font-semibold text-white">{selectedStudentDetail.class}</span> • {detailSemester} (2026/2027)
                    </p>
                  </div>

                  <div className="px-5 py-3 rounded-xl bg-white/15 border border-white/20 text-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-purple-200 block">RATA-RATA NILAI</span>
                    <span className="text-3xl font-black text-amber-300">{detailAvgScore}</span>
                  </div>
                </div>

                {/* Chart Section */}
                {detailGrades.length > 0 && (
                  <div className="p-4 rounded-xl border border-purple-100 bg-slate-50/50 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      Grafik Nilai Per Mata Pelajaran ({detailSemester})
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={detailChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                          <XAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', color: '#0f172a' }}
                          />
                          <Bar dataKey="score" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Table Breakdown */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 uppercase text-[10px] text-slate-700 font-bold border-b border-slate-200 tracking-wider">
                      <tr>
                        <th className="py-3 px-4 w-12">No</th>
                        <th className="py-3 px-4">Mata Pelajaran</th>
                        <th className="py-3 px-4">Semester</th>
                        <th className="py-3 px-4">Nilai Akhir</th>
                        <th className="py-3 px-4">Predikat</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailGrades.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400">
                            Belum ada nilai terdaftar untuk {detailSemester}.
                          </td>
                        </tr>
                      ) : (
                        detailGrades.map((g, idx) => (
                          <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{g.subject}</td>
                            <td className="py-3 px-4 text-slate-600">{g.semester}</td>
                            <td className="py-3 px-4 font-black text-slate-900 text-sm">{g.score}</td>
                            <td className="py-3 px-4">
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
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(g)}
                                  className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
                                  title="Edit Nilai"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(g.id, g.subject)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Hapus Nilai"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
        </Modal>

        {/* Modal Add Grade */}
        <Modal
          isOpen={isAddModalOpen}
          maxWidth="max-w-3xl"
          onClose={() => setIsAddModalOpen(false)}
          title="Input Nilai Mata Pelajaran"
          subtitle="Masukkan nilai siswa per mata pelajaran"
        >
          <form onSubmit={handleCreate} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  icon={isGuru ? Lock : BookOpen}
                  placeholder="Pemrograman Web"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  disabled={isGuru}
                  readOnly={isGuru}
                />
                {isGuru ? (
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    Mapel dikunci khusus sesuai bidang penugasan Anda
                  </p>
                ) : (
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
                )}
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
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Nilai Akhir (0 - 100) <span className="text-rose-500 font-bold">*</span>
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

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Nilai</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Edit Grade */}
        <Modal
          isOpen={isEditModalOpen}
          maxWidth="max-w-3xl"
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Nilai Mata Pelajaran"
          subtitle="Perbarui nilai dan predikat siswa"
        >
          <form onSubmit={handleUpdate} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Mata Pelajaran"
                required
                icon={isGuru ? Lock : BookOpen}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                disabled={isGuru}
                readOnly={isGuru}
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

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Nilai Akhir <span className="text-rose-500 font-bold">*</span>
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

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memperbarui...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Perbarui Nilai</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
