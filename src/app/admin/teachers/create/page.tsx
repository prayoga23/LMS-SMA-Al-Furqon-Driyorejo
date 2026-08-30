'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FormInput, FormSelect } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  User,
  Hash,
  BookOpen,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Building2,
} from 'lucide-react';

export default function CreateTeacherPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    subject: '',
    phone: '',
    email: '',
    status: 'Aktif',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nip.trim() || !formData.name.trim() || !formData.subject.trim()) {
      setError('NIP, Nama lengkap, dan Mata Pelajaran wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await api.post('/teachers', formData);
      router.push('/admin/teachers');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menambahkan data guru.');
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
            href="/admin/teachers"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Data Guru
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Tambah Data Guru Baru
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Isi NIP, nama lengkap, mata pelajaran yang diampu, dan kontak guru SMA Al-Furqon Driyorejo
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="NIP Guru (Nomor Induk Pegawai)"
              required
              icon={Hash}
              placeholder="198501012010011001"
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
            />
            <FormInput
              label="Nama Lengkap Guru (dengan Gelar)"
              required
              icon={User}
              placeholder="Drs. H. Ahmad Wijaya, M.Pd"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="Mata Pelajaran / Jabatan"
              required
              icon={BookOpen}
              placeholder="Matematika Terapan"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />

            <FormSelect
              label="Status Keaktifan"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Aktif">Aktif Mengajar</option>
              <option value="Non-Aktif">Cuti / Non-Aktif</option>
            </FormSelect>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="Email Guru"
              type="email"
              icon={Mail}
              placeholder="guru@sekolah.sch.id"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <FormInput
              label="No. HP / WhatsApp"
              type="tel"
              icon={Phone}
              placeholder="081234567890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Link
              href="/admin/teachers"
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
                  <span>Simpan Data Guru</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
