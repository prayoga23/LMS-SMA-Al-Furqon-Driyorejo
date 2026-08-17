'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { Wallet, ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';

interface AllowanceTransaction {
  id: number;
  date: string;
  income: number;
  expense: number;
  description: string;
}

export default function ParentAllowancePage() {
  const [balance, setBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [transactions, setTransactions] = useState<AllowanceTransaction[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllowance();
  }, []);

  const fetchAllowance = async () => {
    try {
      setLoading(true);
      const resStudent = await api.get('/student');
      const studentId = resStudent.data.student.id;
      setStudent(resStudent.data.student);

      const resAllow = await api.get(`/allowance/student/${studentId}`);
      setBalance(resAllow.data.balance);
      setTotalIncome(resAllow.data.total_income);
      setTotalExpense(resAllow.data.total_expense);
      setTransactions(resAllow.data.transactions);
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
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat mutasi uang saku...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRole="parent">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Catatan Uang Saku Siswa</h2>
          <p className="text-sm text-slate-600">
            Monitoring saldo dompet digital & riwayat transaksi {student?.name} ({student?.class})
          </p>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="glass-card rounded-2xl p-6 border border-emerald-200 bg-emerald-50/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">SALDO SAAT INI</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">
                  Rp {balance.toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-700">
                <Wallet className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Income Card */}
          <div className="glass-card rounded-2xl p-6 border border-emerald-100 bg-emerald-50/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">TOTAL PEMASUKAN</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-2">
                  + Rp {totalIncome.toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-700">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Expense Card */}
          <div className="glass-card rounded-2xl p-6 border border-rose-100 bg-rose-50/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">TOTAL PENGELUARAN</p>
                <h3 className="text-2xl font-bold text-rose-700 mt-2">
                  - Rp {totalExpense.toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-100 text-rose-700">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="glass-card rounded-2xl border border-emerald-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-700" />
              Riwayat Mutasi Uang Saku
            </h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-600 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Jenis Transaksi</th>
                  <th className="py-3 px-4">Jumlah (Rp)</th>
                  <th className="py-3 px-4">Keterangan / Deskripsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-500">
                      Belum ada catatan mutasi uang saku.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const isIncome = Number(t.income) > 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-600">{t.date}</td>
                        <td className="py-3.5 px-4">
                          {isIncome ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              <ArrowDownRight className="w-3.5 h-3.5" /> Pemasukan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Pengeluaran
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-sm">
                          {isIncome ? (
                            <span className="text-emerald-700">+ Rp {Number(t.income).toLocaleString('id-ID')}</span>
                          ) : (
                            <span className="text-rose-700">- Rp {Number(t.expense).toLocaleString('id-ID')}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-900 font-medium">{t.description}</td>
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
