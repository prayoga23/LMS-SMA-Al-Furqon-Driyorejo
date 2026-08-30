'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FormInput, FormSelect } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Clock,
  Banknote,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react';

export default function EditPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    student_name: '',
    student_class: '',
    category: 'SPP',
    destination: 'Yayasan Pondok Pesantren Al-Furqon',
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
    if (paymentId) {
      fetchPayment();
    }
  }, [paymentId]);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payments/${paymentId}`);
      const p = res.data;
      setFormData({
        student_name: p.student?.name || '',
        student_class: p.student?.class || '',
        category: p.category || 'SPP',
        destination: p.destination || (p.category === 'SPP' ? 'Yayasan Pondok Pesantren Al-Furqon' : 'Sekolah (SMA Al-Furqon)'),
        title: p.title || '',
        semester: p.semester || 'Semester 1',
        academic_year: p.academicYear || p.academic_year || '2024/2025',
        amount: String(p.amount || 500000),
        status: p.status || 'Belum Lunas',
        notes: p.notes || '',
      });
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) {
      setError('Nominal tagihan wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');

    const payload = {
      category: formData.category,
      destination: formData.category === 'SPP' ? 'Yayasan Pondok Pesantren Al-Furqon' : 'Sekolah (SMA Al-Furqon)',
      title: formData.title,
      semester: formData.semester,
      academic_year: formData.academic_year,
      amount: formData.amount,
      status: formData.status,
      notes: formData.notes,
    };

    try {
      await api.put(`/payments/${paymentId}`, payload);
      router.push('/admin/payments');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memperbarui data pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRole="admin">
        <div className="py-20 text-center text-slate-500">
          <Loader2 className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat data pembayaran...
        </div>
      </DashboardLayout>
    );
  }

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
            Edit Tagihan Pembayaran
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Perbarui data rincian tagihan untuk {formData.student_name} ({formData.student_class})
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

          {/* Student Info Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Siswa Terdaftar</span>
              <h4 className="text-sm font-bold text-slate-900">{formData.student_name}</h4>
              <span className="text-xs text-slate-500 font-medium">Kelas: {formData.student_class}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="Judul Tagihan"
              required
              icon={FileText}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <FormSelect
              label="Kategori Pembayaran"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="SPP">SPP (Saluran Yayasan)</option>
              <option value="Kegiatan">Kegiatan (Saluran Sekolah)</option>
            </FormSelect>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

            <FormInput
              label="Tahun Akademik"
              required
              icon={Clock}
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FormInput
                label="Nominal Tagihan (Rp)"
                type="number"
                required
                icon={Banknote}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-medium mr-1">Cepat:</span>
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

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Status Pembayaran <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
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
                  <span>Memperbarui...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Perbarui Tagihan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
