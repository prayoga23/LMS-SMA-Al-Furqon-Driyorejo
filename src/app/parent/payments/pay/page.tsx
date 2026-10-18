'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  Landmark,
  Building2,
  School,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Clock,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Printer,
  ChevronRight,
  ExternalLink,
  Info,
  Calendar,
  User,
  Hash,
  Wallet,
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

function PaymentCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetIdParam = searchParams.get('id');
  const targetCategoryParam = searchParams.get('category');

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [unpaidPayments, setUnpaidPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Payment Channel: 'qris' | 'transfer' | 'va'
  const [channel, setChannel] = useState<'qris' | 'transfer' | 'va'>('qris');
  const [selectedBank, setSelectedBank] = useState<'bsi' | 'bca' | 'mandiri' | 'bri'>('bca');
  const [vaBank, setVaBank] = useState<'bca' | 'mandiri' | 'bri' | 'bni' | 'bsi'>('bca');

  // Copy Feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // QR Code State
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes timer

  // Submit & Receipt State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  // 15-minute countdown timer
  useEffect(() => {
    if (receiptData) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(timer);
  }, [receiptData]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch student and payments
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Try reading cached student or fetch
        let currentStudent: any = null;
        try {
          const cached = localStorage.getItem('parent_student_cache');
          if (cached) currentStudent = JSON.parse(cached);
        } catch {}

        if (!currentStudent) {
          const resStudent = await api.get('/student');
          currentStudent = resStudent.data?.student;
          try {
            localStorage.setItem('parent_student_cache', JSON.stringify(currentStudent));
          } catch {}
        }
        setStudent(currentStudent);

        if (currentStudent?.id) {
          const resPay = await api.get(`/payment/student/${currentStudent.id}`);
          const allPayments: Payment[] = resPay.data?.payments || [];
          const unpaid = allPayments.filter((p) => p.status === 'Belum Lunas');
          setUnpaidPayments(unpaid);

          // Select matching payment
          let active: Payment | undefined;
          if (targetIdParam) {
            active = unpaid.find((p) => p.id === Number(targetIdParam));
            if (!active) {
              // Might already be lunas or specified id
              active = allPayments.find((p) => p.id === Number(targetIdParam));
            }
          }

          if (!active && targetCategoryParam) {
            active = unpaid.find((p) => p.category === targetCategoryParam);
          }

          if (!active && unpaid.length > 0) {
            active = unpaid[0];
          }

          setSelectedPayment(active || null);
        }
      } catch (err) {
        console.error('Error loading payment data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [targetIdParam, targetCategoryParam]);

  // Generate QR Code when selected payment or channel changes
  useEffect(() => {
    if (!selectedPayment) return;

    const payload = `ALFURQON-PAY-${selectedPayment.id}-NIS${student?.nis || '000000'}-RP${selectedPayment.amount}`;
    QRCode.toDataURL(payload, {
      width: 400,
      margin: 1,
      color: {
        dark: '#064e3b', // Deep emerald dark modules
        light: '#ffffff', // Crisp white background
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR:', err));
  }, [selectedPayment, student]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QRIS-ALFURQON-${selectedPayment?.id || 'PAY'}.png`;
    link.click();
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;

    setIsSubmitting(true);
    try {
      let channelLabel = 'QRIS Instant Nasional';
      let bankLabel = '';

      if (channel === 'qris') {
        channelLabel = 'QRIS Instant (e-Wallet / Mobile Banking)';
        bankLabel = 'QRIS BI';
      } else if (channel === 'transfer') {
        channelLabel = 'Transfer Bank Langsung';
        bankLabel = selectedBank.toUpperCase();
      } else {
        channelLabel = 'Virtual Account (VA)';
        bankLabel = vaBank.toUpperCase();
      }

      const res = await api.post(`/payments/${selectedPayment.id}/pay`, {
        paymentMethod: channelLabel,
        bankName: bankLabel,
      });

      // Update cached payments if any
      try {
        localStorage.removeItem('parent_payments_cache');
      } catch {}

      setReceiptData(res.data.receipt);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses konfirmasi pembayaran. Silakan periksa koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRole="parent">
        <div className="py-24 text-center">
          <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-700 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800">Menyiapkan Portal Pembayaran...</h3>
          <p className="text-xs text-slate-500 mt-1">Memuat rekening resmi dan QR Code transaksi Al-Furqon</p>
        </div>
      </DashboardLayout>
    );
  }

  // If receipt is ready, show full-screen receipt design
  if (receiptData) {
    return (
      <DashboardLayout allowedRole="parent">
        <div className="max-w-2xl mx-auto py-4 px-2 sm:px-0 animate-fade-in">
          {/* Success Banner */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-700/25 animate-scale-up">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-200">
              Transaksi Terverifikasi Sah
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
              Pembayaran Berhasil Dikonfirmasi!
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
              Terima kasih. Dana pembayaran telah tercatat dan disalurkan ke kas resmi sekolah/yayasan.
            </p>
          </div>

          {/* Official Digital Receipt Card */}
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden">
            {/* Header Nota */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain mx-auto mb-2 drop-shadow-md" />
              <h3 className="text-base font-black tracking-wider uppercase">SMA AL - FURQON DRIYOREJO</h3>
              <p className="text-[11px] text-emerald-200 font-semibold tracking-widest uppercase">
                Bukti Setoran Pembayaran Sah
              </p>
            </div>

            {/* Receipt Details Body */}
            <div className="p-6 sm:p-8 space-y-5 text-xs text-slate-700" id="receipt-print-area">
              <div className="flex items-center justify-between pb-4 border-b border-dashed border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">NO. TRANSAKSI RESMI</span>
                  <strong className="font-mono text-xs sm:text-sm text-slate-900">{receiptData.transaction_id}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">TANGGAL & WAKTU</span>
                  <span className="font-mono text-[11px] text-slate-700 font-bold">{receiptData.date}</span>
                </div>
              </div>

              {/* Information Grid */}
              <div className="space-y-3">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Nama Siswa:</span>
                  <strong className="text-slate-900 text-right">{receiptData.student_name}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Nomor Induk Siswa (NIS):</span>
                  <span className="font-mono font-bold text-slate-800">{receiptData.nis}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Jenis Pembayaran:</span>
                  <strong className="text-slate-900 text-right">{receiptData.title}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tujuan Penyaluran:</span>
                  <span className="font-bold text-emerald-800 text-right max-w-[240px]">{receiptData.destination}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Metode & Kanal:</span>
                  <span className="font-semibold text-slate-800 text-right">{receiptData.payment_method}</span>
                </div>
              </div>

              {/* Total Box */}
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    TOTAL NOMINAL LUNAS
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-900">
                    Rp {Number(receiptData.amount).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[11px] font-black tracking-wider uppercase shadow-xs flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  LUNAS
                </div>
              </div>

              <p className="text-[10px] text-center text-slate-400 font-medium italic pt-2">
                * Resi elektronik ini diterbitkan secara otomatis dan sah sebagai bukti pembayaran resmi SMA Al-Furqon & Pondok Pesantren Al-Furqon Driyorejo.
              </p>
            </div>

            {/* Receipt Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                Cetak Bukti Resi (PDF)
              </button>

              <Link
                href="/parent/payments"
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all hover:scale-102"
              >
                Kembali ke Daftar Tagihan
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If no payment found or already paid
  if (!selectedPayment) {
    return (
      <DashboardLayout allowedRole="parent">
        <div className="max-w-xl mx-auto py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Semua Tagihan Sudah Lunas!</h2>
          <p className="text-xs text-slate-600 mt-2 mb-6">
            Tidak ada kewajiban tagihan SPP atau Anggaran Kegiatan yang belum dibayar saat ini.
          </p>
          <Link
            href="/parent/payments"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Status & Riwayat SPP
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isYayasan = selectedPayment.category === 'SPP' || selectedPayment.destination?.includes('Yayasan');
  const isSantri = Boolean(student?.isSantri ?? student?.is_santri);
  const residence = student?.residenceType || student?.residence_type || 'Non-Asrama';

  // Bank accounts config based on Destination
  const yayasanBankAccounts = [
    {
      id: 'bca',
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '0182993451',
      formattedNumber: '0182 9934 51',
      accountHolder: 'YAYASAN PONDOK PESANTREN AL-FURQON',
      branch: 'KCP Driyorejo Gresik',
      color: 'border-blue-200 bg-blue-50/30 text-blue-900',
      badge: 'BCA Yayasan',
    },
    {
      id: 'bsi',
      bankName: 'Bank Syariah Indonesia (BSI)',
      accountNumber: '7188223456',
      formattedNumber: '7188 2234 56',
      accountHolder: 'YAYASAN PONDOK PESANTREN AL-FURQON',
      branch: 'KCP Gresik Driyorejo',
      color: 'border-emerald-200 bg-emerald-50/30 text-emerald-900',
      badge: 'BSI Syariah',
    },
    {
      id: 'mandiri',
      bankName: 'Bank Mandiri',
      accountNumber: '142001928844',
      formattedNumber: '1420 0192 8844',
      accountHolder: 'YAYASAN PP AL-FURQON',
      branch: 'Mandiri Gresik',
      color: 'border-amber-200 bg-amber-50/30 text-amber-900',
      badge: 'Mandiri Yayasan',
    },
  ];

  const sekolahBankAccounts = [
    {
      id: 'bsi',
      bankName: 'Bank Syariah Indonesia (BSI)',
      accountNumber: '7700998812',
      formattedNumber: '7700 9988 12',
      accountHolder: 'SMA AL-FURQON DRIYOREJO',
      branch: 'KCP Driyorejo',
      color: 'border-emerald-200 bg-emerald-50/30 text-emerald-900',
      badge: 'BSI Sekolah',
    },
    {
      id: 'bca',
      bankName: 'Bank Central Asia (BCA) / Bank Jatim',
      accountNumber: '0321884211',
      formattedNumber: '0321 8842 11',
      accountHolder: 'SMA AL-FURQON DRIYOREJO',
      branch: 'Operasional Sekolah Driyorejo',
      color: 'border-blue-200 bg-blue-50/30 text-blue-900',
      badge: 'BCA Sekolah',
    },
    {
      id: 'mandiri',
      bankName: 'Bank Mandiri Operasional',
      accountNumber: '142000889911',
      formattedNumber: '1420 0088 9911',
      accountHolder: 'SMA AL-FURQON DRIYOREJO',
      branch: 'Gresik Driyorejo',
      color: 'border-amber-200 bg-amber-50/30 text-amber-900',
      badge: 'Mandiri Sekolah',
    },
  ];

  const currentBankAccounts = isYayasan ? yayasanBankAccounts : sekolahBankAccounts;

  // VA Numbers config
  const vaNumbers: Record<string, string> = {
    bca: '88390' + (student?.nis || '102938'),
    mandiri: '89102' + (student?.nis || '102938'),
    bri: '10482' + (student?.nis || '102938'),
    bni: '98812' + (student?.nis || '102938'),
    bsi: '90022' + (student?.nis || '102938'),
  };

  return (
    <DashboardLayout allowedRole="parent">
      <div className="max-w-4xl mx-auto space-y-5 animate-fade-in pb-24 md:pb-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/parent/payments"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-2xl shadow-2xs transition-all w-fit group"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-700 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Riwayat Tagihan SPP
          </Link>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">
                1
              </span>
              Rincian
            </span>
            <span className="text-slate-300">/</span>
            <span className="flex items-center gap-1 text-emerald-700 font-extrabold">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                2
              </span>
              Pembayaran Online
            </span>
            <span className="text-slate-300">/</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black">
                3
              </span>
              Resi Lunas
            </span>
          </div>
        </div>

        {/* Unpaid Bill Selector (if more than 1 unpaid bills exist) */}
        {unpaidPayments.length > 1 && (
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-emerald-100 shadow-2xs">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              Pilih Tagihan yang Ingin Dibayar:
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {unpaidPayments.map((p) => {
                const isSelected = p.id === selectedPayment.id;
                const pIsYayasan = p.category === 'SPP' || p.destination?.includes('Yayasan');
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPayment(p)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 border transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50/60'
                    }`}
                  >
                    {pIsYayasan ? <Building2 className="w-3.5 h-3.5" /> : <School className="w-3.5 h-3.5" />}
                    <span>{p.title || (p.category === 'Kegiatan' ? 'Kegiatan' : 'SPP')}</span>
                    <span className="font-mono text-[11px] opacity-90">
                      (Rp {p.amount.toLocaleString('id-ID')})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CARD 1: INVOICE & DESTINATION BANNER (MATERIAL DASHBOARD STYLE) */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
          {/* Card Top Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    INVOICE PEMBAYARAN RESMI
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                    {selectedPayment.title || (selectedPayment.category === 'Kegiatan' ? 'Anggaran Kegiatan Sekolah' : 'SPP Bulanan Siswa')}
                  </h1>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Periode: {selectedPayment.semester} {selectedPayment.academic_year || selectedPayment.academicYear || '2024/2025'}
                  </p>
                </div>
              </div>

              {/* Amount Display */}
              <div className="sm:text-right bg-white/10 p-3 sm:p-0 rounded-2xl border border-white/10 sm:border-0 sm:bg-transparent">
                <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">
                  Total Tagihan Wajib:
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Rp {selectedPayment.amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Student & Destination Breakdown */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* Student Info Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {student?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{student?.name || 'Siswa Al-Furqon'}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5 font-mono">
                    NIS: {student?.nis || '-'} • Kelas {student?.class || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge variant={isSantri ? 'success' : 'slate'}>
                  {isSantri ? 'Santri Pondok' : 'Non-Santri'}
                </Badge>
                <Badge variant={residence === 'Asrama' ? 'purple' : 'info'}>
                  {residence}
                </Badge>
              </div>
            </div>

            {/* CRITICAL USER REQUIREMENT: SALURAN DANA YAYASAN vs SEKOLAH */}
            {isYayasan ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-50/50 to-amber-500/10 border-2 border-amber-300/80 flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-800 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-200/90 px-2.5 py-0.5 rounded-full">
                      Tujuan Penyaluran: Yayasan Pondok Pesantren Al-Furqon
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Rekening Kas Pondok Pesantren Al-Furqon
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Setoran SPP ini disalurkan langsung ke rekening resmi Yayasan Pondok Pesantren Al-Furqon untuk operasional santri & asrama.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-50/50 to-emerald-500/10 border-2 border-emerald-300/80 flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-800 shrink-0">
                  <School className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900 bg-emerald-200/90 px-2.5 py-0.5 rounded-full">
                      Tujuan Penyaluran: Sekolah (SMA Al-Furqon)
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Rekening Kas Operasional SMA Al-Furqon
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Setoran ini disalurkan ke rekening resmi SMA Al-Furqon Driyorejo untuk kegiatan akademik, praktikum, dan sarana belajar.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: PAYMENT METHOD SWITCHER (MATERIAL TABS) */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-5 sm:p-6 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Pilih Metode Pembayaran Online
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tersedia QRIS instan untuk mobile banking/e-wallet, transfer rekening resmi, dan Virtual Account.
            </p>
          </div>

          {/* Segmented Control / Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
            {/* Tab 1: QRIS */}
            <button
              type="button"
              onClick={() => setChannel('qris')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-bold transition-all ${
                channel === 'qris'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-white/60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS Instant</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${
                channel === 'qris' ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Auto
              </span>
            </button>

            {/* Tab 2: Transfer Bank Resmi */}
            <button
              type="button"
              onClick={() => setChannel('transfer')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-bold transition-all ${
                channel === 'transfer'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-white/60'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Transfer Bank</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${
                channel === 'transfer' ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-amber-800'
              }`}>
                {isYayasan ? 'Yayasan' : 'Sekolah'}
              </span>
            </button>

            {/* Tab 3: Virtual Account */}
            <button
              type="button"
              onClick={() => setChannel('va')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-bold transition-all ${
                channel === 'va'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-white/60'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Virtual Account</span>
            </button>
          </div>

          {/* TAB 1: QRIS INSTANT PAY */}
          {channel === 'qris' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-3xl bg-gradient-to-b from-emerald-50/60 to-white border-2 border-emerald-200 text-center space-y-4">
                {/* Official QRIS Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 max-w-sm mx-auto pb-3 border-b border-emerald-200/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black tracking-widest text-white bg-rose-600 px-2 py-0.5 rounded-md shadow-2xs">
                      QRIS
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Standar Nasional BI
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Sisa: {formatTimer(timeLeft)}</span>
                  </div>
                </div>

                {/* QR Code Container with Frame */}
                <div className="relative inline-block p-4 bg-white rounded-3xl border-2 border-emerald-300 shadow-md">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QRIS Al-Furqon"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto rounded-xl"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                      <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Merchant Label inside QR card */}
                  <div className="mt-2 text-center">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                      {isYayasan ? 'YAYASAN PP AL-FURQON' : 'SMA AL-FURQON DRIYOREJO'}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">NMID: ID1029384756182</p>
                  </div>
                </div>

                {/* QR Download & Action */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Unduh / Simpan Gambar QR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedPayment.amount.toString(), 'amount')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'amount' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        Nominal Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Salin Nominal (Rp {selectedPayment.amount.toLocaleString('id-ID')})
                      </>
                    )}
                  </button>
                </div>

                {/* Supported Apps Badges */}
                <div className="pt-3 border-t border-emerald-100">
                  <p className="text-[11px] text-slate-500 font-medium mb-2">
                    Dapat dipindai dari semua aplikasi m-Banking & e-Wallet:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-extrabold text-slate-600">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">BCA Mobile</span>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">Livin Mandiri</span>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">BRImo</span>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">BSI Mobile</span>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">GoPay</span>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">OVO</span>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">DANA</span>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">ShopeePay</span>
                  </div>
                </div>

                {/* Steps Accordion / Instructions */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-left space-y-2 text-xs">
                  <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-700" />
                    Cara Pembayaran via QRIS di Smartphone / Mobile:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11px] pl-1 leading-relaxed">
                    <li>Buka aplikasi m-Banking (BCA/Mandiri/BRI/BSI) atau e-Wallet (GoPay/DANA/OVO/ShopeePay) Anda.</li>
                    <li>Pilih menu <strong>Scan / Bayar QRIS</strong>.</li>
                    <li>Arahkan kamera ke QR Code di atas, atau klik <strong>&quot;Unduh QR&quot;</strong> lalu unggah gambar QR dari Galeri HP Anda.</li>
                    <li>Pastikan nama merchant tertera <strong>{isYayasan ? 'Yayasan PP Al-Furqon' : 'SMA Al-Furqon'}</strong> dengan nominal <strong>Rp {selectedPayment.amount.toLocaleString('id-ID')}</strong>.</li>
                    <li>Masukkan PIN Anda untuk menyelesaikan pembayaran.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSFER BANK LANGSUNG (REKENING YAYASAN vs REKENING SEKOLAH) */}
          {channel === 'transfer' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Rekening Resmi Penyaluran Dana: {isYayasan ? 'Yayasan Pondok Pesantren Al-Furqon' : 'Sekolah (SMA Al-Furqon)'}
                  </p>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    Silakan transfer tepat sebesar <strong className="text-emerald-800">Rp {selectedPayment.amount.toLocaleString('id-ID')}</strong> ke salah satu rekening resmi di bawah ini.
                  </p>
                </div>
              </div>

              {/* List of Bank Accounts */}
              <div className="space-y-3">
                {currentBankAccounts.map((bank) => (
                  <div
                    key={bank.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{bank.bankName}</span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {bank.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg sm:text-xl font-black tracking-wider text-emerald-800">
                          {bank.formattedNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Atas Nama: <strong className="text-slate-800">{bank.accountHolder}</strong> ({bank.branch})
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(bank.accountNumber, bank.id)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                          copiedKey === bank.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {copiedKey === bank.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Nomor Tersalin
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Salin No. Rekening
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Important Instructions Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Petunjuk Pengiriman Transfer Bank Langsung:
                </h5>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
                  <li>Gunakan ATM, Mobile Banking, atau Internet Banking dari bank mana pun.</li>
                  <li>Masukkan nomor rekening resmi di atas sesuai bank pilihan Anda.</li>
                  <li>Sertakan berita transfer: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-mono font-bold">{student?.nis || 'NIS'}-{selectedPayment.id}</code> (agar verifikasi otomatis lebih cepat).</li>
                  <li>Setelah transfer berhasil, klik tombol <strong>&quot;Konfirmasi Pembayaran Online&quot;</strong> di bawah untuk langsung menerbitkan Bukti Resi Lunas.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: VIRTUAL ACCOUNT (VA) */}
          {channel === 'va' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Pilih Bank Virtual Account:
                </label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {(['bca', 'mandiri', 'bri', 'bni', 'bsi'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setVaBank(b)}
                      className={`py-2.5 px-1 rounded-xl text-xs font-black uppercase border transition-all text-center ${
                        vaBank === b
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs scale-[1.02]'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* VA Detail Display */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <span className="text-xs text-slate-600 font-medium">
                  Nomor Virtual Account <strong className="uppercase text-emerald-900">Bank {vaBank}</strong>:
                </span>
                <div className="p-3.5 bg-white border border-emerald-300 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="font-mono text-lg sm:text-xl font-black tracking-widest text-slate-900">
                    {vaNumbers[vaBank]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(vaNumbers[vaBank], 'va')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'va' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin VA
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  * Gunakan menu Virtual Account di m-Banking atau ATM Bank {vaBank.toUpperCase()}. Tagihan akan muncul otomatis sebesar <strong>Rp {selectedPayment.amount.toLocaleString('id-ID')}</strong> tanpa perlu input nominal manual.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR (STICKY IN MOBILE VIEWPORT) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-200 p-4 md:static md:bg-transparent md:border-0 md:p-0 shadow-lg md:shadow-none">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="hidden sm:block">
              <span className="text-xs text-slate-500 font-semibold block">Total yang Harus Dibayar:</span>
              <span className="text-2xl font-black text-emerald-800">
                Rp {selectedPayment.amount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3">
              <div className="sm:hidden">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Bayar:</span>
                <span className="text-lg font-black text-emerald-800">
                  Rp {selectedPayment.amount.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmPayment}
                className="flex-1 sm:flex-initial py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses Verifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Konfirmasi Pembayaran Online</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ParentPaymentPayPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout allowedRole="parent">
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-700 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Memuat halaman pembayaran...</p>
          </div>
        </DashboardLayout>
      }
    >
      <PaymentCheckoutContent />
    </Suspense>
  );
}
