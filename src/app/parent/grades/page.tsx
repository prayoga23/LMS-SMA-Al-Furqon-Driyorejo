'use client';

import React, { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { BookOpen, Download, Award, TrendingUp, Printer } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface GradeRecord {
  id: number;
  subject: string;
  semester: string;
  score: number;
  predicate: string;
}

export default function ParentGradesPage() {
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [average, setAverage] = useState(0);
  const [semesterFilter, setSemesterFilter] = useState('Semester 1');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGrades();
  }, [semesterFilter]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const resStudent = await api.get('/student');
      const studentId = resStudent.data.student.id;
      setStudent(resStudent.data.student);

      const resGrades = await api.get(`/grades/student/${studentId}`, {
        params: { semester: semesterFilter },
      });
      setGrades(resGrades.data.grades);
      setAverage(resGrades.data.average);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setDownloading(true);
    try {
      const element = pdfRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Rapor_${student?.name?.replace(/\s+/g, '_')}_${semesterFilter}.pdf`);
    } catch (err) {
      console.error('PDF export error', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRole="parent">
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat nilai rapor...
        </div>
      </DashboardLayout>
    );
  }

  const chartData = grades.map((g) => ({
    subject: g.subject.length > 15 ? g.subject.substring(0, 15) + '...' : g.subject,
    score: g.score,
  }));

  return (
    <DashboardLayout allowedRole="parent">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Rapor Hasil Belajar Siswa</h2>
            <p className="text-sm text-slate-600">
              Transkrip nilai mata pelajaran & predikat {student?.name} ({student?.class})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 shadow-xs"
            >
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </select>

            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Mengunduh...' : 'Download PDF Rapor'}
            </button>
          </div>
        </div>

        {/* Printable Area Container */}
        <div ref={pdfRef} className="p-4 rounded-3xl space-y-6">
          {/* Rapor Header Card */}
          <div className="glass-card rounded-2xl p-6 border border-purple-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                TRANSKRIP AKADEMIK RESMI
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{student?.name}</h3>
              <p className="text-xs text-slate-600">
                NIS: <span className="font-mono text-purple-700 font-bold">{student?.nis}</span> • Kelas:{' '}
                <span className="text-slate-900 font-semibold">{student?.class}</span> • {semesterFilter} (2024/2025)
              </p>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-purple-50 border border-purple-200 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">RATA-RATA NILAI</span>
              <span className="text-3xl font-black text-purple-900">{average}</span>
            </div>
          </div>

          {/* Chart Perkembangan Nilai */}
          <div className="glass-card rounded-2xl p-6 border border-purple-100">
            <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Grafik Perkembangan Nilai Per Mata Pelajaran
            </h4>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                  />
                  <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Rapor */}
          <div className="glass-card rounded-2xl border border-purple-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase text-[10px] text-slate-600 border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4">Nilai Akhir</th>
                    <th className="py-3 px-4">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        Belum ada nilai untuk semester ini.
                      </td>
                    </tr>
                  ) : (
                    grades.map((g, idx) => (
                      <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{g.subject}</td>
                        <td className="py-3.5 px-4 text-slate-600">{g.semester}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{g.score}</td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              g.predicate === 'A'
                                ? 'success'
                                : g.predicate === 'B'
                                ? 'info'
                                : g.predicate === 'C'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            Predikat {g.predicate}
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
      </div>
    </DashboardLayout>
  );
}
