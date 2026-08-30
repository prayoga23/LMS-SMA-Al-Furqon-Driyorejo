'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FormInput, FormSelect, FormStudentCombobox } from '@/components/ui/InputComponents';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  BookOpen,
  Award,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

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

export default function CreateGradePage() {
  const router = useRouter();
  const { user } = useAuth();

  const isGuru = user?.role === 'guru';
  const teacherSubject = user?.subject || '';

  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    subject: isGuru && teacherSubject ? teacherSubject : POPULAR_SUBJECTS[0],
    semester: 'Semester 1',
    score: 80,
    predicate: 'B',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || !formData.subject.trim()) {
      setError('Siswa dan mata pelajaran wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await api.post('/grades', formData);
      router.push('/admin/grades');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan nilai.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout allowedRole="admin">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
        {/* Top Header */}
        <div>
          <Link
            href="/admin/grades"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Rapor & Nilai
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-purple-600" />
            Input Nilai Mata Pelajaran Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Masukkan nilai akhir dan predikat mata pelajaran siswa SMA Al-Furqon Driyorejo
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 hover:text-purple-700 hover:border-purple-300 border border-slate-200 transition-colors"
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
                  className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
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

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Link
              href="/admin/grades"
              className="px-6 py-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
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
      </div>
    </DashboardLayout>
  );
}
