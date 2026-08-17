'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { CreditCard, CheckCircle2, AlertCircle, Calendar, ShieldAlert } from 'lucide-react';

interface Payment {
  id: number;
  semester: string;
  academic_year: string;
  amount: number;
  status: 'Lunas' | 'Belum Lunas';
  created_at: string;
}

export default function ParentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [student, setStudent] = useState<any>(null);
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
          Memuat data SPP...
        </div>
      </DashboardLayout>
    );
  }

  const sem1 = payments.find((p) => p.semester === 'Semester 1');
  const sem2 = payments.find((p) => p.semester === 'Semester 2');

  return (
    <DashboardLayout allowedRole="parent">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Status & Riwayat SPP Siswa</h2>
          <p className="text-sm text-slate-600">
            Rincian kewajiban SPP per semester untuk {student?.name} ({student?.class})
          </p>
        </div>

        {/* Semester 1 & 2 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Semester 1 */}
          <div className={`glass-card rounded-2xl p-6 border ${sem1?.status === 'Lunas' ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'} flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  SEMESTER 1
                </span>
                <Badge variant={sem1?.status === 'Lunas' ? 'success' : 'danger'}>
                  {sem1?.status || 'Belum Lunas'}
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Rp {sem1 ? Number(sem1.amount).toLocaleString('id-ID') : '500.000'}
              </h3>
              <p className="text-xs text-slate-600">Tahun Akademik: {sem1?.academic_year || '2024/2025'}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600">Status Pembayaran:</span>
              <span className={`font-semibold ${sem1?.status === 'Lunas' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {sem1?.status === 'Lunas' ? 'LUNAS (Lulus Tagihan)' : 'BELUM DIBAYAR'}
              </span>
            </div>
          </div>

          {/* Card Semester 2 */}
          <div className={`glass-card rounded-2xl p-6 border ${sem2?.status === 'Lunas' ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'} flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  SEMESTER 2
                </span>
                <Badge variant={sem2?.status === 'Lunas' ? 'success' : 'danger'}>
                  {sem2?.status || 'Belum Lunas'}
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Rp {sem2 ? Number(sem2.amount).toLocaleString('id-ID') : '500.000'}
              </h3>
              <p className="text-xs text-slate-600">Tahun Akademik: {sem2?.academic_year || '2024/2025'}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600">Status Pembayaran:</span>
              <span className={`font-semibold ${sem2?.status === 'Lunas' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {sem2?.status === 'Lunas' ? 'LUNAS (Lulus Tagihan)' : 'BELUM DIBAYAR'}
              </span>
            </div>
          </div>
        </div>

        {/* Total Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600">Total Pembayaran Lunas</p>
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
              <p className="text-xs font-semibold text-slate-600">Sisa Tagihan Belum Lunas</p>
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
        <div className="glass-card rounded-2xl border border-emerald-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              Tabel Riwayat Pembayaran SPP
            </h3>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-600 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Tahun Akademik</th>
                  <th className="py-3 px-4">Jumlah Pembayaran</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-500">
                      Belum ada data riwayat pembayaran SPP.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{p.semester}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.academic_year}</td>
                      <td className="py-3.5 px-4 font-bold text-amber-700">
                        Rp {Number(p.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={p.status === 'Lunas' ? 'success' : 'danger'}>
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
