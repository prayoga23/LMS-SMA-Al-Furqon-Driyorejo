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
} from 'lucide-react';

interface Payment {
  id: number;
  studentId: number;
  semester: string;
  academic_year: string;
  amount: number;
  status: 'Lunas' | 'Belum Lunas';
  student?: {
    id: number;
    name: string;
    nis: string;
    class: string;
  };
}

interface Student {
  id: number;
  name: string;
  nis: string;
  class: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    semester: 'Semester 1',
    academic_year: '2024/2025',
    amount: '500000',
    status: 'Belum Lunas' as 'Lunas' | 'Belum Lunas',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  }, [statusFilter, semesterFilter]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments', {
        params: { status: statusFilter || undefined },
      });
      let data: Payment[] = res.data;
      if (semesterFilter) {
        data = data.filter((p) => p.semester === semesterFilter);
      }
      setPayments(data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data pembayaran SPP');
    } finally {
      setLoading(false);
    }
  };

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

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.student?.name.toLowerCase().includes(q) ||
      p.student?.nis.toLowerCase().includes(q) ||
      p.student?.class.toLowerCase().includes(q)
    );
  });

  const handleOpenAddModal = () => {
    setError('');
    setFormData({
      student_id: students.length > 0 ? students[0].id.toString() : '',
      semester: 'Semester 1',
      academic_year: '2024/2025',
      amount: '500000',
      status: 'Belum Lunas',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (payment: Payment) => {
    setError('');
    setSelectedPayment(payment);
    setFormData({
      student_id: payment.studentId.toString(),
      semester: payment.semester,
      academic_year: payment.academic_year,
      amount: payment.amount.toString(),
      status: payment.status,
    });
    setIsEditModalOpen(true);
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
    setSemesterFilter('');
  };

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-6 animate-fade-in">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-amber-600" />
              Manajemen SPP Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-1">Input tagihan, verifikasi status pembayaran, dan riwayat transaksi SPP</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Input Tagihan / SPP Baru
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="w-full lg:w-80">
            <FormInput
              icon={Search}
              placeholder="Cari Siswa, NIS, atau Kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={search ? () => setSearch('') : undefined}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-600 shrink-0" />
              <FormSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36"
              >
                <option value="">Semua Status</option>
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
              </FormSelect>
            </div>

            <FormSelect
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-36"
            >
              <option value="">Semua Semester</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </FormSelect>

            {(search || statusFilter || semesterFilter) && (
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
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Semester</th>
                  <th className="py-3.5 px-4">Tahun Akademik</th>
                  <th className="py-3.5 px-4">Nominal SPP</th>
                  <th className="py-3.5 px-4">Status Pembayaran</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Memuat transaksi SPP...</p>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada transaksi SPP ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.student?.name}
                        <span className="block text-[10px] text-slate-500 font-mono font-normal">
                          NIS: {p.student?.nis}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="purple">{p.student?.class}</Badge>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{p.semester}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.academic_year}</td>
                      <td className="py-3.5 px-4 font-black text-amber-800 text-sm">
                        Rp {Number(p.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={p.status === 'Lunas' ? 'success' : 'danger'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-2 text-amber-700 hover:text-amber-950 hover:bg-amber-100/70 rounded-xl transition-colors"
                            title="Edit / Ubah Status SPP"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.student?.name)}
                            className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Hapus Tagihan"
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

        {/* Modal Add Payment */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Input Pembayaran SPP"
          subtitle="Catat tagihan atau pembayaran SPP siswa"
        >
          <form onSubmit={handleCreate} className="space-y-6">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormStudentCombobox
                label="Pilih Siswa"
                required
                students={students}
                value={formData.student_id}
                onChange={(studentId) => setFormData({ ...formData, student_id: studentId })}
                placeholder="Cari nama atau NIS siswa..."
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
                  label="Nominal SPP (Rp)"
                  type="number"
                  required
                  icon={Banknote}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  helperText={`Terbilang: Rp ${Number(formData.amount || 0).toLocaleString('id-ID')}`}
                />
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-medium text-slate-400 mr-1">Cepat:</span>
                  {['300000', '500000', '750000', '1000000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountPreset(preset)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-all ${
                        formData.amount === preset
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
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

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[13px] font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan SPP'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Edit Payment */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Status / Nominal SPP"
          subtitle="Perbarui data pembayaran siswa"
        >
          <form onSubmit={handleUpdate} className="space-y-6">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              label="Nominal SPP (Rp)"
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

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[13px] font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  'Perbarui Status SPP'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
