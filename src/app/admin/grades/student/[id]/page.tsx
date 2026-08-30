'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  BookOpen,
  Download,
  Plus,
  Trash2,
  Calendar,
  Award,
  User,
  GraduationCap,
  Building2,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  Printer,
  Sparkles,
} from 'lucide-react';

interface Student {
  id: number;
  nis: string;
  name: string;
  class: string;
  major: string;
  entryYear: number;
}

interface GradeRecord {
  id: number;
  subject: string;
  semester: string;
  score: number;
  predicate: string;
}

export default function AdminStudentGradeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [average, setAverage] = useState<number>(0);

  const [selectedSemester, setSelectedSemester] = useState<string>('Semester 1');
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (studentId) {
      fetchStudentGrades();
    }
  }, [studentId, selectedSemester]);

  const fetchStudentGrades = async () => {
    try {
      setLoading(true);
      const url = selectedSemester
        ? `/grades/student/${studentId}?semester=${encodeURIComponent(selectedSemester)}`
        : `/grades/student/${studentId}`;
      const res = await api.get(url);
      setStudent(res.data.student);
      setGrades(res.data.grades || []);
      setAverage(res.data.average || 0);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat transkrip nilai siswa.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGrade = async (gradeId: number, subject: string) => {
    if (!confirm(`Hapus nilai mata pelajaran "${subject}"?`)) return;
    setDeletingId(gradeId);
    try {
      await api.delete(`/grades/${gradeId}`);
      fetchStudentGrades();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus nilai');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading && !student) {
    return (
      <DashboardLayout allowedRole="admin">
        <div className="py-20 text-center text-slate-500">
          <Loader2 className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat transkrip rapor siswa...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout allowedRole="admin">
        <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
          <p className="text-sm font-semibold text-rose-600">{error || 'Siswa tidak ditemukan'}</p>
          <Link
            href="/admin/grades"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Rapor & Nilai
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRole="admin">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12 print:p-0 print:m-0 print:max-w-none">
        {/* Top Header & Actions (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <Link
              href="/admin/grades"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Rapor & Nilai
            </Link>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-purple-600" />
              Detail Rapor Hasil Belajar Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Transkrip hasil akademik, evaluasi nilai per semester, & pencetakan PDF Rapor Digital
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/grades/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambah Nilai
            </Link>
            <button
              type="button"
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4  h-4" />
              Cetak / Download PDF Rapor
            </button>
          </div>
        </div>

        {/* Filter Bar (Hidden in Print) */}
        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-2xs flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Filter Semester Rapor:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
              <option value="">Semua Semester (Gabungan)</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Total <strong className="text-slate-900 font-bold">{grades.length}</strong> Mata Pelajaran Terdaftar
          </span>
        </div>

        {/* OFFICIAL DIGITAL REPORT CARD CONTAINER (PRINTER FRIENDLY) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 print:border-none print:shadow-none print:p-0">
          
          {/* Official Letterhead (Print Only) */}
          <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">YAYASAN PONDOK PESANTREN AL-FURQON</h1>
            <h2 className="text-lg font-bold text-emerald-800">SMA AL-FURQON DRIYOREJO</h2>
            <p className="text-xs text-slate-600">Jl. Raya Driyorejo No. 123, Kabupaten Gresik, Jawa Timur</p>
            <p className="text-[11px] text-slate-500 italic mt-0.5">Portal Pemantauan Akademik & Karakter Siswa</p>
          </div>

          {/* Student Profile Banner */}
          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md print:bg-none print:text-slate-900 print:border print:border-slate-300 print:shadow-none">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 print:text-slate-500">
                TRANSKRIP RAPOR DIGITAL — SMA AL-FURQON
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{student.name}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-purple-200 print:text-slate-600 pt-1">
                <span>NIS: <strong className="font-mono text-white print:text-slate-900 font-bold">{student.nis}</strong></span>
                <span>•</span>
                <span>Kelas: <strong className="text-white print:text-slate-900 font-bold">{student.class}</strong> ({student.major})</span>
                <span>•</span>
                <span>Semester: <strong className="text-white print:text-slate-900 font-bold">{selectedSemester || 'Semua Semester'}</strong></span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-4 sm:p-5 text-center min-w-[140px] shrink-0 print:border-slate-300 print:bg-slate-50">
              <span className="text-[10px] uppercase font-bold text-purple-200 print:text-slate-600 block">RATA-RATA NILAI</span>
              <span className="text-3xl sm:text-4xl font-black text-amber-300 print:text-emerald-800">{average}</span>
              <span className="text-[10px] text-purple-200 print:text-slate-500 block mt-0.5">
                {average >= 85 ? 'Sangat Baik (A)' : average >= 75 ? 'Baik (B)' : average >= 65 ? 'Cukup (C)' : 'Perlu Pembinaan'}
              </span>
            </div>
          </div>

          {/* Grades Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-800 font-extrabold border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Mata Pelajaran</th>
                  <th className="py-3.5 px-4">Semester</th>
                  <th className="py-3.5 px-4 text-center">Nilai Akhir</th>
                  <th className="py-3.5 px-4 text-center">Predikat</th>
                  <th className="py-3.5 px-4 text-center print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {grades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Belum ada nilai terdaftar untuk semester ini.</p>
                    </td>
                  </tr>
                ) : (
                  grades.map((g, idx) => (
                    <tr key={g.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{g.subject}</td>
                      <td className="py-3.5 px-4 text-slate-600">{g.semester}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 text-sm">{g.score}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            g.score >= 85 ? 'success' : g.score >= 75 ? 'info' : g.score >= 65 ? 'warning' : 'danger'
                          }
                        >
                          {g.predicate}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center print:hidden">
                        <button
                          onClick={() => handleDeleteGrade(g.id, g.subject)}
                          disabled={deletingId === g.id}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Nilai"
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

          {/* Official Signatures Section for Printed Report */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-xs text-slate-800">
            <div className="text-center space-y-16">
              <p className="font-semibold">Wali Kelas / Guru Pengajar</p>
              <p className="font-bold border-b border-slate-400 inline-block px-8 pb-1">Drs. H. Ahmad Wijaya, M.Pd</p>
            </div>
            <div className="text-center space-y-16">
              <p className="font-semibold">Kepala Sekolah SMA Al-Furqon</p>
              <p className="font-bold border-b border-slate-400 inline-block px-8 pb-1">Dr. Suryanto, S.Pd., M.Pd.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
