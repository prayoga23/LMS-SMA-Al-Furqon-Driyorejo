'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FormInput, FormSelect } from '@/components/ui/InputComponents';
import { api } from '@/lib/api';
import {
  UserCog,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  RefreshCw,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Users,
  X,
  Calendar,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'guru' | 'staff' | 'parent' | string;
  createdAt: string;
  parent?: {
    id: number;
    phone?: string;
  };
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin Sekolah', badgeVariant: 'emerald' as const },
  { value: 'guru', label: 'Guru', badgeVariant: 'indigo' as const },
  { value: 'staff', label: 'Staff / TU', badgeVariant: 'warning' as const },
  { value: 'parent', label: 'Orang Tua / Wali', badgeVariant: 'purple' as const },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guru',
    phone: '',
    studentId: '',
  });
  const [studentList, setStudentList] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchStudents();
  }, [search, selectedRole]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students/public');
      setStudentList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', {
        params: { search, role: selectedRole },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'guru',
      phone: '',
      studentId: '',
    });
    setShowPassword(false);
    setError('');
    fetchStudents();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // blank by default unless changing
      role: user.role,
      phone: user.parent?.phone || '',
      studentId: '',
    });
    setShowPassword(false);
    setError('');
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Nama, Email, dan Password wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/users', formData);
      setIsAddModalOpen(false);
      showToast('success', `Berhasil menambahkan pengguna baru: ${formData.name}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menambahkan pengguna baru.');
      showToast('error', 'Gagal menambahkan pengguna baru');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Nama dan Email tidak boleh kosong.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/users/${selectedUser.id}`, formData);
      setIsEditModalOpen(false);
      showToast('success', `Pengguna ${formData.name} berhasil diperbarui.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memperbarui pengguna.');
      showToast('error', 'Gagal memperbarui data pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun pengguna "${name}"?`)) return;
    try {
      await api.delete(`/users/${id}`);
      showToast('info', `Pengguna "${name}" telah dihapus dari sistem.`);
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Gagal menghapus pengguna');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedRole('');
  };

  // Stats calculation
  const totalUsers = users.length;
  const countAdmin = users.filter((u) => u.role === 'admin').length;
  const countGuru = users.filter((u) => u.role === 'guru').length;
  const countStaff = users.filter((u) => u.role === 'staff').length;
  const countParent = users.filter((u) => u.role === 'parent').length;

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin Sekolah', variant: 'emerald' as const, bg: 'bg-emerald-500' };
      case 'guru':
        return { label: 'Guru', variant: 'indigo' as const, bg: 'bg-teal-600' };
      case 'staff':
        return { label: 'Staff / TU', variant: 'warning' as const, bg: 'bg-amber-500' };
      case 'parent':
        return { label: 'Orang Tua', variant: 'purple' as const, bg: 'bg-purple-600' };
      default:
        return { label: role, variant: 'slate' as const, bg: 'bg-slate-500' };
    }
  };

  return (
    <DashboardLayout allowedRole="admin">
      <div className="space-y-6 animate-fade-in">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserCog className="w-7 h-7 text-emerald-700" />
              Manajemen User & Hak Akses
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Kelola akun pengguna, penambahan User Role Guru, Staff, Admin, dan Wali Murid
            </p>
          </div>
          <Link
            href="/admin/users/create"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tambah User Baru
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total User</p>
              <p className="text-xl font-black text-slate-900">{totalUsers}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Admin</p>
              <p className="text-xl font-black text-emerald-950">{countAdmin}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Guru</p>
              <p className="text-xl font-black text-teal-950">{countGuru}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Staff / TU</p>
              <p className="text-xl font-black text-amber-950">{countStaff}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Orang Tua</p>
              <p className="text-xl font-black text-purple-950">{countParent}</p>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <FormInput
              icon={Search}
              placeholder="Cari Nama Pengguna atau Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={search ? () => setSearch('') : undefined}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
              <FormSelect
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-40"
              >
                <option value="">Semua Role</option>
                <option value="admin">Admin Sekolah</option>
                <option value="guru">Guru</option>
                <option value="staff">Staff / TU</option>
                <option value="parent">Orang Tua</option>
              </FormSelect>
            </div>

            {(search || selectedRole) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            <button
              onClick={fetchUsers}
              className="p-2.5 text-slate-600 hover:text-emerald-700 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 transition-colors"
              title="Refresh Data User"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50/70 uppercase text-[10px] text-emerald-950 font-bold border-b border-emerald-100 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Email Login</th>
                  <th className="py-3.5 px-4">Role / Hak Akses</th>
                  <th className="py-3.5 px-4">Tanggal Dibuat</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Memuat data pengguna...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada data pengguna ditemukan</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Coba ubah kata kunci pencarian atau sesuaikan filter role.
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const roleInfo = getRoleDisplay(u.role);
                    return (
                      <tr key={u.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full ${roleInfo.bg} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                            >
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="font-bold text-slate-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }) : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/admin/users/${u.id}/edit`}
                              className="p-2 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100/70 rounded-xl transition-colors"
                              title="Edit Data User"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors"
                              title="Hapus User"
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

        {/* Modal Create User */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Tambah User Baru"
          subtitle="Buat akun pengguna baru dengan role Admin, Guru, Staff, atau Orang Tua"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <FormInput
              label="Nama Lengkap Pengguna"
              required
              icon={User}
              placeholder="Drs. H. Ahmad Wijaya, M.Pd"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <FormInput
              label="Email Login"
              type="email"
              required
              icon={Mail}
              placeholder="guru.fisika@sekolah.sch.id"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Kata Sandi / Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <FormSelect
              label="Hak Akses / User Role"
              required
              icon={UserCog}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>

            {formData.role === 'parent' && (
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3 animate-fade-in">
                <FormInput
                  label="No. HP / WhatsApp Wali"
                  placeholder="081234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />

                <FormSelect
                  label="Hubungkan dengan Anak (Siswa Terdaftar)"
                  icon={GraduationCap}
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                >
                  <option value="">-- Pilih Siswa (Opsional) --</option>
                  {studentList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - Kelas {s.class} (NIS: {s.nis})
                    </option>
                  ))}
                </FormSelect>
                <p className="text-[10px] text-purple-800 font-medium">
                  * Memilih siswa akan langsung menghubungkan akun Orang Tua ini dengan data SPP, presensi, dan nilai siswa tersebut.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Pengguna Baru'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Edit User */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Data Pengguna"
          subtitle={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : ''}
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <FormInput
              label="Nama Lengkap Pengguna"
              required
              icon={User}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <FormInput
              label="Email Login"
              type="email"
              required
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <FormSelect
              label="Hak Akses / User Role"
              required
              icon={UserCog}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Ubah Password (Opsional)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Biarkan kosong jika tidak ingin mengganti password pengguna saat ini.
              </p>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password Baru (opsional)"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  'Perbarui Data User'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
