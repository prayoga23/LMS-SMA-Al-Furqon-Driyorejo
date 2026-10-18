'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Save,
  KeyRound,
  Calendar,
  School,
  GraduationCap,
  Sparkles,
  Check,
  Loader2,
  Users,
  Building2,
  BadgeCheck,
} from 'lucide-react';

interface StudentInfo {
  id: number;
  nis: string;
  name: string;
  class: string;
  major: string;
  isSantri: boolean;
  residenceType: string;
}

interface TeacherInfo {
  id: number;
  nip: string;
  name: string;
  subject: string;
  phone?: string | null;
  status: string;
}

interface FullUserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  createdAt: string;
  teacher?: TeacherInfo | null;
  parent?: {
    id: number;
    phone?: string | null;
    students: StudentInfo[];
  } | null;
}

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();

  // State
  const [profile, setProfile] = useState<FullUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [savingPassword, setSavingPassword] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  // Form Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Form Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch full profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile');
      const data: FullUserProfile = res.data.user;
      setProfile(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || data.parent?.phone || data.teacher?.phone || '');
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.response?.data?.message || 'Gagal memuat data profil pengguna.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin Sekolah',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
        };
      case 'guru':
        return {
          label: 'Guru Pengajar',
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          dot: 'bg-teal-500',
        };
      case 'staff':
        return {
          label: 'Staff Tata Usaha',
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          dot: 'bg-sky-500',
        };
      case 'parent':
        return {
          label: 'Orang Tua Siswa',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      default:
        return {
          label: role || 'Pengguna',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const roleBadge = getRoleBadge(profile?.role || authUser?.role);

  // Handle Update Profile Info
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Nama lengkap wajib diisi.',
      });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Format email tidak valid.',
      });
      return;
    }

    try {
      setSavingProfile(true);
      const res = await api.put('/profile', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      // Update auth context state so Navbar & Sidebar reflect new name immediately
      if (res.data.user) {
        updateUser(
          {
            name: res.data.user.name,
            email: res.data.user.email,
          },
          res.data.access_token
        );
      }

      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: res.data.message || 'Profil berhasil diperbarui!',
      });

      // Refresh profile data
      await fetchProfile();
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.response?.data?.message || 'Gagal memperbarui profil pengguna.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Masukkan password saat ini (lama) untuk verifikasi.',
      });
      return;
    }

    if (newPassword.length < 6) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Password baru minimal harus 6 karakter.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Konfirmasi password baru tidak cocok dengan password baru.',
      });
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.put('/profile', {
        name: name.trim() || profile?.name,
        email: email.trim() || profile?.email,
        phone: phone.trim() || profile?.phone,
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.data.access_token && res.data.user) {
        updateUser(
          {
            name: res.data.user.name,
            email: res.data.user.email,
          },
          res.data.access_token
        );
      }

      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: res.data.message || 'Password berhasil diubah!',
      });

      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.response?.data?.message || 'Gagal mengubah password.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Breadcrumb & Title */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
            <span>Portal SMA AL - FURQON</span>
            <span>/</span>
            <span className="text-emerald-700">Profile Pengguna</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Profile Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data diri, informasi kontak, dan keamanan kata sandi akun Anda.
          </p>
        </div>

        {/* Hero Card Summary */}
        <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-teal-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center text-3xl sm:text-4xl font-black text-emerald-200 shadow-inner shrink-0">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
                  {profile?.name || 'Memuat profil...'}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-md border border-white/20 text-emerald-100 shadow-2xs">
                  <span className={`w-2 h-2 rounded-full ${roleBadge.dot}`} />
                  {roleBadge.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-emerald-100/90 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate">{profile?.email || '-'}</span>
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>{profile.phone}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-emerald-200/80">
                  <Calendar className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>
                    Terdaftar sejak{' '}
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </span>
                </span>
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-end gap-1.5 shrink-0 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
              <span className="text-[10px] text-emerald-200/90 font-bold uppercase tracking-wider">
                Status Keamanan
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Password Terenkripsi
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
              activeTab === 'info'
                ? 'bg-emerald-50 text-emerald-800 shadow-2xs border border-emerald-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4 text-emerald-700" />
            <span>Informasi Profil</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
              activeTab === 'security'
                ? 'bg-emerald-50 text-emerald-800 shadow-2xs border border-emerald-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-4 h-4 text-emerald-700" />
            <span>Keamanan & Password</span>
          </button>
        </div>

        {/* Tab 1: Informasi Profil */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Edit Profil */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-700" />
                  Edit Biodata Pengguna
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbarui nama lengkap, alamat email aktif, dan nomor kontak Anda.
                </p>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <p className="text-xs font-semibold text-slate-500">Memuat formulir profil...</p>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Masukkan nama lengkap Anda"
                        required
                        className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Alamat Email (Username Login) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contoh@gmail.com"
                        required
                        className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Email ini digunakan sebagai akun login Anda ke sistem.
                    </p>
                  </div>

                  {/* Nomor Telepon / WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Nomor Telepon / WhatsApp
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Nomor yang dapat dihubungi untuk notifikasi WhatsApp sekolah.
                    </p>
                  </div>

                  {/* Role User (Read Only) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Peran Akun
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                        <BadgeCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {roleBadge.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Hak akses peran dikelola oleh Administrator Sekolah.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 shadow-md shadow-emerald-800/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan Perubahan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Simpan Perubahan Profil</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Sidebar Info Tambahan Sesuai Role */}
            <div className="space-y-6">
              {/* Card Orang Tua: Siswa Terhubung */}
              {profile?.role === 'parent' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Siswa Terhubung
                      </h4>
                      <p className="text-[11px] text-slate-400">Putra/Putri di SMA AL-FURQON</p>
                    </div>
                  </div>

                  {profile.parent?.students && profile.parent.students.length > 0 ? (
                    <div className="space-y-2.5">
                      {profile.parent.students.map((st) => (
                        <div
                          key={st.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="text-xs font-black text-slate-900">{st.name}</h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {st.class}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                            <span>NIS: {st.nis}</span>
                            <span>•</span>
                            <span>{st.major}</span>
                          </div>
                          <div className="pt-0.5">
                            <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 inline-block">
                              {st.residenceType || (st.isSantri ? 'Santri Asrama' : 'Non-Asrama')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      Belum ada siswa yang dikaitkan ke akun ini. Hubungi pihak Tata Usaha.
                    </div>
                  )}
                </div>
              )}

              {/* Card Guru: Info Akademik & Mapel */}
              {profile?.role === 'guru' && profile?.teacher && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Data Pengajar
                      </h4>
                      <p className="text-[11px] text-slate-400">SMA AL - FURQON DRIYOREJO</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        NIP / ID Guru
                      </span>
                      <span className="font-bold text-slate-900">{profile.teacher.nip || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Mata Pelajaran Diampu
                      </span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block mt-0.5">
                        {profile.teacher.subject || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Status Kepegawaian
                      </span>
                      <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 inline-block mt-0.5">
                        {profile.teacher.status || 'Aktif'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Informasi Bantuan / Panduan Akun */}
              <div className="bg-emerald-50/60 rounded-3xl p-6 border border-emerald-100 shadow-2xs">
                <div className="flex items-center gap-2 mb-2 text-emerald-800">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Informasi Akun
                  </h4>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                  Pastikan alamat email Anda selalu aktif dan dapat diakses. Email digunakan sebagai
                  sarana verifikasi dan login utama ke Portal SMA AL-FURQON.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Keamanan & Ganti Password */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  Ganti Password Akun
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Untuk keamanan akun Anda, ganti password secara berkala menggunakan kombinasi yang
                  kuat.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Password Saat Ini (Lama) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Password Saat Ini (Lama) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password Anda saat ini"
                      required
                      className="w-full h-11 pl-10 pr-11 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                      title={showCurrentPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Baru */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Password Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      required
                      className="w-full h-11 pl-10 pr-11 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                      title={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Password Baru */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Konfirmasi Password Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password baru"
                      required
                      className="w-full h-11 pl-10 pr-11 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                      title={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Checklist Syarat Password */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div
                    className={`flex items-center gap-2 font-medium ${
                      newPassword.length >= 6 ? 'text-emerald-700 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 ${
                        newPassword.length >= 6 ? 'text-emerald-600' : 'text-slate-300'
                      }`}
                    />
                    <span>Panjang minimal 6 karakter</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 font-medium ${
                      confirmPassword && newPassword === confirmPassword
                        ? 'text-emerald-700 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 ${
                        confirmPassword && newPassword === confirmPassword
                          ? 'text-emerald-600'
                          : 'text-slate-300'
                      }`}
                    />
                    <span>Password baru dan konfirmasi cocok</span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 shadow-md shadow-emerald-800/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memperbarui Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Perbarui Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar Security Tips */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Tips Keamanan Sandi
                  </h4>
                </div>
                <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>Jangan menggunakan tanggal lahir atau nomor telepon yang mudah ditebak.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>Jangan bagikan password Anda kepada siapa pun demi keamanan data siswa.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
