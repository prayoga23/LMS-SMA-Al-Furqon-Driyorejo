'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  TEACHER_TARGET_FIELDS,
  downloadTeacherExcelTemplate,
  getExcelSheets,
  parseExcelSheetData,
  autoMatchColumns,
  mapExcelRowsToSchema,
} from '@/lib/excel';
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ListFilter,
  Building2,
} from 'lucide-react';

export default function ImportTeachersPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [mappedData, setMappedData] = useState<Record<string, any>[]>([]);

  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    updateCount: number;
    errors?: string[];
    message?: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    setFile(selectedFile);

    try {
      const sheetNames = await getExcelSheets(selectedFile);
      if (sheetNames.length === 0) {
        setError('File Excel tidak memiliki lembar kerja (sheet) yang valid.');
        return;
      }
      setSheets(sheetNames);
      const defaultSheet = sheetNames[0];
      setSelectedSheet(defaultSheet);

      const { headers, rawRows: rows } = await parseExcelSheetData(selectedFile, defaultSheet);
      if (headers.length === 0) {
        setError('Lembar kerja yang dipilih tidak memiliki header kolom.');
        return;
      }
      setExcelHeaders(headers);
      setRawRows(rows);

      const autoMap = autoMatchColumns(headers, TEACHER_TARGET_FIELDS);
      setColumnMapping(autoMap);

      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal membaca file Excel.');
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!file) return;
    setSelectedSheet(sheetName);
    setError('');

    try {
      const { headers, rawRows: rows } = await parseExcelSheetData(file, sheetName);
      setExcelHeaders(headers);
      setRawRows(rows);

      const autoMap = autoMatchColumns(headers, TEACHER_TARGET_FIELDS);
      setColumnMapping(autoMap);
    } catch (err: any) {
      setError('Gagal membaca sheet ' + sheetName);
    }
  };

  const handleMappingChange = (targetKey: string, excelHeader: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [targetKey]: excelHeader,
    }));
  };

  const handleGoToPreview = () => {
    setError('');
    const requiredUnmapped = TEACHER_TARGET_FIELDS.filter(
      (f: any) => f.required && (!columnMapping[f.key] || columnMapping[f.key] === '__IGNORE__')
    );

    if (requiredUnmapped.length > 0) {
      setError(
        `Kolom wajib berikut belum dicocokkan: ${requiredUnmapped.map((f: any) => f.label).join(', ')}`
      );
      return;
    }

    const mapped = mapExcelRowsToSchema(rawRows, columnMapping, TEACHER_TARGET_FIELDS);
    setMappedData(mapped);
    setStep(3);
  };

  const handleExecuteImport = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/teachers/import', { teachers: mappedData });
      setImportResult({
        successCount: res.data.successCount || 0,
        updateCount: res.data.updateCount || 0,
        errors: res.data.errors || [],
        message: res.data.message || 'Import data guru berhasil.',
      });
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat mengimport data guru ke server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout allowedRole="admin">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/teachers"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Data Guru
            </Link>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-teal-600" />
              Import Data Guru dari File Excel
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Unggah file Excel (.xlsx / .csv) untuk menambah atau memperbarui data tenaga pengajar SMA Al-Furqon
            </p>
          </div>

          <button
            onClick={() => downloadTeacherExcelTemplate()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-2xs transition-colors shrink-0"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Unduh Template Excel Guru
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            <div className={`p-2.5 rounded-xl border ${step === 1 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : step > 1 ? 'bg-slate-100 border-slate-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              1. Unggah File
            </div>
            <div className={`p-2.5 rounded-xl border ${step === 2 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : step > 2 ? 'bg-slate-100 border-slate-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              2. Cocokkan Kolom
            </div>
            <div className={`p-2.5 rounded-xl border ${step === 3 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : step > 3 ? 'bg-slate-100 border-slate-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              3. Pratinjau & Simpan
            </div>
            <div className={`p-2.5 rounded-xl border ${step === 4 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              4. Selesai
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD FILE */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Pilih File Excel Data Guru</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pastikan baris pertama pada lembar kerja berisi nama kolom (NIP, Nama, Mapel, Telp, Email)
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Browse / Pilih File Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            {sheets.length > 1 && (
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Pilih Sheet Excel:</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  {sheets.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-emerald-600" />
                Pemetaan Kolom Excel Guru ({rawRows.length} baris terbaca)
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {TEACHER_TARGET_FIELDS.map((field: any) => {
                  const currentExcelHeader = columnMapping[field.key] || '__IGNORE__';
                  return (
                    <div key={field.key} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {field.label}
                          {field.required && <span className="text-rose-500 font-bold">*</span>}
                        </span>
                        <p className="text-[11px] text-slate-500">{field.description}</p>
                      </div>

                      <select
                        value={currentExcelHeader}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className={`w-full sm:w-64 px-3 py-2 rounded-xl text-xs font-semibold border ${currentExcelHeader !== '__IGNORE__' ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900' : 'bg-white border-slate-200 text-slate-500'}`}
                      >
                        <option value="__IGNORE__">-- Abaikan Kolom Ini --</option>
                        {excelHeaders.map((h) => (
                          <option key={h} value={h}>
                            Excel Header: "{h}"
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Ganti File Excel
              </button>
              <button
                type="button"
                onClick={handleGoToPreview}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
              >
                <span>Lanjut ke Pratinjau</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & SUBMIT */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Pratinjau {mappedData.length} Data Guru Siap Diimport
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar max-h-96">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 uppercase text-[10px] text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">NIP</th>
                    <th className="py-3 px-3">Nama Guru</th>
                    <th className="py-3 px-3">Mata Pelajaran</th>
                    <th className="py-3 px-3">No. HP</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {mappedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{row.nip || '-'}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{row.name || '-'}</td>
                      <td className="py-2.5 px-3">{row.subject || '-'}</td>
                      <td className="py-2.5 px-3">{row.phone || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{row.email || '-'}</td>
                      <td className="py-2.5 px-3">{row.status || 'Aktif'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Kembali ke Pemetaan Kolom
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mengimport Data Guru...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi Import {mappedData.length} Guru</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS RESULT */}
        {step === 4 && importResult && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Proses Import Selesai</h3>
              <p className="text-xs text-slate-600 mt-1">{importResult.message}</p>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="max-w-xl mx-auto p-4 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-700 space-y-1">
                <p className="font-bold text-rose-800">Catatan Peringatan:</p>
                {importResult.errors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
              <Link
                href="/admin/teachers"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Lihat Daftar Data Guru
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
