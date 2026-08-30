'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/InputComponents';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Megaphone,
  Calendar,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Send,
} from 'lucide-react';

export default function CreateAcademicInfoPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Pengumuman',
    description: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Judul dan deskripsi informasi wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await api.post('/academics', formData);
      router.push('/admin/academics');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mempublikasikan informasi.');
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
            href="/admin/academics"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Informasi Sekolah
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-emerald-600" />
            Publish Informasi / Pengumuman Baru
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Terbitkan artikel, pengumuman akademik, kegiatan ekstrakurikuler, atau edaran resmi untuk siswa & orang tua
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

          <FormInput
            label="Judul Informasi / Pengumuman"
            required
            placeholder="Contoh: Edaran Kegiatan UTS & Pembayaran SPP Semester 1"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormSelect
              label="Kategori Informasi"
              required
              icon={Tag}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Pengumuman">Pengumuman Akademik</option>
              <option value="Kegiatan">Kegiatan & Acara Sekolah</option>
              <option value="Prestasi">Prestasi & Penghargaan</option>
              <option value="Penting">Edaran Penting Wali Murid</option>
            </FormSelect>

            <FormInput
              label="Tanggal Publikasi"
              type="date"
              required
              icon={Calendar}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <FormTextarea
            label="Isi Deskripsi Lengkap Informasi"
            required
            rows={8}
            placeholder="Tuliskan isi pengumuman atau informasi selengkap mungkin di sini..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Foto / Pamphlet Pendukung (Opsional)
            </label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Link
              href="/admin/academics"
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
                  <span>Menerbitkan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish Informasi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
