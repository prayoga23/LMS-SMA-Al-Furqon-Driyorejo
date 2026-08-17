'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { CalendarCheck, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface AttendanceSummary {
  total_hadir: number;
  total_sakit: number;
  total_izin: number;
  total_alpha: number;
  total_records: number;
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
}

export default function ParentAttendancePage() {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const resStudent = await api.get('/student');
      const studentId = resStudent.data.student.id;
      setStudent(resStudent.data.student);

      const resAtt = await api.get(`/attendance/student/${studentId}`);
      setSummary(resAtt.data.summary);
      setRecords(resAtt.data.records);
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
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat catatan presensi...
        </div>
      </DashboardLayout>
    );
  }

  const chartData = [
    { name: 'Hadir', count: summary?.total_hadir || 0, fill: '#10b981' },
    { name: 'Sakit', count: summary?.total_sakit || 0, fill: '#f59e0b' },
    { name: 'Izin', count: summary?.total_izin || 0, fill: '#3b82f6' },
    { name: 'Alpha', count: summary?.total_alpha || 0, fill: '#ef4444' },
  ];

  return (
    <DashboardLayout allowedRole="parent">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Presensi Kehadiran Siswa</h2>
          <p className="text-sm text-slate-600">
            Rekapitulasi dan riwayat kehadiran harian untuk {student?.name} ({student?.class})
          </p>
        </div>

        {/* 4 Cards Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-emerald-100 bg-emerald-50/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Total Hadir</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{summary?.total_hadir || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Hari sekolah</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-amber-100 bg-amber-50/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Total Sakit</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{summary?.total_sakit || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Hari ijin sakit</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-sky-100 bg-sky-50/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Total Izin</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{summary?.total_izin || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Hari izin keperluan</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-rose-100 bg-rose-50/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Total Alpha</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{summary?.total_alpha || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Tanpa keterangan</p>
          </div>
        </div>

        {/* Grafik Kehadiran */}
        <div className="glass-card rounded-2xl p-6 border border-emerald-100">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-sky-600" />
            Grafik Distribusi Kehadiran
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Riwayat Kalender Absensi Table */}
        <div className="glass-card rounded-2xl border border-emerald-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              Log Riwayat Absensi Harian
            </h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-600 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tanggal Presensi</th>
                  <th className="py-3 px-4">Status Kehadiran</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-500">
                      Belum ada log presensi tercatat.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{r.date}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            r.status === 'Hadir'
                              ? 'success'
                              : r.status === 'Sakit'
                              ? 'warning'
                              : r.status === 'Izin'
                              ? 'info'
                              : 'danger'
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {r.status === 'Hadir'
                          ? 'Tercatat masuk kelas tepat waktu'
                          : r.status === 'Sakit'
                          ? 'Surat izin sakit dikonfirmasi'
                          : r.status === 'Izin'
                          ? 'Izin keperluan keluarga'
                          : 'Tidak ada keterangan'}
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
