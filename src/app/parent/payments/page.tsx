'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Building2,
  School,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Printer,
  X,
  ChevronRight,
  Calendar,
  Wallet,
  Receipt,
  Layers,
} from 'lucide-react';

interface Payment {
  id: number;
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
}

export default function ParentPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [loading, setLoading] = useState(true);

  // Receipt Modal State for viewing historical paid bills
  const [receiptData, setReceiptData] = useState<any | null>(null);

  useEffect(() => {
    try {
      const cachedStudent = localStorage.getItem('parent_student_cache');
      const cachedPay = localStorage.getItem('parent_payments_cache');
      if (cachedStudent) {
        setStudent(JSON.parse(cachedStudent));
      }
      if (cachedPay) {
        const parsed = JSON.parse(cachedPay);
        setPayments(parsed.payments || []);
        setTotalPaid(parsed.total_paid || 0);
        setTotalUnpaid(parsed.total_unpaid || 0);
        setBreakdown(parsed.breakdown || null);
        setLoading(false);
        fetchPayments(true);
        return;
      }
    } catch {}

    fetchPayments(false);
  }, []);

  const fetchPayments = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);

      let studentId: number | null = null;
      try {
        const cachedStudent = localStorage.getItem('parent_student_cache');
        if (cachedStudent) {
          const parsed = JSON.parse(cachedStudent);
          studentId = parsed.id;
          setStudent(parsed);
        }
      } catch {}

      if (studentId) {
        const [resStudent, resPayment] = await Promise.all([
          api.get('/student'),
          api.get(`/payment/student/${studentId}`),
        ]);
        if (resStudent.data?.student) {
          setStudent(resStudent.data.student);
          try {
            localStorage.setItem('parent_student_cache', JSON.stringify(resStudent.data.student));
          } catch {}
        }
        setPayments(resPayment.data.payments || []);
        setTotalPaid(resPayment.data.total_paid || 0);
        setTotalUnpaid(resPayment.data.total_unpaid || 0);
        setBreakdown(resPayment.data.breakdown || null);

        try {
          localStorage.setItem('parent_payments_cache', JSON.stringify(resPayment.data));
        } catch {}
      } else {
        const resStudent = await api.get('/student');
        const sid = resStudent.data.student.id;
        setStudent(resStudent.data.student);
        try {
          localStorage.setItem('parent_student_cache', JSON.stringify(resStudent.data.student));
        } catch {}

        const resPayment = await api.get(`/payment/student/${sid}`);
        setPayments(resPayment.data.payments || []);
        setTotalPaid(resPayment.data.total_paid || 0);
        setTotalUnpaid(resPayment.data.total_unpaid || 0);
        setBreakdown(resPayment.data.breakdown || null);

        try {
          localStorage.setItem('parent_payments_cache', JSON.stringify(resPayment.data));
        } catch {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Navigates directly to the dedicated payment checkout page
  const handleNavigateToPay = (id?: number, category?: 'SPP' | 'Kegiatan') => {
    if (id) {
      router.push(`/parent/payments/pay?id=${id}`);
    } else if (category) {
      router.push(`/parent/payments/pay?category=${category}`);
    } else {
      router.push('/parent/payments/pay');
    }
  };

  const handleViewReceipt = (payment: Payment) => {
    const isYayasan = payment.category === 'SPP' || payment.destination?.includes('Yayasan');
    setReceiptData({
      transaction_id: `PAY-${Date.parse(payment.createdAt || new Date().toISOString())}-${payment.id}`,
      date: payment.createdAt
        ? new Date(payment.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
        : new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      student_name: student?.name || 'Siswa',
      nis: student?.nis || '-',
      title: payment.title || (payment.category === 'Kegiatan' ? 'Anggaran Kegiatan' : 'SPP Bulanan'),
      category: payment.category || 'SPP',
      destination: payment.destination || (isYayasan ? 'Yayasan Pondok Pesantren Al-Furqon' : 'Sekolah (SMA Al-Furqon)'),
      amount: payment.amount,
      payment_method: payment.notes || 'Pembayaran Online',
      status: 'LUNAS',
    });
  };

  if (loading) {
    return (
      <DashboardLayout allowedRole="parent">
        <div className="py-24 text-center text-slate-500">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Memuat data tagihan SPP & sistem pembayaran online...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isSantri = Boolean(student?.isSantri ?? student?.is_santri);
  const residence = student?.residenceType || student?.residence_type || 'Non-Asrama';
  const hasDiscount = Boolean(student?.hasDiscount ?? student?.has_discount);
  const discountNotes = student?.discountNotes || student?.discount_notes;

  return (
    <DashboardLayout allowedRole="parent">
      <div className="space-y-6 animate-fade-in pb-16 md:pb-8">
        {/* HEADER: MATERIAL DESIGN GREEN & WHITE CARD */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                PORTAL PEMBAYARAN ONLINE
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-[11px] font-bold text-slate-500">
                SMA AL - FURQON DRIYOREJO
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Status & Riwayat Tagihan SPP
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Kewajiban pembayaran SPP & Anggaran Kegiatan untuk <strong className="text-slate-900">{student?.name || 'Siswa'}</strong> ({student?.class || 'Siswa'})
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant={isSantri ? 'success' : 'slate'}>
                {isSantri ? 'Santri Pondok' : 'Non-Santri'}
              </Badge>
              <Badge variant={residence === 'Asrama' ? 'purple' : 'info'}>
                {residence}
              </Badge>
              {hasDiscount && (
                <span title={discountNotes || 'Tarif Khusus Keringanan'}>
                  <Badge variant="warning">Keringanan Biaya</Badge>
                </span>
              )}
            </div>
          </div>

          {/* Quick Pay Action Button: Redirects to /parent/payments/pay */}
          {totalUnpaid > 0 ? (
            <button
              type="button"
              onClick={() => handleNavigateToPay()}
              className="w-full lg:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-700/25 flex items-center justify-center gap-2.5 transition-all hover:scale-102 active:scale-95 shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              <span>Bayar Tagihan Online (Rp {totalUnpaid.toLocaleString('id-ID')})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Semua Tagihan Saat Ini Telah Lunas</span>
            </div>
          )}
        </div>

        {/* Notice Keringanan Biaya (if any) */}
        {hasDiscount && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Tarif Pembayaran Khusus / Keringanan Biaya</p>
              <p className="text-[11px] text-amber-900 mt-0.5">
                Siswa telah disetujui mendapatkan penyesuaian biaya: <span className="font-semibold">{discountNotes || 'Keringanan Biaya Yayasan/Sekolah'}</span>.
              </p>
            </div>
          </div>
        )}

        {/* SALURAN DANA CARDS: YAYASAN vs SEKOLAH (MATERIAL DESIGN) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Card 1: SPP Siswa (Yayasan Pondok Pesantren Al-Furqon) */}
          <div className="bg-white rounded-3xl p-6 border-2 border-amber-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  Saluran SPP Siswa
                </span>
                <Badge variant={breakdown?.yayasan?.unpaid === 0 ? 'success' : 'danger'}>
                  {breakdown?.yayasan?.unpaid === 0 ? 'LUNAS' : 'ADA TAGIHAN'}
                </Badge>
              </div>

              <p className="text-xs font-medium text-slate-500 mb-1">
                Tujuan Penyaluran: <strong className="text-amber-950">Yayasan Pondok Pesantren Al-Furqon</strong>
              </p>

              <div className="mt-2">
                <span className="text-xs text-slate-500 block">Total SPP yang Sudah Terbayar:</span>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
                  Rp {Number(breakdown?.yayasan?.paid || 0).toLocaleString('id-ID')}
                </h3>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Sisa Tagihan SPP:</span>
                <span className="font-extrabold text-rose-700 text-sm sm:text-base">
                  Rp {Number(breakdown?.yayasan?.unpaid || 0).toLocaleString('id-ID')}
                </span>
              </div>

              {Number(breakdown?.yayasan?.unpaid || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => handleNavigateToPay(undefined, 'SPP')}
                  className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-102 active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar SPP Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Anggaran Kegiatan (Sekolah SMA Al-Furqon) */}
          <div className="bg-white rounded-3xl p-6 border-2 border-emerald-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <School className="w-4 h-4" />
                  </div>
                  Saluran Anggaran Kegiatan
                </span>
                <Badge variant={breakdown?.sekolah?.unpaid === 0 ? 'success' : 'danger'}>
                  {breakdown?.sekolah?.unpaid === 0 ? 'LUNAS' : 'ADA TAGIHAN'}
                </Badge>
              </div>

              <p className="text-xs font-medium text-slate-500 mb-1">
                Tujuan Penyaluran: <strong className="text-emerald-950">Sekolah (SMA Al-Furqon)</strong>
              </p>

              <div className="mt-2">
                <span className="text-xs text-slate-500 block">Total Kegiatan yang Sudah Terbayar:</span>
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
                  Rp {Number(breakdown?.sekolah?.paid || 0).toLocaleString('id-ID')}
                </h3>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Sisa Tagihan Kegiatan:</span>
                <span className="font-extrabold text-rose-700 text-sm sm:text-base">
                  Rp {Number(breakdown?.sekolah?.unpaid || 0).toLocaleString('id-ID')}
                </span>
              </div>

              {Number(breakdown?.sekolah?.unpaid || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => handleNavigateToPay(undefined, 'Kegiatan')}
                  className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-102 active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar Kegiatan Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* OVERALL ACCUMULATION CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-emerald-100 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Akumulasi Pembayaran Lunas</p>
              <h4 className="text-2xl font-black text-emerald-700 mt-1">
                Rp {totalPaid.toLocaleString('id-ID')}
              </h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-rose-100 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-semibold text-slate-500">Sisa Total Tagihan Belum Lunas</p>
              <h4 className="text-2xl font-black text-rose-700 mt-1">
                Rp {totalUnpaid.toLocaleString('id-ID')}
              </h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-2xs">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* BILL LIST: MOBILE CARDS VIEW & DESKTOP TABLE VIEW */}
        <div className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                Daftar Tagihan & Riwayat Pembayaran
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik &quot;Bayar Sekarang&quot; untuk langsung melanjutkan ke halaman checkout pembayaran
              </p>
            </div>

            {totalUnpaid > 0 && (
              <button
                type="button"
                onClick={() => handleNavigateToPay()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1.5 transition-colors w-fit"
              >
                <span>Checkout Tagihan ({payments.filter(p => p.status === 'Belum Lunas').length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 1. MOBILE CARDS VIEW (Clean, touchable cards for phones/mobile WebView) */}
          <div className="block md:hidden p-4 space-y-3">
            {payments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Belum ada data riwayat pembayaran.
              </div>
            ) : (
              payments.map((p) => {
                const isYayasan = p.category === 'SPP' || p.destination?.includes('Yayasan');
                const isPaid = p.status === 'Lunas';

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">
                          {p.title || (p.category === 'Kegiatan' ? 'Anggaran Kegiatan' : 'SPP Bulanan')}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {p.semester} • {p.academic_year || p.academicYear || '2024/2025'}
                        </span>
                      </div>
                      <Badge variant={isPaid ? 'success' : 'danger'}>
                        {p.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between py-2 border-y border-slate-100 text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        {isYayasan ? <Building2 className="w-3.5 h-3.5 text-amber-700" /> : <School className="w-3.5 h-3.5 text-emerald-700" />}
                        {isYayasan ? 'Yayasan Al-Furqon' : 'Sekolah SMA'}
                      </span>
                      <span className="font-black text-sm text-slate-900">
                        Rp {Number(p.amount).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {isPaid ? (
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(p)}
                        className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-extrabold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Lihat Bukti Resi Lunas</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleNavigateToPay(p.id)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar Sekarang (Halaman Pembayaran)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 2. DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-600 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">Jenis Tagihan</th>
                  <th className="py-3.5 px-4 font-extrabold">Saluran Dana Penerima</th>
                  <th className="py-3.5 px-4 font-extrabold">Semester & Tahun</th>
                  <th className="py-3.5 px-4 font-extrabold">Nominal</th>
                  <th className="py-3.5 px-4 font-extrabold">Status</th>
                  <th className="py-3.5 px-4 text-center font-extrabold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Belum ada data riwayat pembayaran.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const isYayasan = p.category === 'SPP' || p.destination?.includes('Yayasan');

                    return (
                      <tr key={p.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div>
                            <span className="font-extrabold text-slate-900">
                              {p.title || (p.category === 'Kegiatan' ? 'Anggaran Kegiatan' : 'SPP Bulanan')}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-normal">
                              Kategori: {p.category || 'SPP'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                              isYayasan
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            }`}
                          >
                            {isYayasan ? (
                              <Building2 className="w-3.5 h-3.5 text-amber-700" />
                            ) : (
                              <School className="w-3.5 h-3.5 text-emerald-700" />
                            )}
                            {p.destination ||
                              (isYayasan ? 'Yayasan Pondok Pesantren Al-Furqon' : 'Sekolah (SMA Al-Furqon)')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {p.semester}
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {p.academic_year || p.academicYear || '2024/2025'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                          Rp {Number(p.amount).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={p.status === 'Lunas' ? 'success' : 'danger'}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {p.status === 'Belum Lunas' ? (
                            <button
                              type="button"
                              onClick={() => handleNavigateToPay(p.id)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-sm shadow-emerald-700/20 flex items-center justify-center gap-1.5 mx-auto transition-all hover:scale-105 active:scale-95"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Bayar Sekarang</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleViewReceipt(p)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1 mx-auto transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Lihat Resi</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: BUKTI RESI SETORAN LUNAS (RECEIPT MODAL) */}
        {receiptData && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Receipt Header */}
              <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white text-center relative">
                <button
                  type="button"
                  onClick={() => setReceiptData(null)}
                  className="absolute right-4 top-4 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-2 text-emerald-300">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black tracking-tight">BUKTI PEMBAYARAN LUNAS</h3>
                <p className="text-[11px] text-emerald-200 uppercase tracking-widest font-semibold mt-0.5">
                  SMA AL - FURQON DRIYOREJO
                </p>
              </div>

              {/* Printable Receipt Body */}
              <div id="printable-receipt" className="p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs">
                <div className="text-center pb-3 border-b border-dashed border-slate-200">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-full text-xs">
                    STATUS: LUNAS VERIFIKASI
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1.5">No. Transaksi: {receiptData.transaction_id}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{receiptData.date}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Siswa:</span>
                    <strong className="text-slate-900">{receiptData.student_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIS Siswa:</span>
                    <strong className="font-mono text-slate-800">{receiptData.nis}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Item Pembayaran:</span>
                    <strong className="text-slate-900">{receiptData.title}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Saluran Dana:</span>
                    <strong className="text-emerald-800 font-semibold text-[11px] truncate max-w-[200px]">
                      {receiptData.destination}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kanal Pembayaran:</span>
                    <strong className="text-slate-800">{receiptData.payment_method}</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Total Terbayar:</span>
                  <span className="text-lg font-black text-emerald-800">
                    Rp {Number(receiptData.amount).toLocaleString('id-ID')}
                  </span>
                </div>

                <p className="text-[10px] text-center text-slate-400 font-medium italic pt-2">
                  * Resi ini diterbitkan secara otomatis oleh sistem LMS SMA AL - FURQON DRIYOREJO dan berlaku sebagai bukti setoran sah.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  Cetak Resi PDF
                </button>

                <button
                  type="button"
                  onClick={() => setReceiptData(null)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-sm transition-colors"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
