'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FormInput, FormSelect } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  BookMarked,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  BookOpen,
  Award,
  Clock,
  Layers,
  X,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface SubjectItem {
  id: number;
  code: string;
  name: string;
  category: string;
  kkm: number;
  jp: number;
  status: string;
  description?: string;
  teacherName?: string;
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subjects');
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data mata pelajaran');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus mata pelajaran "${name}"?`)) return;
    try {
      await api.delete(`/subjects/${id}`);
      showToast('info', `Mata pelajaran "${name}" telah dihapus.`);
      fetchSubjects();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Gagal menghapus mata pelajaran');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('');
  };

  const filteredSubjects = subjects.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    const matchCategory = !categoryFilter || item.category === categoryFilter;

    return matchSearch && matchCategory;
  });

  // Calculate summary stats
  const totalSubjects = subjects.length;
  const countWajib = subjects.filter((s) => s.category.includes('Wajib')).length;
  const countKejuruan = subjects.filter((s) => s.category.includes('Kejuruan') || s.category.includes('Produktif')).length;
  const avgKKM = subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + s.kkm, 0) / subjects.length) : 75;

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-6 animate-fade-in pb-12">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Top Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <BookMarked className="w-6 h-6 text-emerald-700" />
              Kelola Data Mata Pelajaran
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Kurikulum SMA Al-Furqon Driyorejo — Standar KKM, Alokasi Jam Pelajaran (JP), & Kategori Mapel
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/subjects/create"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Tambah Mata Pelajaran Baru
            </Link>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Mapel</p>
              <p className="text-xl font-black text-slate-900">{totalSubjects}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mapel Wajib</p>
              <p className="text-xl font-black text-slate-900">{countWajib}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kejuruan & Produktif</p>
              <p className="text-xl font-black text-slate-900">{countKejuruan}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata KKM</p>
              <p className="text-xl font-black text-slate-900">{avgKKM}</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="w-full lg:w-96">
            <FormInput
              icon={Search}
              placeholder="Cari kode mapel, nama, atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={search ? () => setSearch('') : undefined}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <FormSelect
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-52"
            >
              <option value="">Semua Kategori</option>
              <option value="Wajib A">Wajib A (Nasional)</option>
              <option value="Kejuruan / Produktif">Kejuruan / Produktif</option>
              <option value="Peminatan MIPA">Peminatan MIPA</option>
              <option value="Wajib A & Keagamaan">Keagamaan / Al-Qur'an</option>
              <option value="Umum / Peminatan">Umum / Peminatan</option>
            </FormSelect>

            {(search || categoryFilter) && (
              <button
                onClick={resetFilters}
                className="px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            )}

            <button
              onClick={fetchSubjects}
              className="p-2.5 text-slate-600 hover:text-emerald-700 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subjects Table Container */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50/70 uppercase text-[10px] text-emerald-950 font-bold border-b border-emerald-100 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Kode & Nama Mata Pelajaran</th>
                  <th className="py-3.5 px-4">Kategori Kurikulum</th>
                  <th className="py-3.5 px-4 text-center">Batas KKM</th>
                  <th className="py-3.5 px-4 text-center">Jam Pelajaran (JP)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Memuat data mata pelajaran...</p>
                    </td>
                  </tr>
                ) : filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <BookMarked className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada mata pelajaran ditemukan</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Coba sesuaikan kata kunci pencarian atau filter kategori.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {item.code}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{item.name}</span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 font-normal mt-1 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={item.category.includes('Wajib') ? 'indigo' : item.category.includes('Kejuruan') ? 'success' : 'slate'}>
                          {item.category}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-800">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                          {item.kkm}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.jp} JP / Minggu</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={item.status === 'Aktif' ? 'success' : 'slate'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/admin/subjects/${item.id}/edit`}
                            className="p-2 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100/70 rounded-xl transition-colors"
                            title="Edit Data Mata Pelajaran"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Hapus Mata Pelajaran"
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
      </div>
    </DashboardLayout>
  );
}
