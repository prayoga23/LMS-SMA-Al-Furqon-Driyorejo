'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FormInput, FormSelect, FormStudentCombobox } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Clock,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Building2,
  School,
  FileText,
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
  nis: string;
  class: string;
  isSantri?: boolean;
  is_santri?: boolean;
  residenceType?: string;
  sppNominal?: number;
  activityNominal?: number;
  hasDiscount?: boolean;
}

export default function CreatePaymentPage() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [formData, setFormData] = useState({
    student_id: '',
    payment_type: 'SPP', // 'SPP' (Yayasan) | 'Kegiatan' (Sekolah)
    title: 'SPP Bulanan / Semester',
    semester: 'Semester 1',
    academic_year: '2024/2025',
    amount: '500000',
    status: 'Belum Lunas',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await api.get('/students');
      setStudents(res.data);
      if (res.data.length > 0) {
        const first = res.data[0];
        setFormData((prev) => ({
          ...prev,
          student_id: first.id.toString(),
          amount: (first.sppNominal || 500000).toString(),
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    const s = students.find((item) => item.id.toString() === studentId);
    if (!s) {
      setFormData((prev) => ({ ...prev, student_id: studentId }));
      return;
    }
    const isSPP = formData.payment_type === 'SPP';
    const autoAmount = isSPP
      ? (s.sppNominal || 500000).toString()
      : (s.activityNominal || 150000).toString();

    setFormData((prev) => ({
      ...prev,
      student_id: studentId,
      amount: autoAmount,
    }));
  };

  const handleTypeChange = (type: 'SPP' | 'Kegiatan') => {
    const selectedStudent = students.find((s) => s.id.toString() === formData.student_id);
    let autoAmount = '500000';
    let defaultTitle = 'SPP Bulanan / Semester';

    if (type === 'SPP') {
      autoAmount = (selectedStudent?.sppNominal || 500000).toString();
      defaultTitle = 'SPP Bulanan / Semester';
    } else {
      autoAmount = (selectedStudent?.activityNominal || 150000).toString();
      defaultTitle = 'Anggaran Kegiatan & Praktikum Sekolah';
    }

    setFormData((prev) => ({
      ...prev,
      payment_type: type,
      title: defaultTitle,
      amount: autoAmount,
    }));
  };

  const selectedStudentObj = students.find((s) => s.id.toString() === formData.student_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || !formData.amount) {
      setError('Siswa dan nominal tagihan wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');

    const payload = {
      student_id: formData.student_id,
      category: formData.payment_type,
      destination: formData.payment_type === 'SPP' ? 'Yayasan Pondok Pesantren Al-Furqon' : 'Sekolah (SMA Al-Furqon)',
      title: formData.title,
      semester: formData.semester,
      academic_year: formData.academic_year,
      amount: formData.amount,
      status: formData.status,
      notes: formData.notes,
    };

    try {
      await api.post('/payments', payload);
      router.push('/admin/payments');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat tagihan pembayaran.');
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
            href="/admin/payments"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Pembayaran SPP & Anggaran
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Buat Tagihan Pembayaran Baru
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Input tagihan SPP (Yayasan) atau Anggaran Kegiatan (Sekolah) per siswa SMA Al-Furqon Driyorejo
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormStudentCombobox
              label="Pilih Siswa"
              required
              students={students}
              value={formData.student_id}
              onChange={handleStudentSelect}
              placeholder="Cari nama atau NIS siswa..."
            />

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Jenis Pembayaran / Tagihan <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={formData.payment_type}
                onChange={(e) => handleTypeChange(e.target.value as 'SPP' | 'Kegiatan')}
                className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              >
                <option value="SPP">SPP Siswa (Saluran Yayasan)</option>
                <option value="Kegiatan">Anggaran Kegiatan & Penunjang (Saluran Sekolah)</option>
              </select>
            </div>
          </div>

          {/* Student Status Summary Card */}
          {selectedStudentObj && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800">
                  Profil Siswa: {selectedStudentObj.name} ({selectedStudentObj.class})
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Saluran Dana Tujuan:{' '}
                  <span className="font-bold text-emerald-800">
                    {formData.payment_type === 'SPP' ? 'Yayasan Pondok Pesantren Al-Furqon' : 'Sekolah (SMA Al-Furqon)'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200 text-[11px] font-bold text-slate-700">
                  {selectedStudentObj.isSantri || selectedStudentObj.is_santri ? 'Santri Pondok' : 'Non-Santri'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200 text-[11px] font-bold text-slate-700">
                  {selectedStudentObj.residenceType || 'Non-Asrama'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="Judul Tagihan"
              required
              icon={FileText}
              placeholder="SPP Bulan Januari / Semester 1"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="Tahun Akademik"
              required
              icon={Clock}
              placeholder="2024/2025"
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
            />

            <div>
              <FormInput
                label="Nominal Tagihan (Rp)"
                type="number"
                required
                icon={Banknote}
                placeholder="500000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400"></span>
                {['200000', '500000', '1000000', '2000000'].map((nom) => (
                  <button
                    key={nom}
                    type="button"
                    onClick={() => setFormData({ ...formData, amount: nom })}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition-colors font-mono"
                  >
                    {Number(nom).toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Status Pembayaran <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'Belum Lunas' })}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.status === 'Belum Lunas'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/10 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Belum Lunas</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'Lunas' })}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.status === 'Lunas'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/10 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lunas</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Link
              href="/admin/payments"
              className="px-6 py-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Tagihan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
