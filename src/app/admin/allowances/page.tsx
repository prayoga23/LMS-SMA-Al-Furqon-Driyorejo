'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FormInput, FormSelect, FormStudentCombobox } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  Plus,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Calendar,
  Search,
  Filter,
  User,
  Banknote,
  FileText,
  RefreshCw,
  X,
} from 'lucide-react';

interface StudentOption {
  id: number;
  name: string;
  nis: string;
  class?: string;
}

interface AllowanceRecord {
  id: number;
  student_id: number;
  date: string;
  income: number;
  expense: number;
  description: string;
  student?: {
    name: string;
    nis: string;
    class: string;
  };
}

const DESCRIPTION_PRESETS = [
  'Transfer Uang Saku Mingguan',
  'Top Up Saldo E-Money',
  'Pembelian Buku & Alat Tulis',
  'Pembayaran Kantin Sekolah',
  'Uang Kegiatan Ekstrakurikuler',
];

export default function AdminAllowancesPage() {
  const [allowances, setAllowances] = useState<AllowanceRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'income', // 'income' or 'expense'
    amount: '50000',
    description: 'Transfer Uang Saku Mingguan',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllowances();
    fetchStudents();
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchAllowances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/allowances');
      setAllowances(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data uang saku');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
      if (res.data.length > 0 && !formData.student_id) {
        setFormData((prev) => ({ ...prev, student_id: String(res.data[0].id) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAllowances = allowances.filter((item) => {
    let match = true;
    if (search) {
      const q = search.toLowerCase();
      match =
        (item.student?.name || '').toLowerCase().includes(q) ||
        (item.student?.nis || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q);
    }
    if (match && typeFilter) {
      if (typeFilter === 'income') match = Number(item.income) > 0;
      if (typeFilter === 'expense') match = Number(item.expense) > 0;
    }
    if (match && dateFilter) {
      match = item.date === dateFilter;
    }
    return match;
  });

  const handleOpenModal = () => {
    setFormData({
      student_id: students.length > 0 ? String(students[0].id) : '',
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      amount: '50000',
      description: 'Transfer Uang Saku Mingguan',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id) {
      setError('Silakan pilih siswa.');
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
      setIsModalOpen(false);
      showToast('success', 'Transaksi uang saku berhasil dicatat.');
      fetchAllowances();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan transaksi uang saku.');
      showToast('error', 'Gagal menyimpan transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, studentName?: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus transaksi uang saku ${studentName || ''}?`)) return;
    try {
      await api.delete(`/allowances/${id}`);
      showToast('info', 'Transaksi uang saku telah dihapus.');
      fetchAllowances();
    } catch (err) {
      showToast('error', 'Gagal menghapus transaksi');
    }
  };

  const setAmountPreset = (val: string) => {
    setFormData((prev) => ({ ...prev, amount: val }));
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setDateFilter('');
  };

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-6 animate-fade-in">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Wallet className="w-6 h-6 text-emerald-700" />
              Manajemen Uang Saku Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-1">Pencatatan mutasi saldo, pemasukan, pengeluaran, & e-money siswa</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Catat Transaksi Uang Saku
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="w-full lg:w-80">
            <FormInput
              icon={Search}
              placeholder="Cari Siswa, NIS, atau Keterangan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={search ? () => setSearch('') : undefined}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
              <FormSelect
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-40"
              >
                <option value="">Semua Jenis Transaksi</option>
                <option value="income">Pemasukan (+)</option>
                <option value="expense">Pengeluaran (-)</option>
              </FormSelect>
            </div>

            <FormInput
              type="date"
              icon={Calendar}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
            />

            {(search || typeFilter || dateFilter) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            <button
              onClick={fetchAllowances}
              className="p-2.5 text-slate-600 hover:text-emerald-700 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50/70 uppercase text-[10px] text-emerald-950 font-bold border-b border-emerald-100 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Jenis Transaksi</th>
                  <th className="py-3.5 px-4">Nominal</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Memuat data uang saku...</p>
                    </td>
                  </tr>
                ) : filteredAllowances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Belum ada catatan transaksi uang saku</p>
                    </td>
                  </tr>
                ) : (
                  filteredAllowances.map((item) => {
                    const isIncome = Number(item.income) > 0;
                    return (
                      <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{item.date}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {item.student?.name}
                          <span className="block text-[10px] text-slate-500 font-mono font-normal">
                            NIS: {item.student?.nis}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="purple">{item.student?.class}</Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          {isIncome ? (
                            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-xs bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" /> Pemasukan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-800 font-bold text-xs bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" /> Pengeluaran
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                          {isIncome
                            ? `+ Rp ${Number(item.income).toLocaleString('id-ID')}`
                            : `- Rp ${Number(item.expense).toLocaleString('id-ID')}`}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate">{item.description}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDelete(item.id, item.student?.name)}
                            className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Add Allowance */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Input Transaksi Uang Saku"
          subtitle="Catat pemasukan atau pengeluaran uang saku siswa"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
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

              <FormInput
                label="Tanggal Transaksi"
                type="date"
                required
                icon={Calendar}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Jenis Transaksi <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`py-2 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 text-[12px] font-semibold transition-all ${
                      formData.type === 'income'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-1 ring-emerald-400/30'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    Masuk (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`py-2 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 text-[12px] font-semibold transition-all ${
                      formData.type === 'expense'
                        ? 'bg-rose-50 border-rose-400 text-rose-700 ring-1 ring-rose-400/30'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Keluar (-)
                  </button>
                </div>
              </div>

              <div>
                <FormInput
                  label="Nominal (Rp)"
                  type="number"
                  required
                  icon={Banknote}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  helperText={`Terbilang: Rp ${Number(formData.amount || 0).toLocaleString('id-ID')}`}
                />
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-medium text-slate-400 mr-1">Cepat:</span>
                  {['10000', '20000', '50000', '100000'].map((preset) => (
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
              <FormInput
                label="Keterangan"
                required
                icon={FileText}
                placeholder="misal: Top Up Uang Saku Mingguan"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                <span className="text-[10px] text-slate-400 font-medium mr-0.5">Cepat:</span>
                {DESCRIPTION_PRESETS.slice(0, 3).map((desc) => (
                  <button
                    key={desc}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, description: desc }))}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 transition-colors"
                  >
                    {desc}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
                  'Simpan Transaksi'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
