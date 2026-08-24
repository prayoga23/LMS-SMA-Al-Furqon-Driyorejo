'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Layers,
  ListFilter,
  Check,
  X,
} from 'lucide-react';
import {
  TargetFieldDef,
  getExcelSheets,
  parseExcelSheetData,
  autoMatchColumns,
  mapExcelRowsToSchema,
} from '@/lib/excel';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  targetFields: TargetFieldDef[];
  downloadTemplateFn?: () => void;
  onImportSubmit: (
    mappedData: Record<string, any>[]
  ) => Promise<{ successCount: number; updateCount: number; errors?: string[]; message?: string }>;
  onSuccess?: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  targetFields,
  downloadTemplateFn,
  onImportSubmit,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [mappedData, setMappedData] = useState<Record<string, any>[]>([]);
  
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    updateCount: number;
    errors: string[];
    message: string;
  } | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setFile(null);
        setSheets([]);
        setSelectedSheet('');
        setExcelHeaders([]);
        setRawRows([]);
        setColumnMapping({});
        setMappedData([]);
        setError('');
        setIsSubmitting(false);
        setImportResult(null);
      }, 300);
    }
  }, [isOpen]);

  // Handle file select
  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    setError('');
    setFile(selectedFile);

    try {
      const sheetList = await getExcelSheets(selectedFile);
      setSheets(sheetList);
      const defaultSheet = sheetList[0] || '';
      setSelectedSheet(defaultSheet);

      if (defaultSheet) {
        await loadSheetData(selectedFile, defaultSheet);
      }
    } catch (err: any) {
      console.error(err);
      setError('Gagal membaca file Excel. Pastikan format file .xlsx, .xls, atau .csv valid.');
    }
  };

  // Load sheet data and auto match columns
  const loadSheetData = async (targetFile: File, sheetName: string) => {
    try {
      const { headers, rawRows: rows } = await parseExcelSheetData(targetFile, sheetName);
      setExcelHeaders(headers);
      setRawRows(rows);

      if (headers.length === 0 || rows.length === 0) {
        setError('Sheet yang dipilih kosong atau tidak memiliki baris data.');
        return;
      }

      // Auto match columns
      const initialMapping = autoMatchColumns(headers, targetFields);
      setColumnMapping(initialMapping);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('Gagal membaca data dari sheet: ' + err.message);
    }
  };

  const handleSheetChange = async (newSheet: string) => {
    setSelectedSheet(newSheet);
    if (file) {
      await loadSheetData(file, newSheet);
    }
  };

  // Step 1 -> Step 2
  const handleGoToMapping = () => {
    if (!file || excelHeaders.length === 0 || rawRows.length === 0) {
      setError('Silakan pilih file Excel yang memiliki data terlebih dahulu.');
      return;
    }
    setError('');
    setStep(2);
  };

  // Step 2 -> Step 3 (Preview)
  const handleGoToPreview = () => {
    // Check required fields
    const missingRequired = targetFields.filter(
      (field) => field.required && (!columnMapping[field.key] || columnMapping[field.key] === '')
    );

    if (missingRequired.length > 0) {
      setError(
        `Kolom wajib berikut belum dipetakan: ${missingRequired.map((f) => f.label).join(', ')}`
      );
      return;
    }

    setError('');
    const parsed = mapExcelRowsToSchema(rawRows, columnMapping, targetFields);
    setMappedData(parsed);
    setStep(3);
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (mappedData.length === 0) {
      setError('Tidak ada data yang dapat diimport.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const res = await onImportSubmit(mappedData);
      setImportResult({
        successCount: res.successCount || 0,
        updateCount: res.updateCount || 0,
        errors: res.errors || [],
        message: res.message || 'Import data selesai diselesaikan.',
      });
      setStep(4);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Gagal menyimpan data import.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiredCountMapped = targetFields
    .filter((f) => f.required)
    .filter((f) => columnMapping[f.key]).length;
  const totalRequired = targetFields.filter((f) => f.required).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      <div className="space-y-5">
        {/* Step Wizard Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
          <div
            className={`flex items-center gap-1.5 font-semibold ${
              step === 1 ? 'text-emerald-700 font-bold' : step > 1 ? 'text-slate-700' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 1
                  ? 'bg-emerald-600 text-white'
                  : step > 1
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              1
            </span>
            <span>Upload File</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />

          <div
            className={`flex items-center gap-1.5 font-semibold ${
              step === 2 ? 'text-emerald-700 font-bold' : step > 2 ? 'text-slate-700' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 2
                  ? 'bg-emerald-600 text-white'
                  : step > 2
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </span>
            <span>Sesuaikan Kolom</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />

          <div
            className={`flex items-center gap-1.5 font-semibold ${
              step === 3 ? 'text-emerald-700 font-bold' : step > 3 ? 'text-slate-700' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 3
                  ? 'bg-emerald-600 text-white'
                  : step > 3
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </span>
            <span>Pratinjau & Import</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD FILE & SHEET SELECT */}
        {step === 1 && (
          <div className="space-y-4">
            {downloadTemplateFn && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Unduh Format Template Resmi</p>
                  <p className="text-[11px] text-slate-500">
                    Gunakan template standar agar nama kolom langsung terdeteksi otomatis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplateFn}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-300 rounded-lg shadow-2xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Template (.xlsx)
                </button>
              </div>
            )}

            {/* Dropzone */}
            <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 p-6 rounded-2xl text-center cursor-pointer transition-colors">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="hidden"
                id="excel-file-dropzone"
              />
              <label htmlFor="excel-file-dropzone" className="cursor-pointer block">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {file ? file.name : 'Klik atau seret file Excel ke sini (.xlsx, .xls, .csv)'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mendukung semua format file Excel dan CSV
                </p>
              </label>
            </div>

            {/* Sheet Selector (if multiple sheets exist) */}
            {sheets.length > 1 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Pilih Lembar Kerja (Sheet):</span>
                </div>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {sheets.map((sheetName, i) => (
                    <option key={i} value={sheetName}>
                      {sheetName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Read Stats */}
            {file && excelHeaders.length > 0 && (
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <span className="font-semibold">
                  ✓ File berhasil dibaca: <b>{rawRows.length} baris data</b> ditemukan ({excelHeaders.length} kolom Excel).
                </span>
                <span className="text-[11px] text-emerald-700">Sheet: {selectedSheet}</span>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGoToMapping}
                disabled={!file || rawRows.length === 0}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>Lanjut: Penyesuaian Kolom</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Pemetaan Kolom Excel ke Database</h4>
                <p className="text-[11px] text-slate-500">
                  Sesuaikan nama kolom dari file Excel Anda dengan kolom data di sistem sekolah.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setColumnMapping(autoMatchColumns(excelHeaders, targetFields))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Otomatis Cocokkan</span>
              </button>
            </div>

            {/* Mapping Table */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs custom-scrollbar">
              {targetFields.map((field) => {
                const currentVal = columnMapping[field.key] || '';
                const isMatched = Boolean(currentVal);

                return (
                  <div
                    key={field.key}
                    className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors ${
                      field.required && !isMatched ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <div className="sm:w-1/2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{field.label}</span>
                        {field.required ? (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 font-bold text-[9px] rounded">
                            Wajib
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 font-medium text-[9px] rounded">
                            Opsional
                          </span>
                        )}
                      </div>
                      {field.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{field.description}</p>
                      )}
                    </div>

                    <div className="sm:w-1/2 flex items-center gap-2">
                      <select
                        value={currentVal}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                        }
                        className={`w-full px-3 py-1.5 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-colors ${
                          isMatched
                            ? 'border-emerald-300 bg-white text-slate-800'
                            : field.required
                            ? 'border-rose-300 bg-rose-50 text-rose-900'
                            : 'border-slate-300 bg-slate-50 text-slate-500'
                        }`}
                      >
                        <option value="">-- Abaikan / Tidak Ada Kolom --</option>
                        {excelHeaders.map((header, idx) => (
                          <option key={idx} value={header}>
                            Kolom Excel: "{header}"
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mapping Summary */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Status Pemetaan Kolom Wajib:{' '}
                <strong className={requiredCountMapped === totalRequired ? 'text-emerald-600' : 'text-rose-600'}>
                  {requiredCountMapped} dari {totalRequired} terpetakan
                </strong>
              </span>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
              <button
                type="button"
                onClick={handleGoToPreview}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Lihat Pratinjau Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & CONFIRM */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-100 p-3 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-emerald-900">
                  Siap Memasukkan {mappedData.length} Baris Data Excel
                </h4>
                <p className="text-[11px] text-emerald-700">
                  Berikut adalah contoh 10 baris pertama hasil penyesuaian kolom yang akan disimpan ke sistem:
                </p>
              </div>
            </div>

            {/* Table Preview */}
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-[11px] text-slate-700">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    {targetFields
                      .filter((f) => columnMapping[f.key])
                      .map((f) => (
                        <th key={f.key} className="py-2.5 px-3 whitespace-nowrap">
                          {f.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappedData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                      {targetFields
                        .filter((f) => columnMapping[f.key])
                        .map((f) => (
                          <td key={f.key} className="py-2 px-3 whitespace-nowrap">
                            {row[f.key] !== undefined && row[f.key] !== null && String(row[f.key]) !== '' ? (
                              String(row[f.key])
                            ) : (
                              <span className="text-slate-300 italic">-</span>
                            )}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {mappedData.length > 10 && (
                <p className="text-[10px] text-slate-400 text-center py-2 bg-slate-50 border-t border-slate-100">
                  + {mappedData.length - 10} baris data lainnya akan diproses secara otomatis...
                </p>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ubah Pemetaan</span>
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses Import Data...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Impor Semua Data ({mappedData.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: IMPORT RESULTS */}
        {step === 4 && importResult && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-800">Proses Import Selesai!</h4>
              <p className="text-xs text-slate-500 mt-1">{importResult.message}</p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-3 text-left pt-2">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Data Baru Ditambahkan</p>
                <p className="text-xl font-black text-emerald-800 mt-0.5">{importResult.successCount}</p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Data Diperbarui</p>
                <p className="text-xl font-black text-blue-800 mt-0.5">{importResult.updateCount}</p>
              </div>
            </div>

            {/* Error logs if any */}
            {importResult.errors.length > 0 && (
              <div className="text-left mt-3">
                <h5 className="text-xs font-bold text-rose-700 mb-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Catatan / Kendala Pada Baris Berikut ({importResult.errors.length}):
                </h5>
                <div className="max-h-32 overflow-y-auto bg-rose-50 border border-rose-100 rounded-xl p-2 text-[11px] text-rose-800 space-y-1 font-mono">
                  {importResult.errors.map((errItem, idx) => (
                    <p key={idx}>• {errItem}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
