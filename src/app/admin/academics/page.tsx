'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  Plus,
  GraduationCap,
  Calendar,
  Trophy,
  Bell,
  FileText,
  Trash2,
  Edit,
  Search,
  Tag,
  RefreshCw,
  X,
} from 'lucide-react';

interface AcademicInfo {
  id: number;
  title: string;
  category: 'Jadwal Pelajaran' | 'Jadwal Ujian' | 'Prestasi' | 'Kegiatan' | 'Pengumuman';
  description: string;
  date: string;
}

export default function AdminAcademicsPage() {
  const [items, setItems] = useState<AcademicInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Pengumuman' as 'Jadwal Pelajaran' | 'Jadwal Ujian' | 'Prestasi' | 'Kegiatan' | 'Pengumuman',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAcademics();
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchAcademics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academics');
      setItems(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat informasi akademik');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    let match = true;
    if (search) {
      const q = search.toLowerCase();
      match = item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    if (match && categoryFilter) {
      match = item.category === categoryFilter;
    }
    return match;
  });

  const handleOpenModal = () => {
    setFormData({
      title: '',
      category: 'Pengumuman',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Judul dan Deskripsi pengumuman wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/academics', formData);
      setIsModalOpen(false);
      showToast('success', 'Informasi akademik baru berhasil dipublish.');
      fetchAcademics();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan informasi akademik.');
      showToast('error', 'Gagal mempublikasikan informasi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title?: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus informasi "${title || ''}"?`)) return;
    try {
      await api.delete(`/academics/${id}`);
      showToast('info', 'Informasi akademik telah dihapus.');
      fetchAcademics();
    } catch (err) {
      showToast('error', 'Gagal menghapus informasi');
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Jadwal Pelajaran':
        return <Badge variant="info">Jadwal Pelajaran</Badge>;
      case 'Jadwal Ujian':
        return <Badge variant="warning">Jadwal Ujian</Badge>;
      case 'Prestasi':
        return <Badge variant="success">Prestasi</Badge>;
      case 'Kegiatan':
        return <Badge variant="purple">Kegiatan</Badge>;
      default:
        return <Badge variant="slate">Pengumuman</Badge>;
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('');
  };

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-6 animate-fade-in">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-indigo-600" />
              Manajemen Informasi Akademik
            </h2>
            <p className="text-xs text-slate-500 mt-1">Publish pengumuman, jadwal ujian, jadwal pelajaran, kegiatan & prestasi sekolah</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Publish Informasi Baru
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="w-full lg:w-80">
            <FormInput
              icon={Search}
              placeholder="Cari Judul Pengumuman atau Isi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={search ? () => setSearch('') : undefined}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <FormSelect
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-48"
            >
              <option value="">Semua Kategori</option>
              <option value="Jadwal Pelajaran">Jadwal Pelajaran</option>
              <option value="Jadwal Ujian">Jadwal Ujian</option>
              <option value="Prestasi">Prestasi</option>
              <option value="Kegiatan">Kegiatan</option>
              <option value="Pengumuman">Pengumuman</option>
            </FormSelect>

            {(search || categoryFilter) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            <button
              onClick={fetchAcademics}
              className="p-2.5 text-slate-600 hover:text-indigo-700 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* List of Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-medium">Memuat informasi akademik...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-indigo-100 p-8">
              <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">Belum ada informasi akademik yang dipublish</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {getCategoryBadge(item.category)}
                    <span className="text-[11px] font-mono text-slate-500 font-medium">{item.date}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-4 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors text-xs flex items-center gap-1.5 font-bold"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Add Academic Info */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Publish Informasi Akademik"
          subtitle="Buat pengumuman atau jadwal kegiatan sekolah"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}
            
            <FormInput
              label="Judul Informasi"
              required
              icon={FileText}
              placeholder="misal: Penilaian Tengah Semester (PTS) Genap 2024/2025"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Kategori"
                required
                icon={Tag}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="Jadwal Pelajaran">Jadwal Pelajaran</option>
                <option value="Jadwal Ujian">Jadwal Ujian</option>
                <option value="Prestasi">Prestasi Siswa</option>
                <option value="Kegiatan">Kegiatan Sekolah</option>
                <option value="Pengumuman">Pengumuman Akademik</option>
              </FormSelect>

              <FormInput
                label="Tanggal Publish"
                type="date"
                required
                icon={Calendar}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <FormTextarea
              label="Deskripsi Lengkap / Isi Pesan"
              required
              rows={4}
              icon={FileText}
              placeholder="Tuliskan detail pengumuman, daftar mata pelajaran, atau tata tertib di sini..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div className="flex justify-end gap-2.5 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[13px] font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Publish Informasi</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
