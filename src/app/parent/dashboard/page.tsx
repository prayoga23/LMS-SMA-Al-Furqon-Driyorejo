'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import {
  User,
  CreditCard,
  CalendarCheck,
  Award,
  GraduationCap,
  Bell,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  BookMarked,
  Wallet,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

interface ParentDashboardData {
  student: {
    id: number;
    name: string;
    nis: string;
    class: string;
    major: string;
    entryYear: number;
    parent?: {
      phone: string;
      user?: { name: string; email: string };
    };
  } | null;
  attendance_percentage: number;
  average_grade: number;
  latest_payment_status: string;
}

interface AcademicInfo {
  id: number;
  title: string;
  category: string;
  description: string;
  date: string;
}

interface StudentOption {
  id: number;
  nis: string;
  name: string;
  class: string;
  major: string;
}

export default function ParentDashboardPage() {
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [academics, setAcademics] = useState<AcademicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Student Link Autocomplete state (If parent wants to link/change student)
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const resStudent = await api.get('/student');
      setData(resStudent.data);

      const resAcademic = await api.get('/academic');
      setAcademics(resAcademic.data.all || []);
    } catch (err: any) {
      console.error('Error fetching parent student data:', err);
      showToast('error', 'Gagal memuat data siswa terikat.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStudents = async (query: string) => {
    try {
      const res = await api.get('/students/public', { params: { search: query } });
      setStudentOptions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLinkStudent = async (studentId: number, studentName: string) => {
    try {
      setIsLinking(true);
      await api.post('/register', {
        studentId,
      });
      showToast('success', `Berhasil terhubung dengan data siswa ${studentName}!`);
      setShowStudentPicker(false);
      fetchData();
    } catch (err: any) {
      // Fallback API jika register tidak digunakan
      try {
        await api.put(`/students/${studentId}`, { parentId: 1 });
        showToast('success', `Berhasil terhubung dengan data siswa ${studentName}!`);
        setShowStudentPicker(false);
        fetchData();
      } catch (e: any) {
        showToast('error', 'Gagal menghubungkan data siswa.');
      }
    } finally {
      setIsLinking(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRole="parent">
        <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold">Memuat Data Siswa & Portal Pemantauan...</p>
        </div>
      </DashboardLayout>
    );
  }

  const formatMajor = (major?: string) => {
    if (!major) return 'IPA';
    if (major.includes('IPA') || major.includes('MIPA')) return 'IPA';
    if (major.includes('IPS')) return 'IPS';
    return major;
  };

  const student = data?.student;

  return (
    <DashboardLayout allowedRole="parent">
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* ─── 1. WELCOME HEADER BANNER ─── */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-900/15 border border-emerald-600/30">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-md shrink-0">
                {student?.name ? student.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-emerald-200 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/40">
                    PORTAL PEMANTAUAN SISWA
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">
                    SMA AL - FURQON
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {student?.name || 'Siswa Terdaftar'}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5 truncate">
                  NIS: <strong className="font-mono text-white">{student?.nis || '-'}</strong> • Kelas:{' '}
                  <strong className="text-white">{student?.class || '-'}</strong> ({formatMajor(student?.major)})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Wali: {student?.parent?.user?.name || 'Orang Tua Siswa'}
              </span>

              <button
                onClick={() => {
                  fetchData();
                  showToast('info', 'Data dashboard berhasil diperbarui!');
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
                title="Segarkan Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── 2. REKAP RINGKASAN SISWA (4 KPI CARDS) ─── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Ringkasan Akademik & Keuangan Siswa
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Link href="/parent/payments" className="block active:scale-98 transition-transform">
              <StatCard
                title="Pembayaran SPP"
                value={data?.latest_payment_status === 'Lunas' ? 'Belum ada tagihan' : (data?.latest_payment_status || 'Belum ada tagihan')}
                subtext={data?.latest_payment_status === 'Lunas' ? 'Status: Lunas' : 'Klik untuk Bayar Online'}
                icon={CreditCard}
                gradient={
                  data?.latest_payment_status === 'Lunas'
                    ? 'from-emerald-50 to-teal-50/60'
                    : 'from-amber-50 to-orange-50/60'
                }
                iconBg={
                  data?.latest_payment_status === 'Lunas'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-amber-600 text-white animate-pulse'
                }
              />
            </Link>

            <Link href="/parent/attendance" className="block active:scale-98 transition-transform">
              <StatCard
                title="Presensi Siswa"
                value={`${data?.attendance_percentage || 100}%`}
                subtext="Tingkat Kehadiran"
                icon={CalendarCheck}
                gradient="from-sky-50 to-teal-50/40"
                iconBg="bg-sky-600 text-white"
              />
            </Link>

            <Link href="/parent/grades" className="block active:scale-98 transition-transform">
              <StatCard
                title="Rata-rata Nilai"
                value={data?.average_grade || 0}
                subtext="Prestasi Akademik"
                icon={Award}
                gradient="from-purple-50 to-emerald-50/40"
                iconBg="bg-purple-600 text-white"
              />
            </Link>

            <StatCard
              title="Tahun Masuk"
              value={student?.entryYear || 2024}
              subtext="Angkatan Siswa"
              icon={GraduationCap}
              gradient="from-teal-50 to-emerald-50/40"
              iconBg="bg-teal-700 text-white"
            />
          </div>
        </div>

        {/* ─── 3. NAVIGASI PINTASAN LAYANAN MOBILE ─── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Pintasan Layanan Portal Wali Siswa
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Link
              href="/parent/payments"
              className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group active:scale-95"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors shadow-2xs">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 truncate w-full">Pembayaran SPP</span>
            </Link>

            <Link
              href="/parent/attendance"
              className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group active:scale-95"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-100/80 text-teal-800 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors shadow-2xs">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 truncate w-full">Presensi Siswa</span>
            </Link>

            <Link
              href="/parent/grades"
              className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group active:scale-95"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-100/80 text-purple-800 flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors shadow-2xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 truncate w-full">Rapor & Nilai</span>
            </Link>

            <Link
              href="/parent/allowance"
              className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group active:scale-95"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors shadow-2xs">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 truncate w-full">Uang Saku</span>
            </Link>

            <Link
              href="/parent/academics"
              className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group active:scale-95 col-span-2 sm:col-span-1"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-2xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 truncate w-full">Info Sekolah</span>
            </Link>
          </div>
        </div>

        {/* ─── 4. PENGUMUMAN SEKOLAH TERBARU ─── */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-700" />
              Pengumuman Sekolah Terbaru
            </h3>
            <Link
              href="/parent/academics"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 shrink-0"
            >
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {academics.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-emerald-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="emerald">{item.category}</Badge>
                    <span className="text-xs font-mono text-slate-500">{item.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">{item.description}</p>
                </div>
              </div>
            ))}

            {academics.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada pengumuman sekolah terbaru.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
