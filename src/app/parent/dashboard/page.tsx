'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
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
} from 'lucide-react';
import Link from 'next/link';

interface ParentDashboardData {
  student: {
    id: number;
    name: string;
    nis: string;
    class: string;
    major: string;
    entry_year: number;
    parent?: {
      phone: string;
      user?: { name: string; email: string };
    };
  };
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

export default function ParentDashboardPage() {
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [academics, setAcademics] = useState<AcademicInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resStudent = await api.get('/student');
      setData(resStudent.data);

      const resAcademic = await api.get('/academic');
      setAcademics(resAcademic.data.all || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRole="parent">
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat data siswa...
        </div>
      </DashboardLayout>
    );
  }

  const student = data?.student;

  return (
    <DashboardLayout allowedRole="parent">
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Student Mobile App Header Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-900/15 border border-emerald-700">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-md shrink-0">
                {student?.name ? student.name.charAt(0) : 'S'}
              </div>
              <div className="min-w-0">
                <span className="inline-block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-emerald-200 bg-emerald-950/50 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-emerald-600/60">
                  PORTAL PEMANTAUAN SISWA
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-1 truncate">
                  {student?.name}
                </h2>
                <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5 truncate">
                  NIS: <strong className="font-mono text-white">{student?.nis}</strong> • Kelas:{' '}
                  <strong className="text-white">{student?.class}</strong> ({student?.major})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold text-white flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Wali: {student?.parent?.user?.name || 'Orang Tua'}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards (2x2 Grid on Mobile) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Ringkasan Siswa
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
            <Link href="/parent/payments" className="block active:scale-98 transition-transform">
              <StatCard
                title="Pembayaran SPP"
                value={data?.latest_payment_status || 'N/A'}
                subtext={data?.latest_payment_status === 'Lunas' ? 'Semester Berjalan' : 'Klik untuk Bayar Online'}
                icon={CreditCard}
                gradient={
                  data?.latest_payment_status === 'Lunas'
                    ? 'from-emerald-50 to-teal-50/60'
                    : 'from-rose-50 to-amber-50/60'
                }
                iconBg={
                  data?.latest_payment_status === 'Lunas'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-rose-600 text-white animate-pulse'
                }
              />
            </Link>
            <StatCard
              title="Presensi Siswa"
              value={`${data?.attendance_percentage || 0}%`}
              subtext="Tingkat kehadiran"
              icon={CalendarCheck}
              gradient="from-sky-50 to-teal-50/40"
              iconBg="bg-sky-600 text-white"
            />
            <StatCard
              title="Rata-rata Nilai"
              value={data?.average_grade || 0}
              subtext="Prestasi Akademik"
              icon={Award}
              gradient="from-purple-50 to-emerald-50/40"
              iconBg="bg-purple-600 text-white"
            />
            <StatCard
              title="Tahun Masuk"
              value={student?.entry_year || 2024}
              subtext="Angkatan Siswa"
              icon={GraduationCap}
              gradient="from-teal-50 to-emerald-50/40"
              iconBg="bg-teal-700 text-white"
            />
          </div>
        </div>

        {/* Mobile Quick Action Menu Grid */}
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Navigasi Layanan Mobile
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Link
              href="/parent/payments"
              className="p-3.5 sm:p-4 bg-white rounded-2xl border border-emerald-200/80 shadow-md shadow-slate-200/60 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col items-center text-center gap-2 group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors shadow-2xs">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 truncate w-full">Pembayaran SPP</span>
            </Link>

            <Link
              href="/parent/attendance"
              className="p-3.5 sm:p-4 bg-white rounded-2xl border border-emerald-200/80 shadow-md shadow-slate-200/60 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col items-center text-center gap-2 group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors shadow-2xs">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 truncate w-full">Presensi Siswa</span>
            </Link>

            <Link
              href="/parent/grades"
              className="p-3.5 sm:p-4 bg-white rounded-2xl border border-emerald-200/80 shadow-md shadow-slate-200/60 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col items-center text-center gap-2 group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors shadow-2xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 truncate w-full">Rapor & Nilai</span>
            </Link>

            <Link
              href="/parent/allowance"
              className="p-3.5 sm:p-4 bg-white rounded-2xl border border-emerald-200/80 shadow-md shadow-slate-200/60 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col items-center text-center gap-2 group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors shadow-2xs">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 truncate w-full">Uang Saku</span>
            </Link>

            <Link
              href="/parent/academics"
              className="p-3.5 sm:p-4 bg-white rounded-2xl border border-emerald-200/80 shadow-md shadow-slate-200/60 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col items-center text-center gap-2 group active:scale-95 col-span-2 sm:col-span-1"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-2xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 truncate w-full">Info Sekolah</span>
            </Link>
          </div>
        </div>

        {/* Latest Academic Announcements */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-emerald-200/80 shadow-md shadow-slate-200/80">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-base font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              Pengumuman Sekolah Terbaru
            </h3>
            <Link
              href="/parent/academics"
              className="text-[11px] sm:text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 shrink-0"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {academics.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="emerald">{item.category}</Badge>
                    <span className="text-[10px] font-mono text-slate-500">{item.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
