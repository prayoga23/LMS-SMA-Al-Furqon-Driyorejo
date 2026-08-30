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
  GraduationCap,
  Sparkles,
  Calendar,
  UserCheck,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  BookMarked,
} from 'lucide-react';

const CLASS_OPTIONS = [
  'X IPA 1',
  'X IPA 2',
  'X IPS 1',
  'X IPS 2',
  'XI IPA 1',
  'XI IPA 2',
  'XI IPS 1',
  'XI IPS 2',
  'XII IPA 1',
  'XII IPA 2',
  'XII IPS 1',
  'XII IPS 2',
];

const MAJOR_OPTIONS = [
  'IPA',
  'IPS',
];

export default function CreateStudentPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nis: '',
    name: '',
    class: 'X IPA 1',
    major: 'IPA',
    entry_year: '2024',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    is_santri: false,
    residence_type: 'Non-Asrama',
    spp_nominal: '500000',
    activity_nominal: '150000',
    has_discount: false,
    discount_notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis.trim() || !formData.name.trim()) {
      setError('NIS dan Nama siswa wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await api.post('/students', formData);
      router.push('/admin/students');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menambahkan data siswa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout allowedRole="admin">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Data Siswa
            </Link>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <BookMarked className="w-6 h-6 text-emerald-600" />
              Tambah Data Siswa Baru
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Isi data akademik, status pondok, dan informasi orang tua/wali siswa SMA Al-Furqon Driyorejo
            </p>
          </div>
        </div>

        {/* Main Form Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 01: DATA AKADEMIK */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center border border-emerald-100/60 shrink-0">
                01
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  DATA AKADEMIK
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Informasi nomor induk, kelas, dan tahun masuk siswa
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1">
                <FormInput
                  label="NIS Siswa"
                  required
                  icon={Hash}
                  placeholder="20241099"
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <FormInput
                  label="Nama Lengkap Siswa"
                  required
                  icon={User}
                  placeholder="Ahmad Zaki Pratama"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <FormSelect
                label="Kelas"
                required
                icon={GraduationCap}
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </FormSelect>

              <FormSelect
                label="Jurusan"
                required
                icon={Sparkles}
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              >
                {MAJOR_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </FormSelect>

              <FormSelect
                label="Tahun Masuk"
                required
                icon={Calendar}
                value={formData.entry_year}
                onChange={(e) => setFormData({ ...formData, entry_year: e.target.value })}
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </FormSelect>
            </div>
          </div>

          {/* SECTION 02: STATUS SANTRI & PEMBAYARAN */}
          <div className="space-y-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center border border-emerald-100/60 shrink-0">
                02
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  STATUS SANTRI & PEMBAYARAN
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Informasi status pondok pesantren dan penentuan tarif biaya pendidikan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Status Santri Pondok <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-150 ${
                      formData.is_santri === true
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/10 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="is_santri"
                      checked={formData.is_santri === true}
                      onChange={() => setFormData({ ...formData, is_santri: true })}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <span>Santri Pondok</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-150 ${
                      formData.is_santri === false
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/10 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="is_santri"
                      checked={formData.is_santri === false}
                      onChange={() => setFormData({ ...formData, is_santri: false })}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <span>Non-Santri</span>
                  </label>
                </div>
              </div>

              <FormSelect
                label="Status Tempat Tinggal"
                value={formData.residence_type}
                onChange={(e) => setFormData({ ...formData, residence_type: e.target.value })}
              >
                <option value="Non-Asrama">Non-Asrama (Pulang-Pergi)</option>
                <option value="Asrama">Asrama Pondok</option>
              </FormSelect>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput
                label="Nominal SPP Tersendiri (Rp)"
                type="number"
                value={formData.spp_nominal}
                onChange={(e) => setFormData({ ...formData, spp_nominal: e.target.value })}
                helperText="Saluran: Yayasan Pondok Pesantren Al-Furqon"
              />
              <FormInput
                label="Nominal Anggaran Kegiatan (Rp)"
                type="number"
                value={formData.activity_nominal}
                onChange={(e) => setFormData({ ...formData, activity_nominal: e.target.value })}
                helperText="Saluran: Sekolah (SMA Al-Furqon)"
              />
            </div>

            <div
              className={`p-5 rounded-xl border transition-all duration-150 space-y-3 ${
                formData.has_discount
                  ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/10'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.has_discount}
                  onChange={(e) => setFormData({ ...formData, has_discount: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Siswa Meminta / Mendapat Keringanan Biaya (Diskon Khusus)
                </span>
              </label>

              {formData.has_discount && (
                <div className="pt-2 animate-fade-in">
                  <FormInput
                    label="Catatan / Permohonan Keringanan"
                    placeholder="Misal: Keringanan Santri Yatim / Permohonan Wali"
                    value={formData.discount_notes}
                    onChange={(e) => setFormData({ ...formData, discount_notes: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 03: INFORMASI ORANG TUA / WALI */}
          <div className="space-y-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center border border-emerald-100/60 shrink-0">
                03
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  INFORMASI ORANG TUA / WALI
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Informasi kontak dan pembuatan akun portal orang tua atau wali siswa
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FormInput
                label="Nama Orang Tua / Wali"
                required
                icon={UserCheck}
                placeholder="Bambang Pratama"
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
              />
              <FormInput
                label="Email Orang Tua (Login Portal)"
                type="email"
                required
                icon={Mail}
                placeholder="orangtua@gmail.com"
                value={formData.parent_email}
                onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
              />
              <FormInput
                label="No. HP / WhatsApp Wali"
                type="tel"
                required
                icon={Phone}
                placeholder="08123456789"
                value={formData.parent_phone}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Link
              href="/admin/students"
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
                  <span>Simpan Data Siswa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
