'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  BookMarked,
  Layers,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Code,
  Plus,
} from 'lucide-react';

export default function CreateSubjectPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Wajib A',
    kkm: 75,
    jp: 3,
    status: 'Aktif',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Nama mata pelajaran wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await api.post('/subjects', formData);
      router.push('/admin/subjects');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menambahkan mata pelajaran.');
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
            href="/admin/subjects"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Data Mata Pelajaran
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookMarked className="w-6 h-6 text-emerald-600" />
            Tambah Mata Pelajaran Baru
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Input data mata pelajaran kurikulum SMA Al-Furqon Driyorejo lengkap dengan standar KKM & alokasi jam
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
            <FormInput
              label="Kode Mapel"
              icon={Code}
              placeholder="MP-010"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />

            <div className="md:col-span-2">
              <FormInput
                label="Nama Mata Pelajaran"
                required
                placeholder="Contoh: Pemrograman Aplikasi Mobile"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FormSelect
              label="Kategori Kurikulum"
              required
              icon={Layers}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Wajib A">Wajib A (Nasional)</option>
              <option value="Kejuruan / Produktif">Kejuruan / Produktif</option>
              <option value="Peminatan MIPA">Peminatan MIPA</option>
              <option value="Peminatan IPS">Peminatan IPS</option>
              <option value="Wajib A & Keagamaan">Keagamaan / Al-Qur'an</option>
              <option value="Muatan Lokal">Muatan Lokal (Mulok)</option>
            </FormSelect>

            <FormInput
              label="Standar KKM (0 - 100)"
              type="number"
              required
              min={0}
              max={100}
              icon={Award}
              value={formData.kkm}
              onChange={(e) => setFormData({ ...formData, kkm: Number(e.target.value) })}
            />

            <FormInput
              label="Alokasi Jam (JP / Minggu)"
              type="number"
              required
              min={1}
              max={10}
              icon={Clock}
              value={formData.jp}
              onChange={(e) => setFormData({ ...formData, jp: Number(e.target.value) })}
            />
          </div>

          <FormTextarea
            label="Deskripsi / Cakupan Materi Pembelajaran"
            rows={4}
            placeholder="Tuliskan gambaran singkat materi atau standar kompetensi lulusan mapel ini..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Status Mata Pelajaran <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'Aktif' })}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.status === 'Aktif'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/10 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Aktif Diajarkan</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'Non-Aktif' })}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.status === 'Non-Aktif'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/10 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Non-Aktif</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Link
              href="/admin/subjects"
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
                  <span>Simpan Mata Pelajaran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
