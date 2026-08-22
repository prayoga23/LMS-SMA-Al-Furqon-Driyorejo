'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { CreditCard, CheckCircle2, AlertCircle, Building2, School, Sparkles } from 'lucide-react';

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

  if (loading) {
    return (
      <DashboardLayout allowedRole="parent">
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat data tagihan & pembayaran...
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
      <div className="space-y-6 animate-fade-in">
        {/* Header & Profil Siswa */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Status & Riwayat Tagihan SPP</h2>
            <p className="text-xs text-slate-600 mt-1">
              Informasi kewajiban pembayaran SPP & Anggaran Kegiatan untuk <strong className="text-slate-900">{student?.name}</strong> ({student?.class})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isSantri ? 'success' : 'slate'}>
              {isSantri ? 'Santri Pondok' : 'Non-Santri'}
            </Badge>
            <Badge variant={residence === 'Asrama' ? 'purple' : 'info'}>
              {residence}
            </Badge>
            {hasDiscount && (
              <span title={discountNotes || 'Tarif Khusus Keringanan'}>
                <Badge variant="warning">
                  Keringanan Biaya
                </Badge>
              </span>
            )}
          </div>
        </div>

        {/* Notice Jika Ada Keringanan Biaya */}
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
          <div className="glass-card rounded-2xl p-6 border border-amber-200 bg-amber-50/30 flex flex-col justify-between">
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

            <div className="mt-6 pt-4 border-t border-amber-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600">Sisa Tagihan Belum Lunas:</span>
              <span className="font-bold text-rose-700">
                Rp {Number(breakdown?.yayasan?.unpaid || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Card 2: Anggaran Kegiatan Sekolah */}
          <div className="glass-card rounded-2xl p-6 border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between">
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

            <div className="mt-6 pt-4 border-t border-emerald-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600">Sisa Tagihan Belum Lunas:</span>
              <span className="font-bold text-rose-700">
                Rp {Number(breakdown?.sekolah?.unpaid || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Total Accumulation Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600">Total Akumulasi Pembayaran Lunas</p>
              <h4 className="text-2xl font-extrabold text-emerald-700 mt-1">
                Rp {totalPaid.toLocaleString('id-ID')}
              </h4>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-rose-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600">Sisa Total Tagihan Belum Lunas</p>
              <h4 className="text-2xl font-extrabold text-rose-700 mt-1">
                Rp {totalUnpaid.toLocaleString('id-ID')}
              </h4>
            </div>
            <div className="p-3 rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="glass-card rounded-2xl border border-amber-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              Tabel Riwayat & Rincian Saluran Pembayaran
            </h3>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-500">
                      Belum ada data riwayat pembayaran.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const isYayasan = p.category === 'SPP' || p.destination?.includes('Yayasan');

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
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
                        <td className="py-3.5 px-4 font-bold text-amber-900">
                          Rp {Number(p.amount).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={p.status === 'Lunas' ? 'success' : 'danger'}>
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
