'use client';

import React, { useEffect, useState } from 'react';
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
  QrCode,
  Landmark,
  ArrowRight,
  Copy,
  Check,
  X,
  Printer,
  ShieldCheck,
  Wallet,
  FileText,
  Clock,
  ChevronRight,
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [loading, setLoading] = useState(true);

  // Online Payment Modal States
  const [payModalPayment, setPayModalPayment] = useState<Payment | null>(null);
  const [paymentChannel, setPaymentChannel] = useState<'qris' | 'va' | 'transfer'>('qris');
  const [selectedBank, setSelectedBank] = useState<'bca' | 'mandiri' | 'bri' | 'bni'>('bca');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<any | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const resStudent = await api.get('/student');
      const studentId = resStudent.data.student.id;
      setStudent(resStudent.data.student);

      const resPayment = await api.get(`/payment/student/${studentId}`);
      setPayments(resPayment.data.payments);
      setTotalPaid(resPayment.data.total_paid);
      setTotalUnpaid(resPayment.data.total_unpaid);
      setBreakdown(resPayment.data.breakdown);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayModal = (payment: Payment) => {
    setPayModalPayment(payment);
    setPaymentChannel('qris');
    setSelectedBank('bca');
  };

  const handlePayFirstUnpaid = (category?: 'SPP' | 'Kegiatan') => {
    let target = payments.find((p) => p.status === 'Belum Lunas' && (!category || p.category === category));
    if (!target) {
      target = payments.find((p) => p.status === 'Belum Lunas');
    }
    if (target) {
      handleOpenPayModal(target);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleConfirmOnlinePayment = async () => {
    if (!payModalPayment) return;

    setIsSubmittingPay(true);
    try {
      let channelLabel = 'QRIS Instant';
      let bankLabel = '';
      if (paymentChannel === 'qris') {
        channelLabel = 'QRIS / e-Wallet (GoPay/OVO/DANA)';
      } else if (paymentChannel === 'va') {
        channelLabel = 'Virtual Account';
        bankLabel = selectedBank.toUpperCase();
      } else {
        channelLabel = 'Transfer Bank Direct';
        bankLabel = 'BSI / BCA Yayasan';
      }

      const res = await api.post(`/payments/${payModalPayment.id}/pay`, {
        paymentMethod: channelLabel,
        bankName: bankLabel,
      });

      // Close Pay Modal & Open Receipt Modal
      setPayModalPayment(null);
      setReceiptData(res.data.receipt);

      // Refresh payment list & breakdown
      await fetchPayments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses pembayaran online. Coba lagi.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleViewReceipt = (payment: Payment) => {
    const isYayasan = payment.category === 'SPP' || payment.destination?.includes('Yayasan');
    setReceiptData({
      transaction_id: `PAY-${Date.parse(payment.createdAt || new Date().toISOString())}-${payment.id}`,
      date: payment.createdAt ? new Date(payment.createdAt).toLocaleString('id-ID') : new Date().toLocaleString('id-ID'),
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
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat data tagihan & sistem pembayaran online...
        </div>
      </DashboardLayout>
    );
  }

  const isSantri = Boolean(student?.isSantri ?? student?.is_santri);
  const residence = student?.residenceType || student?.residence_type || 'Non-Asrama';
  const hasDiscount = Boolean(student?.hasDiscount ?? student?.has_discount);
  const discountNotes = student?.discountNotes || student?.discount_notes;

  const vaNumbers = {
    bca: '88390' + (student?.nis || '123456'),
    mandiri: '89102' + (student?.nis || '123456'),
    bri: '10482' + (student?.nis || '123456'),
    bni: '98812' + (student?.nis || '123456'),
  };

  return (
    <DashboardLayout allowedRole="parent">
      <div className="space-y-6 animate-fade-in">
        {/* Header & Profil Siswa + Quick Pay Header Action */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Portal Pembayaran Online
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Status & Riwayat Tagihan SPP</h2>
            <p className="text-xs text-slate-600 mt-1">
              Informasi kewajiban pembayaran SPP & Anggaran Kegiatan untuk <strong className="text-slate-900">{student?.name}</strong> ({student?.class})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {totalUnpaid > 0 && (
              <button
                onClick={() => handlePayFirstUnpaid()}
                className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                Bayar Tagihan Online (Rp {totalUnpaid.toLocaleString('id-ID')})
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-1.5">
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
        </div>

        {/* Notice Keringanan Biaya */}
        {hasDiscount && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Tarif Pembayaran Tersendiri / Keringanan Biaya</p>
              <p className="text-[11px] text-amber-900 mt-0.5">
                Siswa telah mendapatkan persetujuan keringanan tarif: <span className="font-semibold">{discountNotes || 'Persetujuan Keringanan Biaya Yayasan/Sekolah'}</span>.
              </p>
            </div>
          </div>
        )}

        {/* Saluran Dana Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: SPP Yayasan */}
          <div className="glass-card rounded-3xl p-6 border border-amber-200 bg-amber-50/30 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Saluran SPP Siswa
                </span>
                <Badge variant={breakdown?.yayasan?.unpaid === 0 ? 'success' : 'danger'}>
                  {breakdown?.yayasan?.unpaid === 0 ? 'LUNAS' : 'ADA TAGIHAN'}
                </Badge>
              </div>

              <p className="text-[11px] font-medium text-slate-500 mb-1">
                Tujuan Penyaluran: <strong className="text-amber-900">Yayasan Pondok Pesantren Al-Furqon</strong>
              </p>
              <h3 className="text-2xl font-black text-amber-950">
                Rp {Number(breakdown?.yayasan?.paid || 0).toLocaleString('id-ID')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Total Setoran SPP yang Sudah Terbayar</p>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-600">Sisa Tagihan: </span>
                <span className="font-bold text-rose-700">
                  Rp {Number(breakdown?.yayasan?.unpaid || 0).toLocaleString('id-ID')}
                </span>
              </div>
              {Number(breakdown?.yayasan?.unpaid || 0) > 0 && (
                <button
                  onClick={() => handlePayFirstUnpaid('SPP')}
                  className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-102 active:scale-95"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Bayar SPP Sekarang
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Anggaran Kegiatan Sekolah */}
          <div className="glass-card rounded-3xl p-6 border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-emerald-600" />
                  Saluran Anggaran Kegiatan
                </span>
                <Badge variant={breakdown?.sekolah?.unpaid === 0 ? 'success' : 'danger'}>
                  {breakdown?.sekolah?.unpaid === 0 ? 'LUNAS' : 'ADA TAGIHAN'}
                </Badge>
              </div>

              <p className="text-[11px] font-medium text-slate-500 mb-1">
                Tujuan Penyaluran: <strong className="text-emerald-900">Sekolah (SMA Al-Furqon)</strong>
              </p>
              <h3 className="text-2xl font-black text-emerald-950">
                Rp {Number(breakdown?.sekolah?.paid || 0).toLocaleString('id-ID')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Total Setoran Kegiatan yang Sudah Terbayar</p>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-600">Sisa Tagihan: </span>
                <span className="font-bold text-rose-700">
                  Rp {Number(breakdown?.sekolah?.unpaid || 0).toLocaleString('id-ID')}
                </span>
              </div>
              {Number(breakdown?.sekolah?.unpaid || 0) > 0 && (
                <button
                  onClick={() => handlePayFirstUnpaid('Kegiatan')}
                  className="py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-102 active:scale-95"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Bayar Kegiatan Sekarang
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Total Accumulation Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card rounded-3xl p-5 border border-emerald-100 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs font-semibold text-slate-600">Total Akumulasi Pembayaran Lunas</p>
              <h4 className="text-2xl font-extrabold text-emerald-700 mt-1">
                Rp {totalPaid.toLocaleString('id-ID')}
              </h4>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-700 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5 border border-rose-100 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs font-semibold text-slate-600">Sisa Total Tagihan Belum Lunas</p>
              <h4 className="text-2xl font-extrabold text-rose-700 mt-1">
                Rp {totalUnpaid.toLocaleString('id-ID')}
              </h4>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-100 text-rose-700 shadow-2xs">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Responsive Table with Direct Pay Action */}
        <div className="glass-card rounded-3xl border border-amber-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              Tabel Riwayat & Rincian Saluran Pembayaran
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Klik &quot;Bayar Sekarang&quot; untuk melakukan pembayaran online
            </span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-600 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Jenis Tagihan</th>
                  <th className="py-3.5 px-4">Saluran Dana Penerima</th>
                  <th className="py-3.5 px-4">Semester</th>
                  <th className="py-3.5 px-4">Jumlah Pembayaran</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi Pembayaran</th>
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
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {p.semester}
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {p.academic_year || p.academicYear || '2024/2025'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-amber-950 text-sm">
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
                              onClick={() => handleOpenPayModal(p)}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-sm shadow-emerald-700/20 flex items-center justify-center gap-1.5 mx-auto transition-all hover:scale-105 active:scale-95"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Bayar Sekarang
                            </button>
                          ) : (
                            <button
                              onClick={() => handleViewReceipt(p)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1 mx-auto transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600" />
                              Lihat Resi
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

        {/* MODAL 1: PEMBAYARAN ONLINE (PAYMENT GATEWAY MODAL) */}
        {payModalPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/65 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-emerald-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight">Pembayaran Online SPP & Kegiatan</h3>
                    <p className="text-[11px] text-emerald-200 font-medium">SMA AL - FURQON DRIYOREJO</p>
                  </div>
                </div>
                <button
                  onClick={() => setPayModalPayment(null)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
                {/* Rincian Tagihan Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Tagihan Untuk:</span>
                    <strong className="text-slate-900">{student?.name} ({student?.nis})</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Jenis Pembayaran:</span>
                    <strong className="text-slate-900">
                      {payModalPayment.title || (payModalPayment.category === 'Kegiatan' ? 'Anggaran Kegiatan' : 'SPP Bulanan')} ({payModalPayment.semester})
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Saluran Dana:</span>
                    <strong className="text-emerald-800 font-bold">
                      {payModalPayment.destination || (payModalPayment.category === 'Kegiatan' ? 'Sekolah (SMA Al-Furqon)' : 'Yayasan Pondok Pesantren Al-Furqon')}
                    </strong>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-slate-700">Total Nominal Pembayaran:</span>
                    <span className="text-xl font-black text-emerald-700">
                      Rp {Number(payModalPayment.amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Switcher Metode Pembayaran */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Pilih Metode Pembayaran Online:
                  </label>

                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('qris')}
                      className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                        paymentChannel === 'qris'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      <QrCode className="w-4 h-4 mb-1" />
                      QRIS / e-Wallet
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentChannel('va')}
                      className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                        paymentChannel === 'va'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mb-1" />
                      Virtual Account
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentChannel('transfer')}
                      className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                        paymentChannel === 'transfer'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      <Landmark className="w-4 h-4 mb-1" />
                      Transfer Bank
                    </button>
                  </div>
                </div>

                {/* CONTENT METHOD 1: QRIS */}
                {paymentChannel === 'qris' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-200 px-2.5 py-0.5 rounded-full">
                        QRIS RESMI NASIONAL
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Berlaku 15 Menit
                      </span>
                    </div>

                    {/* QR Code Container Simulation */}
                    <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-2 border-emerald-300 shadow-md flex flex-col items-center justify-center relative">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ALFURQON-${payModalPayment.id}-${payModalPayment.amount}`}
                        alt="QRIS Code Pembayaran"
                        className="w-full h-full object-contain"
                      />
                      <span className="text-[9px] font-black text-slate-400 mt-1 uppercase">QRIS AL-FURQON</span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      Buka aplikasi <strong>GoPay, OVO, DANA, ShopeePay, BCA Mobile, atau M-Banking</strong> Anda, lalu scan kode QRIS di atas untuk membayar <strong className="text-emerald-800">Rp {Number(payModalPayment.amount).toLocaleString('id-ID')}</strong>.
                    </p>
                  </div>
                )}

                {/* CONTENT METHOD 2: VIRTUAL ACCOUNT */}
                {paymentChannel === 'va' && (
                  <div className="space-y-3">
                    {/* Bank Switcher */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['bca', 'mandiri', 'bri', 'bni'] as const).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`py-2 px-1 rounded-xl text-xs font-black uppercase border transition-all ${
                            selectedBank === b
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          Bank {b}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                      <p className="text-xs text-slate-600 font-medium">
                        Nomor Virtual Account <strong className="uppercase">Bank {selectedBank}</strong>:
                      </p>
                      <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between shadow-2xs">
                        <span className="font-mono text-base sm:text-lg font-black tracking-wider text-slate-900">
                          {vaNumbers[selectedBank]}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(vaNumbers[selectedBank])}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          {copiedText === vaNumbers[selectedBank] ? (
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
                        * Gunakan menu Virtual Account di m-Banking atau ATM Bank {selectedBank.toUpperCase()}. Nominal akan terdeteksi otomatis sesuai invoice tagihan.
                      </p>
                    </div>
                  </div>
                )}

                {/* CONTENT METHOD 3: DIRECT TRANSFER */}
                {paymentChannel === 'transfer' && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                    <p className="text-xs text-slate-700 font-bold">
                      Rekening Resmi Penyaluran Dana:
                    </p>
                    {payModalPayment.category === 'Kegiatan' || payModalPayment.destination?.includes('Sekolah') ? (
                      <div className="p-3 bg-white border border-emerald-300 rounded-xl space-y-1 shadow-2xs">
                        <p className="text-xs font-bold text-emerald-900">Bank Syariah Indonesia (BSI) - Rekening Sekolah</p>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-black text-slate-900">7700 9988 12</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('7700998812')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px] flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Salin
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">a.n. SMA AL-FURQON DRIYOREJO</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-amber-300 rounded-xl space-y-1 shadow-2xs">
                        <p className="text-xs font-bold text-amber-900">Bank Central Asia (BCA) - Rekening Yayasan</p>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-black text-slate-900">0182 9934 51</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('0182993451')}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md font-bold text-[11px] flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Salin
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">a.n. YAYASAN PONDOK PESANTREN AL-FURQON</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer / Action Button */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPayModalPayment(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={isSubmittingPay}
                  onClick={handleConfirmOnlinePayment}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/25 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmittingPay ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Konfirmasi Pembayaran Online
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: BUKTI RESI SETORAN LUNAS (RECEIPT MODAL) */}
        {receiptData && (
          <div className="fixed inset-0 z-50 bg-slate-900/65 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Receipt Header */}
              <div className="p-5 bg-emerald-800 text-white text-center relative">
                <button
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
