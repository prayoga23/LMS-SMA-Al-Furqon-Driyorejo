'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface AcademicInfo {
  id: number;
  title: string;
  category: 'Jadwal Pelajaran' | 'Jadwal Ujian' | 'Prestasi' | 'Kegiatan' | 'Pengumuman';
  description: string;
  date: string;
  imageUrl?: string | null;
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
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Form State
  const [editingItem, setEditingItem] = useState<AcademicInfo | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Pengumuman' as 'Jadwal Pelajaran' | 'Jadwal Ujian' | 'Prestasi' | 'Kegiatan' | 'Pengumuman',
    description: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: '',
  });

  // Image Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Ensure response is an array
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
    } catch (err: any) {
      console.error('Error fetching academics:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal memuat informasi akademik';
      showToast('error', errMsg);
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

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Pengumuman',
      description: '',
      date: new Date().toISOString().split('T')[0],
      imageUrl: '',
    });
    setSelectedFile(null);
    setImagePreview(null);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AcademicInfo) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description,
      date: item.date,
      imageUrl: item.imageUrl || '',
    });
    setSelectedFile(null);
    setImagePreview(item.imageUrl || null);
    setError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Harap pilih file gambar (JPG, PNG, WEBP, GIF)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }
      setError('');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      let finalImageUrl = formData.imageUrl;

      // Unggah file gambar jika pengguna memilih gambar baru
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);

        const uploadRes = await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        finalImageUrl = uploadRes.data.url;
      }

      const payload = {
        ...formData,
        imageUrl: finalImageUrl || null,
      };

      if (editingItem) {
        await api.put(`/academics/${editingItem.id}`, payload);
        showToast('success', 'Informasi akademik berhasil diperbarui.');
      } else {
        await api.post('/academics', payload);
        showToast('success', 'Informasi akademik baru berhasil dipublish.');
      }

      setIsModalOpen(false);
      fetchAcademics();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menyimpan informasi akademik.');
      showToast('error', 'Gagal memproses informasi akademik');
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
            onClick={handleOpenAddModal}
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
              <button
                onClick={fetchAcademics}
                className="mt-3 px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-indigo-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Muat Ulang
              </button>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-indigo-100 shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all group">
                <div>
                  {/* Image Display */}
                  {item.imageUrl ? (
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden group/img">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setLightboxImage(item.imageUrl || null)}
                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]"
                      >
                        <Eye className="w-4 h-4" /> Lihat Gambar
                      </button>
                    </div>
                  ) : null}

                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {getCategoryBadge(item.category)}
                      <span className="text-[11px] font-mono text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {item.date}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 leading-snug">{item.title}</h3>
                    <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-4 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-2 px-6 py-3.5 bg-slate-50/80 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="px-3 py-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors text-xs flex items-center gap-1 font-semibold"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="px-3 py-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors text-xs flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Add/Edit Academic Info */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? 'Edit Informasi Akademik' : 'Publish Informasi Akademik'}
          subtitle={editingItem ? 'Perbarui informasi atau gambar pengumuman' : 'Buat pengumuman atau jadwal kegiatan sekolah'}
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

            {/* Input Upload Gambar */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Upload Gambar / Poster (Opsional)
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative rounded-xl border border-indigo-200 bg-slate-50 p-2 overflow-hidden flex items-center gap-3">
                  <div className="w-20 h-20 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {selectedFile ? selectedFile.name : 'Gambar saat ini'}
                    </p>
                    {selectedFile && (
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Siap diunggah ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        Ganti Gambar
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                      >
                        Hapus Gambar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">
                      Klik di sini untuk unggah gambar
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Format disarankan: JPG, PNG, WEBP (Maksimal 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

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
                    <span>{editingItem ? 'Menyimpan...' : 'Publishing...'}</span>
                  </>
                ) : (
                  <span>{editingItem ? 'Simpan Perubahan' : 'Publish Informasi'}</span>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Lightbox Preview Modal */}
        {lightboxImage && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
            <div className="relative max-w-4xl max-h-[90vh] bg-transparent overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={lightboxImage}
                alt="Gambar Informasi Akademik"
                className="w-full h-full object-contain max-h-[85vh] rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
