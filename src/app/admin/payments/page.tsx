'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FormInput, FormSelect, FormStudentCombobox } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Filter,
  Search,
  User,
  Calendar,
  Clock,
  Banknote,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Building2,
  School,
  FileText,
  Printer,
} from 'lucide-react';

interface Payment {
  id: number;
  studentId: number;
  category?: 'SPP' | 'Kegiatan';
  destination?: string;
  title?: string;
  semester: string;
  academic_year?: string;
  academicYear?: string;
  amount: number;
  status: 'Lunas' | 'Belum Lunas';
  notes?: string;
  createdAt?: string;
  student?: {
    id: number;
    name: string;
    nis: string;
    class: string;
    major?: string;
    isSantri?: boolean;
    is_santri?: boolean;
    residenceType?: string;
    residence_type?: string;
    sppNominal?: number;
    spp_nominal?: number;
    activityNominal?: number;
    activity_nominal?: number;
    hasDiscount?: boolean;
    has_discount?: boolean;
    discountNotes?: string;
    discount_notes?: string;
  };
}

interface Student {
  id: number;
  name: string;
  nis: string;
  class: string;
  major?: string;
  isSantri?: boolean;
  is_santri?: boolean;
  residenceType?: string;
  residence_type?: string;
  sppNominal?: number;
  spp_nominal?: number;
  activityNominal?: number;
  activity_nominal?: number;
  hasDiscount?: boolean;
  has_discount?: boolean;
  discountNotes?: string;
  discount_notes?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    category: 'SPP' as 'SPP' | 'Kegiatan',
    destination: 'Yayasan Pondok Pesantren Al-Furqon',
    title: 'SPP Bulanan / Semester',
    semester: 'Semester 1',
    academic_year: '2024/2025',
    amount: '500000',
    status: 'Belum Lunas' as 'Lunas' | 'Belum Lunas',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  }, [statusFilter, semesterFilter, categoryFilter]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments', {
        params: {
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        },
      });
      let data: Payment[] = res.data;
      if (semesterFilter) {
        data = data.filter((p) => p.semester === semesterFilter);
      }
      setPayments(data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
      if (res.data.length > 0 && !formData.student_id) {
        const first = res.data[0];
        setFormData((prev) => ({
          ...prev,
          student_id: first.id.toString(),
          amount: (first.sppNominal ?? first.spp_nominal ?? 500000).toString(),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedStudentObj = students.find((s) => s.id.toString() === formData.student_id);

  const handleStudentSelect = (studentIdStr: string, currentCategory: 'SPP' | 'Kegiatan') => {
    const st = students.find((s) => s.id.toString() === studentIdStr);
    let defaultAmount = '500000';
    if (st) {
      defaultAmount = currentCategory === 'Kegiatan'
        ? String(st.activityNominal ?? st.activity_nominal ?? 150000)
        : String(st.sppNominal ?? st.spp_nominal ?? 500000);
    }
    setFormData((prev) => ({
      ...prev,
      student_id: studentIdStr,
      amount: defaultAmount,
    }));
  };

  const handleCategorySelect = (newCategory: 'SPP' | 'Kegiatan') => {
    const dest = newCategory === 'Kegiatan' ? 'Sekolah (SMA Al-Furqon)' : 'Yayasan Pondok Pesantren Al-Furqon';
    const defaultTitle = newCategory === 'Kegiatan' ? 'Anggaran Kegiatan Sekolah' : 'SPP Bulanan / Semester';
    let defaultAmount = '500000';
    if (selectedStudentObj) {
      defaultAmount = newCategory === 'Kegiatan'
        ? String(selectedStudentObj.activityNominal ?? selectedStudentObj.activity_nominal ?? 150000)
        : String(selectedStudentObj.sppNominal ?? selectedStudentObj.spp_nominal ?? 500000);
    }
    setFormData((prev) => ({
      ...prev,
      category: newCategory,
      destination: dest,
      title: defaultTitle,
      amount: defaultAmount,
    }));
  };

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.student?.name.toLowerCase().includes(q) ||
      p.student?.nis.toLowerCase().includes(q) ||
      p.student?.class.toLowerCase().includes(q) ||
      p.destination?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q)
    );
  });

  const handleOpenAddModal = () => {
    setError('');
    const firstSt = students.length > 0 ? students[0] : null;
    const defaultAmt = firstSt ? String(firstSt.sppNominal ?? firstSt.spp_nominal ?? 500000) : '500000';
    setFormData({
      student_id: firstSt ? firstSt.id.toString() : '',
      category: 'SPP',
      destination: 'Yayasan Pondok Pesantren Al-Furqon',
      title: 'SPP Bulanan / Semester',
      semester: 'Semester 1',
      academic_year: '2024/2025',
      amount: defaultAmt,
      status: 'Belum Lunas',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (payment: Payment) => {
    setError('');
    setSelectedPayment(payment);
    setFormData({
      student_id: payment.studentId.toString(),
      category: payment.category || 'SPP',
      destination: payment.destination || 'Yayasan Pondok Pesantren Al-Furqon',
      title: payment.title || 'SPP Bulanan / Semester',
      semester: payment.semester,
      academic_year: payment.academic_year || payment.academicYear || '2024/2025',
      amount: payment.amount.toString(),
      status: payment.status,
      notes: payment.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenReceipt = (payment: Payment) => {
    setReceiptPayment(payment);
    setIsReceiptModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id) {
      setError('Silakan pilih siswa terlebih dahulu.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      await api.post('/payments', formData);
      setIsAddModalOpen(false);
      showToast('success', 'Tagihan SPP baru berhasil dibuat.');
      fetchPayments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan tagihan SPP.');
      showToast('error', 'Gagal menyimpan pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setError('');
    setSubmitting(true);

    try {
      await api.put(`/payments/${selectedPayment.id}`, formData);
      setIsEditModalOpen(false);
      showToast('success', `Status SPP ${selectedPayment.student?.name} diperbarui menjadi ${formData.status}.`);
      fetchPayments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memperbarui pembayaran.');
      showToast('error', 'Gagal memperbarui SPP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, studentName?: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data tagihan SPP ${studentName || ''}?`)) return;
    try {
      await api.delete(`/payments/${id}`);
      showToast('info', 'Transaksi SPP berhasil dihapus.');
      fetchPayments();
    } catch (err) {
      showToast('error', 'Gagal menghapus tagihan SPP');
    }
  };

  const setAmountPreset = (val: string) => {
    setFormData((prev) => ({ ...prev, amount: val }));
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setSemesterFilter('');
  };

  const totalYayasanPaid = payments
    .filter((p) => p.status === 'Lunas' && (p.category === 'SPP' || p.destination?.includes('Yayasan')))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalSekolahPaid = payments
    .filter((p) => p.status === 'Lunas' && (p.category === 'Kegiatan' || p.destination?.includes('Sekolah')))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalUnpaid = payments
    .filter((p) => p.status === 'Belum Lunas')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-6 animate-fade-in">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-amber-600" />
              Manajemen SPP & Anggaran Kegiatan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Kelola tagihan siswa (Santri/Asrama/Keringanan) dan pemantauan saluran dana (Yayasan vs Sekolah)
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Buat Tagihan Baru
          </button>
        </div>

        {/* Fund Routing Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                <Building2 className="w-4 h-4 text-amber-600" />
                Saluran SPP (Yayasan)
              </div>
              <p className="text-[11px] text-slate-500">Yayasan Pondok Pesantren Al-Furqon</p>
              <h3 className="text-xl font-black text-amber-900 mt-2">
                Rp {totalYayasanPaid.toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                <School className="w-4 h-4 text-emerald-600" />
                Saluran Kegiatan (Sekolah)
              </div>
              <p className="text-[11px] text-slate-500">Sekolah (SMA Al-Furqon)</p>
              <h3 className="text-xl font-black text-emerald-900 mt-2">
                Rp {totalSekolahPaid.toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <School className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 mb-1">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Belum Terbayar (Tunggakan)
              </div>
              <p className="text-[11px] text-slate-500">Total Sisa Tagihan Belum Lunas</p>
              <h3 className="text-xl font-black text-rose-800 mt-2">
                Rp {totalUnpaid.toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="w-full lg:w-80">
            <FormInput
              icon={Search}
              placeholder="Cari Siswa, NIS, atau Kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={search ? () => setSearch('') : undefined}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-600 shrink-0" />
              <FormSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-40"
              >
                <option value="">Semua Saluran</option>
                <option value="SPP">SPP (Yayasan)</option>
                <option value="Kegiatan">Kegiatan (Sekolah)</option>
              </FormSelect>
            </div>

            <FormSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36"
            >
              <option value="">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
            </FormSelect>

            <FormSelect
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-36"
            >
              <option value="">Semua Semester</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </FormSelect>

            {(search || statusFilter || categoryFilter || semesterFilter) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            <button
              onClick={fetchPayments}
              className="p-2.5 text-slate-600 hover:text-amber-700 rounded-xl bg-slate-50 border border-slate-200 hover:bg-amber-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-amber-50/60 uppercase text-[10px] text-amber-950 font-bold border-b border-amber-100 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Jenis Tagihan</th>
                  <th className="py-3.5 px-4">Saluran Dana Penerima</th>
                  <th className="py-3.5 px-4">Semester</th>
                  <th className="py-3.5 px-4">Nominal</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Memuat transaksi tagihan...</p>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada transaksi pembayaran ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isSantri = Boolean(p.student?.isSantri ?? p.student?.is_santri);
                    const residence = p.student?.residenceType || p.student?.residence_type || 'Non-Asrama';
                    const hasDiscount = Boolean(p.student?.hasDiscount ?? p.student?.has_discount);
                    const isYayasan = p.category === 'SPP' || p.destination?.includes('Yayasan');

                    return (
                      <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>
                            <span>{p.student?.name}</span>
                            <span className="block text-[10px] text-slate-500 font-mono font-normal">
                              NIS: {p.student?.nis} ({p.student?.class})
                            </span>
                            <div className="flex gap-1 mt-1">
                              <Badge variant={isSantri ? 'success' : 'slate'}>
                                {isSantri ? 'Santri' : 'Non-Santri'}
                              </Badge>
                              <Badge variant={residence === 'Asrama' ? 'purple' : 'info'}>
                                {residence}
                              </Badge>
                              {hasDiscount && (
                                <Badge variant="warning">Keringanan</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          <div>
                            <span>{p.title || (p.category === 'Kegiatan' ? 'Anggaran Kegiatan' : 'SPP Bulanan')}</span>
                            <span className="block text-[10px] text-slate-500 font-normal">
                              Kategori: {p.category || 'SPP'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                            isYayasan
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          }`}>
                            {isYayasan ? <Building2 className="w-3.5 h-3.5 text-amber-700" /> : <School className="w-3.5 h-3.5 text-emerald-700" />}
                            {p.destination || (isYayasan ? 'Yayasan Pondok Pesantren Al-Furqon' : 'Sekolah (SMA Al-Furqon)')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {p.semester}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {p.academic_year || p.academicYear || '2024/2025'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-amber-900 text-sm">
                          Rp {Number(p.amount).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={p.status === 'Lunas' ? 'success' : 'danger'}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenReceipt(p)}
                              className="p-1.5 text-slate-700 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                              title="Lihat / Cetak Kuitansi Digital"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-amber-700 hover:text-amber-950 hover:bg-amber-100 rounded-lg transition-colors"
                              title="Edit Tagihan"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.student?.name)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Tagihan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Add Payment */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Buat Tagihan Pembayaran Baru"
          subtitle="Input tagihan SPP (Yayasan) atau Anggaran Kegiatan (Sekolah) per siswa"
        >
          <form onSubmit={handleCreate} className="space-y-5">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormStudentCombobox
                label="Pilih Siswa"
                required
                students={students}
                value={formData.student_id}
                onChange={(stId) => handleStudentSelect(stId, formData.category)}
                placeholder="Cari nama atau NIS siswa..."
              />

              <FormSelect
                label="Jenis Pembayaran / Tagihan"
                required
                value={formData.category}
                onChange={(e) => handleCategorySelect(e.target.value as 'SPP' | 'Kegiatan')}
              >
                <option value="SPP">SPP Siswa (Saluran Yayasan)</option>
                <option value="Kegiatan">Anggaran Kegiatan (Saluran Sekolah)</option>
              </FormSelect>
            </div>

            {/* Banner Saluran Dana & Status Siswa */}
            {selectedStudentObj && (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1 text-xs text-amber-950">
                <div className="flex items-center justify-between font-bold">
                  <span>Profil Siswa: {selectedStudentObj.name} ({selectedStudentObj.class})</span>
                  <div className="flex gap-1">
                    <Badge variant={selectedStudentObj.isSantri || selectedStudentObj.is_santri ? 'success' : 'slate'}>
                      {selectedStudentObj.isSantri || selectedStudentObj.is_santri ? 'Santri' : 'Non-Santri'}
                    </Badge>
                    <Badge variant={(selectedStudentObj.residenceType || selectedStudentObj.residence_type) === 'Asrama' ? 'purple' : 'info'}>
                      {selectedStudentObj.residenceType || selectedStudentObj.residence_type || 'Non-Asrama'}
                    </Badge>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600">
                  Saluran Dana Tujuan: <strong className="text-amber-900">{formData.destination}</strong>
                </p>

                {(selectedStudentObj.hasDiscount || selectedStudentObj.has_discount) && (
                  <p className="text-[11px] text-amber-800 font-medium">
                    ℹ️ Siswa mendapat Keringanan: {selectedStudentObj.discountNotes || selectedStudentObj.discount_notes || 'Tarif Khusus Keringanan'}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Judul Tagihan"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="SPP Bulanan / Anggaran Kegiatan..."
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
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  helperText={`Terbilang: Rp ${Number(formData.amount || 0).toLocaleString('id-ID')}`}
                />
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-medium text-slate-400 mr-1">Cepat:</span>
                  {['100000', '150000', '400000', '500000', '750000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountPreset(preset)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-all ${
                        formData.amount === preset
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700'
                      }`}
                    >
                      {Number(preset).toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Status Pembayaran <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'Belum Lunas' })}
                  className={`py-2.5 px-3 rounded-lg border flex items-center justify-center gap-2 text-[12px] font-semibold transition-all ${
                    formData.status === 'Belum Lunas'
                      ? 'bg-rose-50 border-rose-400 text-rose-700 ring-1 ring-rose-400/30'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Belum Lunas
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'Lunas' })}
                  className={`py-2.5 px-3 rounded-lg border flex items-center justify-center gap-2 text-[12px] font-semibold transition-all ${
                    formData.status === 'Lunas'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-1 ring-emerald-400/30'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Lunas
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Tagihan'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Edit Payment */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Status / Nominal Tagihan"
          subtitle="Perbarui data pembayaran siswa"
        >
          <form onSubmit={handleUpdate} className="space-y-5">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Jenis Pembayaran"
                required
                value={formData.category}
                onChange={(e) => handleCategorySelect(e.target.value as 'SPP' | 'Kegiatan')}
              >
                <option value="SPP">SPP Siswa (Saluran Yayasan)</option>
                <option value="Kegiatan">Anggaran Kegiatan (Saluran Sekolah)</option>
              </FormSelect>

              <FormInput
                label="Judul Tagihan"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <FormInput
              label="Nominal Pembayaran (Rp)"
              type="number"
              required
              icon={Banknote}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              helperText={`Terbilang: Rp ${Number(formData.amount || 0).toLocaleString('id-ID')}`}
            />

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Status Pembayaran <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'Belum Lunas' })}
                  className={`py-2.5 px-3 rounded-lg border flex items-center justify-center gap-2 text-[12px] font-semibold transition-all ${
                    formData.status === 'Belum Lunas'
                      ? 'bg-rose-50 border-rose-400 text-rose-700 ring-1 ring-rose-400/30'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Belum Lunas
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'Lunas' })}
                  className={`py-2.5 px-3 rounded-lg border flex items-center justify-center gap-2 text-[12px] font-semibold transition-all ${
                    formData.status === 'Lunas'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-1 ring-emerald-400/30'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Lunas
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  'Perbarui Status Tagihan'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL DIGITAL RECEIPT / KUITANSI */}
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title="Kuitansi Digital Pembayaran"
          subtitle="Bukti setoran resmi penerimaan dana"
        >
          {receiptPayment && (
            <div className="space-y-4">
              <div className="p-5 border-2 border-amber-200 bg-amber-50/20 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                  <div>
                    <h3 className="font-black text-amber-950 text-base">SMA AL-FURQON DRIYOREJO</h3>
                    <p className="text-[11px] text-slate-500">Bukti Pembayaran Digital Resmi</p>
                  </div>
                  <Badge variant={receiptPayment.status === 'Lunas' ? 'success' : 'danger'}>
                    {receiptPayment.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">NAMA SISWA:</span>
                    <strong className="text-slate-900">{receiptPayment.student?.name}</strong>
                    <span className="block text-[10px] text-slate-500 font-mono">NIS: {receiptPayment.student?.nis}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">KELAS & JURUSAN:</span>
                    <strong className="text-slate-800">{receiptPayment.student?.class}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">JENIS TAGIHAN:</span>
                    <span className="font-semibold text-slate-800">
                      {receiptPayment.title || receiptPayment.category} ({receiptPayment.semester})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">SALURAN DANA PENERIMA:</span>
                    <strong className="text-amber-900 block">
                      {receiptPayment.destination || (receiptPayment.category === 'Kegiatan' ? 'Sekolah (SMA Al-Furqon)' : 'Yayasan Pondok Pesantren Al-Furqon')}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">JUMLAH SETORAN:</span>
                  <span className="text-lg font-black text-amber-900">
                    Rp {Number(receiptPayment.amount).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 text-center pt-2">
                  * Kuitansi ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Kuitansi
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
