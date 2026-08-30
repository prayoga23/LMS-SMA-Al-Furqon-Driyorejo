'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FormInput, FormSelect, FormStudentCombobox } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Banknote,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface StudentOption {
  id: number;
  name: string;
  nis: string;
  class?: string;
}

const DESCRIPTION_PRESETS = [
  'Transfer Uang Saku Mingguan',
  'Top Up Saldo E-Money',
  'Pembelian Buku & Alat Tulis',
  'Pembayaran Kantin Sekolah',
  'Uang Kegiatan Ekstrakurikuler',
];

export default function CreateAllowancePage() {
  const router = useRouter();

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    type: 'income' as 'income' | 'expense',
    amount: '50000',
    date: new Date().toISOString().split('T')[0],
    description: DESCRIPTION_PRESETS[0],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || !formData.amount || Number(formData.amount) <= 0) {
      setError('Siswa dan nominal transaksi valid wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');

    const payload = {
      student_id: formData.student_id,
      date: formData.date,
      income: formData.type === 'income' ? Number(formData.amount) : 0,
      expense: formData.type === 'expense' ? Number(formData.amount) : 0,
      description: formData.description,
    };

    try {
      await api.post('/allowances', payload);
      router.push('/admin/allowances');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mencatat transaksi uang saku.');
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
            href="/admin/allowances"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Uang Saku Siswa
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-600" />
            Catat Transaksi Uang Saku Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Input mutasi pemasukan (top-up) atau pengeluaran saldo tabungan siswa SMA Al-Furqon Driyorejo
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormStudentCombobox
              label="Pilih Siswa"
              required
              students={students}
              value={formData.student_id}
              onChange={(studentId) => setFormData({ ...formData, student_id: studentId })}
              placeholder="Cari nama atau NIS siswa..."
            />

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                Jenis Transaksi Mutasi <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    formData.type === 'income'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/10 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                  <span>Pemasukan (Top Up)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    formData.type === 'expense'
                      ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/10 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  <span>Pengeluaran</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="Tanggal Transaksi"
              type="date"
              required
              icon={Calendar}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />

            <div>
              <FormInput
                label="Nominal Transaksi (Rp)"
                type="number"
                required
                icon={Banknote}
                placeholder="50000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-medium mr-1">Cepat:</span>
                {['10000', '20000', '50000', '100000', '200000'].map((nom) => (
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

          <div>
            <FormInput
              label="Keterangan / Keperluan"
              required
              icon={FileText}
              placeholder="Contoh: Transfer Uang Saku Mingguan"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-medium mr-1">Rekomendasi:</span>
              {DESCRIPTION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFormData({ ...formData, description: preset })}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Link
              href="/admin/allowances"
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
                  <span>Simpan Transaksi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
