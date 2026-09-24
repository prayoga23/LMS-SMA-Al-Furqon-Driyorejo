'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  UserCheck,
  Building2,
  FileText,
  RefreshCw,
  Search,
  Filter,
  User,
  Award,
  Check,
  Edit,
  Trash2,
  Users,
  QrCode,
  Camera,
  Maximize2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Volume2,
  Smartphone,
  ExternalLink,
  ChevronRight,
  UserX,
  X,
  Plus,
} from 'lucide-react';

// ─── TYPES & INTERFACES ───────────────────────────

interface Teacher {
  id: number;
  nip: string;
  name: string;
  subject: string;
  phone?: string;
  email?: string;
  status: string;
}

interface PiketTeacherRecord {
  id: number | null; // attendance id if recorded
  teacherId: number;
  teacher: Teacher;
  date: string;
  status: 'Belum Hadir' | 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
  notes?: string | null;
  createdAt?: string | null;
  isRecorded: boolean;
}

interface PiketSummary {
  totalTeachers: number;
  totalHadir: number;
  totalBelumHadir: number;
  totalSakit: number;
  totalIzin: number;
  totalAlpha: number;
}

interface TeacherHistoryRecord {
  id: number;
  teacherId: number;
  date: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
  notes?: string;
  createdAt: string;
}

// ─── AUDIO HELPER ─────────────────────────────────

const playScannerSound = (isSuccess = true) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isSuccess) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // Autoplay policy fallback
  }
};

const formatDateIndo = (dateStr: string) => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Hadir':
      return 'success';
    case 'Sakit':
      return 'info';
    case 'Izin':
      return 'warning';
    case 'Alpha':
      return 'danger';
    case 'Belum Hadir':
      return 'slate';
    default:
      return 'slate';
  }
};

// ═══════════════════════════════════════════════════
// VIEW 1: ADMIN & STAFF (GURU PIKET SEKOLAH HUB)
// ═══════════════════════════════════════════════════

function AdminStaffPiketView() {
  const { user } = useAuth();
  const [records, setRecords] = useState<PiketTeacherRecord[]>([]);
  const [summary, setSummary] = useState<PiketSummary>({
    totalTeachers: 0,
    totalHadir: 0,
    totalBelumHadir: 0,
    totalSakit: 0,
    totalIzin: 0,
    totalAlpha: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isMarkAlphaModalOpen, setIsMarkAlphaModalOpen] = useState(false);

  // Recent scans feed
  const [recentScans, setRecentScans] = useState<
    Array<{ name: string; nip: string; time: string; status: string }>
  >([]);

  // Scanner state
  const [scannerScanning, setScannerScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Kiosk state
  const [kioskQrDataUrl, setKioskQrDataUrl] = useState<string>('');

  // Manual Edit State
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | ''>('');
  const [manualStatus, setManualStatus] = useState<'Hadir' | 'Sakit' | 'Izin' | 'Alpha'>('Hadir');
  const [manualNotes, setManualNotes] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  // Batch Alpha State
  const [submittingAlpha, setSubmittingAlpha] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  useEffect(() => {
    fetchPiketData();

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPiketData();
  }, [dateFilter]);

  const fetchPiketData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers/attendance', {
        params: { date: dateFilter, mode: 'piket' },
      });
      if (res.data) {
        setRecords(res.data.records || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err: any) {
      console.error('Error fetching teacher piket data:', err);
      showToast('error', 'Gagal memuat daftar guru piket.');
    } finally {
      setLoading(false);
    }
  };

  // Generate Kiosk QR Code
  useEffect(() => {
    if (isKioskModalOpen) {
      const payload = JSON.stringify({
        type: 'ALFURQON_PIKET_KIOSK',
        school: 'SMA AL-FURQON DRIYOREJO',
        date: dateFilter,
        timestamp: Date.now(),
      });
      QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#064e3b', // emerald-900
          light: '#ffffff',
        },
      })
        .then((url) => setKioskQrDataUrl(url))
        .catch((err) => console.error('Error generating kiosk QR:', err));
    }
  }, [isKioskModalOpen, dateFilter]);

  // Scanner Lifecycle
  useEffect(() => {
    if (!isScannerOpen) {
      stopScanner();
      setScanMessage(null);
      return;
    }

    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isScannerOpen]);

  const startScanner = async () => {
    try {
      const qrRegionId = 'piket-camera-preview';
      const element = document.getElementById(qrRegionId);
      if (!element) return;

      const html5QrCode = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrCode;

      setScannerScanning(true);
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          handleScannedQr(decodedText);
        },
        () => {
          // Frame parse error ignored
        }
      );
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      setScanMessage({
        type: 'error',
        text: 'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.',
      });
      setScannerScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
      setScannerScanning(false);
    }
  };

  // Process decoded QR Code
  const handleScannedQr = async (qrData: string) => {
    // Avoid double firing within 2 seconds
    if ((window as any).__lastScannedTime && Date.now() - (window as any).__lastScannedTime < 2000) {
      return;
    }
    (window as any).__lastScannedTime = Date.now();

    try {
      const res = await api.post('/teachers/attendance/scan', {
        qrData,
        date: dateFilter,
      });

      const data = res.data;
      if (data.success) {
        playScannerSound(true);
        const timeNow = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        setScanMessage({
          type: data.alreadyHadir ? 'info' : 'success',
          text: data.message,
        });

        // Add to recent scans
        setRecentScans((prev) => [
          {
            name: data.teacher?.name || 'Guru',
            nip: data.teacher?.nip || '-',
            time: timeNow,
            status: 'Hadir',
          },
          ...prev.slice(0, 4),
        ]);

        fetchPiketData();
      }
    } catch (err: any) {
      playScannerSound(false);
      const msg = err.response?.data?.message || 'QR Code tidak valid atau guru tidak ditemukan.';
      setScanMessage({ type: 'error', text: msg });
    }
  };

  // Quick Action: Update status directly from table row
  const handleQuickStatusChange = async (teacherId: number, status: string, teacherName: string) => {
    try {
      await api.post('/teachers/attendance', {
        teacher_id: teacherId,
        date: dateFilter,
        status,
        notes: `Presensi diinput langsung oleh Guru Piket (${user?.name || 'Piket'})`,
      });

      showToast('success', `Status presensi ${teacherName} berhasil diubah menjadi "${status}".`);
      fetchPiketData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Gagal mengubah status presensi.');
    }
  };

  // Open edit modal for specific teacher
  const handleOpenEditModal = (rec: PiketTeacherRecord) => {
    setSelectedTeacherId(rec.teacherId);
    setManualStatus(rec.status === 'Belum Hadir' ? 'Hadir' : rec.status);
    setManualNotes(rec.notes || '');
    setIsManualModalOpen(true);
  };

  // Save manual attendance form
  const handleSaveManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      showToast('error', 'Pilih guru terlebih dahulu.');
      return;
    }

    try {
      setSavingManual(true);
      await api.post('/teachers/attendance', {
        teacher_id: Number(selectedTeacherId),
        date: dateFilter,
        status: manualStatus,
        notes: manualNotes,
      });

      showToast('success', 'Catatan presensi guru berhasil disimpan.');
      setIsManualModalOpen(false);
      fetchPiketData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan presensi.');
    } finally {
      setSavingManual(false);
    }
  };

  // Batch action: Mark remaining unrecorded as Alpha
  const handleMarkRemainingAlpha = async () => {
    try {
      setSubmittingAlpha(true);
      const res = await api.post('/teachers/attendance', {
        action: 'mark-remaining-alpha',
        date: dateFilter,
        notes: `Ditandai Alpha otomatis oleh Guru Piket (${user?.name || 'Staff'}) pada batas jam masuk.`,
      });

      showToast('info', res.data.message || 'Semua guru yang belum hadir ditandai Alpha.');
      setIsMarkAlphaModalOpen(false);
      fetchPiketData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Gagal menandai Alpha massal.');
    } finally {
      setSubmittingAlpha(false);
    }
  };

  // Delete / Reset Attendance
  const handleDeleteAttendance = async (id: number | null, teacherName: string) => {
    if (!id) return;
    if (!confirm(`Hapus catatan kehadiran untuk ${teacherName}? Guru akan berstatus "Belum Hadir".`)) return;

    try {
      await api.delete(`/teachers/attendance?id=${id}`);
      showToast('info', `Presensi ${teacherName} berhasil dihapus/direset.`);
      fetchPiketData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Gagal menghapus presensi.');
    }
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      r.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.teacher.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.teacher.subject.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'BELUM_HADIR') {
      matchesStatus = r.status === 'Belum Hadir';
    } else if (statusFilter === 'HADIR') {
      matchesStatus = r.status === 'Hadir';
    } else if (statusFilter === 'TIDAK_HADIR') {
      matchesStatus = ['Sakit', 'Izin', 'Alpha'].includes(r.status);
    } else if (statusFilter !== 'ALL') {
      matchesStatus = r.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout allowedRole="admin">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
        {/* ─── 1. HEADER BANNER POS PIKET ─── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 sm:p-7 rounded-3xl text-white shadow-xl shadow-emerald-950/20 border border-emerald-700/40 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Pos Piket Aktif
              </span>
              <span className="text-emerald-300/70 text-xs">• Guru Piket / Admin / Staff</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
              Presensi Guru (Piket Sekolah)
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
              Verifikasi kehadiran guru di sekolah menggunakan <strong>Scan QR Code</strong> atau absensi manual seluruh guru agar guru yang tidak hadir dapat langsung diketahui dan dipantau.
            </p>
          </div>

          {/* Clock & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 shrink-0">
            {/* Clock Widget */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
              <div className="p-2 rounded-xl bg-emerald-500/30 text-emerald-200">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  {formatDateIndo(dateFilter)}
                </p>
                <p className="text-lg font-black tracking-tight font-mono text-white">
                  {currentTime || '--:--:--'}
                </p>
              </div>
            </div>

            {/* Main Action: Buka Scanner QR */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 hover:from-emerald-300 hover:to-teal-300 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 text-slate-950" />
              Buka Scanner QR Piket
            </button>
          </div>
        </div>

        {/* ─── 2. QUICK ACTION TOOLBAR (KIOSK & BATCH ACTIONS) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            onClick={() => setIsKioskModalOpen(true)}
            className="p-4 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 text-left group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-800 transition-colors">
                Layar QR Pos Piket (Kiosk)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pajang QR Code di layar pos piket untuk di-scan HP guru
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              setSelectedTeacherId('');
              setManualStatus('Hadir');
              setManualNotes('');
              setIsManualModalOpen(true);
            }}
            className="p-4 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 text-left group"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-slate-900 group-hover:text-teal-800 transition-colors">
                Input / Ubah Presensi Manual
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Absensi langsung untuk guru yang izin, sakit, atau lupa HP
              </p>
            </div>
          </button>

          <button
            onClick={() => setIsMarkAlphaModalOpen(true)}
            disabled={summary.totalBelumHadir === 0}
            className="p-4 rounded-2xl bg-white border border-rose-100 hover:border-rose-300 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-xs text-slate-900 group-hover:text-rose-700 transition-colors">
                  Tandai Sisa Belum Hadir (Alpha)
                </h3>
                {summary.totalBelumHadir > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                    {summary.totalBelumHadir} Guru
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tutup presensi & tandai seluruh guru yang tidak hadir
              </p>
            </div>
          </button>
        </div>

        {/* ─── 3. STAT SUMMARY CARDS ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Guru</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900">{summary.totalTeachers}</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Sudah Hadir</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-emerald-900">{summary.totalHadir}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          <div
            className={`rounded-2xl p-4 border shadow-2xs transition-all ${
              summary.totalBelumHadir > 0
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-300/40'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                Belum Hadir
              </span>
              {summary.totalBelumHadir > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-amber-950">{summary.totalBelumHadir}</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">Sakit</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-sky-900">{summary.totalSakit}</span>
              <AlertTriangle className="w-4 h-4 text-sky-600" />
            </div>
          </div>

          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/80 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Izin</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-amber-900">{summary.totalIzin}</span>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">Alpha</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-rose-900">{summary.totalAlpha}</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
        </div>

        {/* ─── 4. FILTER & ROSTER TABLE ─── */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
          {/* Header & Date Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-700" />
                Daftar Kehadiran Seluruh Guru
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pantau siapa saja guru yang sudah hadir di pos piket vs yang belum hadir ke sekolah
              </p>
            </div>

            {/* Date Picker + Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
                  className={`py-1 px-2.5 text-[10px] font-bold rounded-lg transition-colors ${
                    dateFilter === new Date().toISOString().split('T')[0]
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    setDateFilter(d.toISOString().split('T')[0]);
                  }}
                  className="py-1 px-2.5 text-[10px] font-bold rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Kemarin
                </button>
              </div>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs border border-emerald-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-400 w-40"
              />

              <button
                onClick={fetchPiketData}
                title="Refresh Data"
                className="p-2 rounded-xl border border-slate-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({summary.totalTeachers})
              </button>

              <button
                onClick={() => setStatusFilter('BELUM_HADIR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'BELUM_HADIR'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Belum Hadir ({summary.totalBelumHadir})
              </button>

              <button
                onClick={() => setStatusFilter('HADIR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'HADIR'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Hadir ({summary.totalHadir})
              </button>

              <button
                onClick={() => setStatusFilter('TIDAK_HADIR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'TIDAK_HADIR'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                Sakit / Izin / Alpha ({summary.totalSakit + summary.totalIzin + summary.totalAlpha})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari guru, NIP, mapel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Table Component */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Memuat data guru pos piket...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CalendarCheck className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                Tidak ada data guru yang cocok dengan filter
              </p>
              <p className="text-xs text-slate-400">
                Ubah filter status atau kata kunci pencarian di atas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Guru & NIP</th>
                    <th className="py-3.5 px-4">Mata Pelajaran</th>
                    <th className="py-3.5 px-4 text-center">Status Kehadiran</th>
                    <th className="py-3.5 px-4">Jam Masuk / Scan</th>
                    <th className="py-3.5 px-4">Keterangan / Catatan</th>
                    <th className="py-3.5 px-4 text-center w-48">Aksi Cepat Guru Piket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((item, idx) => {
                    const isBelumHadir = item.status === 'Belum Hadir';
                    return (
                      <tr
                        key={item.teacherId}
                        className={`transition-colors duration-150 ${
                          isBelumHadir
                            ? 'bg-amber-50/20 hover:bg-amber-50/40 text-slate-800'
                            : 'hover:bg-emerald-50/30 text-slate-700'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-400 font-mono">
                          {idx + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                              {item.teacher.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{item.teacher.name}</p>
                              <p className="text-[11px] font-mono text-slate-500">{item.teacher.nip}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {item.teacher.subject || '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isBelumHadir ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertCircle className="w-3 h-3 text-amber-700" />
                              Belum Hadir
                            </span>
                          ) : (
                            <Badge variant={getStatusBadgeVariant(item.status)}>
                              {item.status}
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                          {item.createdAt ? (
                            <span className="font-bold text-slate-900">
                              {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              WIB
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 text-xs">
                          {item.notes || '-'}
                        </td>

                        {/* Quick action buttons */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Hadir */}
                            <button
                              onClick={() => handleQuickStatusChange(item.teacherId, 'Hadir', item.teacher.name)}
                              title="Tandai Hadir"
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                item.status === 'Hadir'
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>

                            {/* Sakit */}
                            <button
                              onClick={() => handleQuickStatusChange(item.teacherId, 'Sakit', item.teacher.name)}
                              title="Tandai Sakit"
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                item.status === 'Sakit'
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                              }`}
                            >
                              S
                            </button>

                            {/* Izin */}
                            <button
                              onClick={() => handleQuickStatusChange(item.teacherId, 'Izin', item.teacher.name)}
                              title="Tandai Izin"
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                item.status === 'Izin'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                              }`}
                            >
                              I
                            </button>

                            {/* Alpha */}
                            <button
                              onClick={() => handleQuickStatusChange(item.teacherId, 'Alpha', item.teacher.name)}
                              title="Tandai Alpha"
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                item.status === 'Alpha'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                              }`}
                            >
                              A
                            </button>

                            {/* Edit / Notes */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="Ubah Keterangan / Presensi Detail"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors ml-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset / Delete if recorded */}
                            {item.isRecorded && (
                              <button
                                onClick={() => handleDeleteAttendance(item.id, item.teacher.name)}
                                title="Hapus / Reset Presensi"
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL 1: SCANNER QR PIKET (LIVE WEBCAM) ─── */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Scanner QR Presensi Guru (Pos Piket)"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Arahkan kamera ke layar smartphone guru yang menampilkan <strong>QR Code Presensi Guru</strong>.
          </p>

          {/* Scanner Box */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
            <div id="piket-camera-preview" className="w-full max-w-[340px] overflow-hidden rounded-xl" />

            {/* Scanning line indicator */}
            {scannerScanning && (
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-56 h-56 border-2 border-emerald-400/80 rounded-2xl relative shadow-lg shadow-emerald-500/20">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                </div>
              </div>
            )}
          </div>

          {/* Scan result message */}
          {scanMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-bounce-short ${
                scanMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : scanMessage.type === 'info'
                  ? 'bg-sky-50 text-sky-900 border border-sky-300'
                  : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
            >
              {scanMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : scanMessage.type === 'info' ? (
                <AlertCircle className="w-5 h-5 text-sky-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <p className="leading-snug">{scanMessage.text}</p>
            </div>
          )}

          {/* Recent scans in this session */}
          {recentScans.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Baru Saja Di-Scan:
              </span>
              <div className="space-y-1.5">
                {recentScans.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    <div className="font-semibold text-slate-900">
                      {s.name} <span className="font-mono text-slate-400 text-[10px]">({s.nip})</span>
                    </div>
                    <span className="text-emerald-700 font-bold font-mono text-[11px]">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Tutup Scanner
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL 2: LAYAR KIOSK QR POS PIKET ─── */}
      <Modal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
        title="Layar QR Pos Piket (Kiosk Display)"
      >
        <div className="space-y-4 text-center">
          <div className="p-4 bg-gradient-to-b from-emerald-50 to-teal-50/40 rounded-2xl border border-emerald-200/80 space-y-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                SMA AL - FURQON DRIYOREJO
              </span>
              <h3 className="font-black text-lg text-slate-900 mt-2">
                QR Presensi Harian Guru
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tanggal: <strong className="text-slate-800">{formatDateIndo(dateFilter)}</strong>
              </p>
            </div>

            {/* QR Code Canvas */}
            <div className="flex justify-center p-3 bg-white rounded-2xl border border-emerald-100 shadow-sm max-w-[280px] mx-auto">
              {kioskQrDataUrl ? (
                <img
                  src={kioskQrDataUrl}
                  alt="QR Pos Piket"
                  className="w-full h-auto object-contain rounded-xl"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              )}
            </div>

            <div className="text-xs text-slate-600 max-w-sm mx-auto space-y-1">
              <p className="font-semibold text-slate-900">
                Cara Absen:
              </p>
              <p className="text-[11px] text-slate-500">
                1. Guru login ke akun masing-masing di HP.<br />
                2. Buka menu <strong>QR Presensi Guru</strong> &gt; klik <strong>Scan QR Pos Piket</strong>.<br />
                3. Arahkan kamera ke kode QR di atas untuk mencatat kehadiran.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsKioskModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Tutup Layar
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL 3: INPUT / UBAH PRESENSI MANUAL ─── */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Input / Ubah Presensi Guru Manual"
      >
        <form onSubmit={handleSaveManualAttendance} className="space-y-4">
          <p className="text-xs text-slate-500">
            Digunakan oleh Guru Piket untuk mencatat kehadiran guru yang izin dinas, sakit dengan surat, atau lupa membawa perangkat HP.
          </p>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Pilih Guru:
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
              required
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-slate-800"
            >
              <option value="">-- Pilih Guru --</option>
              {records.map((r) => (
                <option key={r.teacherId} value={r.teacherId}>
                  {r.teacher.name} ({r.teacher.nip}) — [{r.status}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Status Kehadiran:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Hadir', 'Sakit', 'Izin', 'Alpha'] as const).map((st) => {
                const isSelected = manualStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setManualStatus(st)}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? st === 'Hadir'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : st === 'Sakit'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : st === 'Izin'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Alasan:
            </label>
            <textarea
              rows={2}
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Contoh: Izin dinas pengawas MGMP / Sakit flu surat dokter"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingManual}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 hover:bg-emerald-800 transition-all disabled:opacity-50"
            >
              {savingManual ? 'Menyimpan...' : 'Simpan Presensi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 4: CONFIRMATION MARK ALL REMAINING AS ALPHA ─── */}
      <Modal
        isOpen={isMarkAlphaModalOpen}
        onClose={() => setIsMarkAlphaModalOpen(false)}
        title="Tandai Sisa Guru Belum Hadir sebagai Alpha"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              Konfirmasi Penutupan Presensi Pos Piket
            </div>
            <p>
              Tindakan ini akan menandai seluruh <strong>{summary.totalBelumHadir} guru</strong> yang sampai saat ini berstatus <strong>Belum Hadir</strong> pada tanggal <strong>{formatDateIndo(dateFilter)}</strong> sebagai <strong>Alpha (Tanpa Keterangan)</strong>.
            </p>
            <p className="text-[11px] text-rose-700">
              * Guru Piket tetap dapat mengubah status secara manual jika di kemudian hari terdapat surat izin atau surat keterangan sakit.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsMarkAlphaModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleMarkRemainingAlpha}
              disabled={submittingAlpha}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 hover:bg-rose-700 transition-all disabled:opacity-50"
            >
              {submittingAlpha ? 'Memproses...' : 'Ya, Tandai Alpha'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════
// VIEW 2: ROLE GURU (KARTU IDENTITAS DIGITAL & QR PRESENSI)
// ═══════════════════════════════════════════════════

function GuruPresensiDigitalView() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [history, setHistory] = useState<TeacherHistoryRecord[]>([]);
  const [stats, setStats] = useState({
    totalHadir: 0,
    totalSakit: 0,
    totalIzin: 0,
    totalAlpha: 0,
    totalHari: 0,
    percentage: 100,
  });

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Kiosk Scanner Modal (Teacher scans Pos Piket Screen)
  const [isTeacherScannerOpen, setIsTeacherScannerOpen] = useState(false);
  const [teacherScanScanning, setTeacherScanScanning] = useState(false);
  const [teacherScanMessage, setTeacherScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const teacherScannerRef = useRef<Html5Qrcode | null>(null);

  // Table filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now().toString(), type, message });
  };

  useEffect(() => {
    fetchMyAttendanceData();
  }, []);

  const fetchMyAttendanceData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers/my-attendance');
      const data = res.data;
      setTeacher(data.teacher);
      setTodayAttendance(data.todayAttendance);
      setHistory(data.history || []);
      if (data.stats) setStats(data.stats);

      // Generate Teacher QR Code Data URL
      if (data.qrPayload) {
        QRCode.toDataURL(data.qrPayload, {
          width: 280,
          margin: 2,
          color: {
            dark: '#064e3b', // emerald-900
            light: '#ffffff',
          },
        })
          .then((url) => setQrDataUrl(url))
          .catch((err) => console.error('Error generating teacher QR:', err));
      }
    } catch (err: any) {
      console.error('Error fetching teacher data:', err);
      showToast('error', 'Gagal memuat kartu presensi guru.');
    } finally {
      setLoading(false);
    }
  };

  // Teacher Scanner Lifecycle (Scanning Pos Piket Kiosk)
  useEffect(() => {
    if (!isTeacherScannerOpen) {
      stopTeacherScanner();
      setTeacherScanMessage(null);
      return;
    }

    const timer = setTimeout(() => {
      startTeacherScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopTeacherScanner();
    };
  }, [isTeacherScannerOpen]);

  const startTeacherScanner = async () => {
    try {
      const qrRegionId = 'teacher-kiosk-preview';
      const element = document.getElementById(qrRegionId);
      if (!element) return;

      const html5QrCode = new Html5Qrcode(qrRegionId);
      teacherScannerRef.current = html5QrCode;

      setTeacherScanScanning(true);
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          handleScannedKioskQr(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      setTeacherScanMessage({
        type: 'error',
        text: 'Tidak dapat membuka kamera. Pastikan izin kamera telah disetujui.',
      });
      setTeacherScanScanning(false);
    }
  };

  const stopTeacherScanner = async () => {
    if (teacherScannerRef.current) {
      try {
        if (teacherScannerRef.current.isScanning) {
          await teacherScannerRef.current.stop();
        }
        teacherScannerRef.current.clear();
      } catch (err) {}
      teacherScannerRef.current = null;
      setTeacherScanScanning(false);
    }
  };

  const handleScannedKioskQr = async (kioskToken: string) => {
    if ((window as any).__lastTeacherScan && Date.now() - (window as any).__lastTeacherScan < 2500) {
      return;
    }
    (window as any).__lastTeacherScan = Date.now();

    try {
      const res = await api.post('/teachers/attendance/scan', {
        qrData: kioskToken,
      });

      if (res.data.success) {
        playScannerSound(true);
        setTeacherScanMessage({
          type: 'success',
          text: res.data.message || 'Presensi berhasil dicatat!',
        });
        showToast('success', 'Presensi Hadir di Pos Piket berhasil!');
        fetchMyAttendanceData();
        setTimeout(() => {
          setIsTeacherScannerOpen(false);
        }, 1500);
      }
    } catch (err: any) {
      playScannerSound(false);
      setTeacherScanMessage({
        type: 'error',
        text: err.response?.data?.message || 'QR Code Pos Piket tidak valid.',
      });
    }
  };

  // Filter history
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.date.includes(searchTerm) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 rounded-3xl text-white shadow-xl shadow-emerald-900/10 border border-emerald-600/30">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-white/15 text-emerald-200 border border-white/10">
                <QrCode className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Kartu QR Presensi Guru
              </h1>
            </div>
            <p className="text-emerald-100/90 text-xs sm:text-sm font-medium">
              Tunjukkan QR Code ini kepada <strong>Guru Piket</strong> saat tiba di sekolah untuk verifikasi kehadiran.
            </p>
          </div>

          {/* Quick Scanner Action if Piket displays Kiosk */}
          <button
            onClick={() => setIsTeacherScannerOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-white text-emerald-950 font-black text-xs shadow-md hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <Camera className="w-4 h-4 text-emerald-800" />
            Scan Layar QR Pos Piket
          </button>
        </div>

        {/* ─── DIGITAL CARD & TODAY STATUS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: ID Card with QR (Span 5) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-white via-emerald-50/20 to-emerald-50/40 rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between items-center text-center space-y-5">
            {/* Header Badge */}
            <div className="w-full flex items-center justify-between border-b border-emerald-100/80 pb-3">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 p-1 flex items-center justify-center shadow-xs">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="font-extrabold text-[11px] text-slate-900 block leading-tight">SMA AL - FURQON</span>
                  <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider block">KARTU PRESENSI GURU</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Aktif
              </span>
            </div>

            {/* Teacher Details */}
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">{teacher?.name || user?.name}</h2>
              <p className="font-mono text-xs font-bold text-emerald-800">
                NIP: {teacher?.nip || '-'}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Guru {teacher?.subject || 'Mata Pelajaran'}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-2xl border-2 border-emerald-200 shadow-sm relative group">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code Guru" className="w-56 h-56 object-contain rounded-xl" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
              Tunjukkan QR Code ini ke <strong>Kamera Guru Piket</strong> di pos masuk sekolah saat Anda tiba.
            </p>
          </div>

          {/* Card 2: Today's Status & KPI (Span 7) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            {/* Status Hari Ini Banner */}
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Status Presensi Hari Ini ({formatDateIndo(new Date().toISOString().split('T')[0])})
                  </h3>
                </div>
                <button
                  onClick={fetchMyAttendanceData}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {todayAttendance ? (
                /* Sudah Presensi */
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">Status Anda:</span>
                        <Badge variant={getStatusBadgeVariant(todayAttendance.status)}>
                          {todayAttendance.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Tercatat pada pukul{' '}
                        <strong className="text-slate-900 font-mono">
                          {new Date(todayAttendance.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WIB
                        </strong>{' '}
                        • Pos Piket Sekolah
                      </p>
                    </div>
                  </div>

                  {todayAttendance.notes && (
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs text-slate-700">
                      <strong className="text-slate-900 block mb-0.5">Keterangan:</strong>
                      {todayAttendance.notes}
                    </div>
                  )}
                </div>
              ) : (
                /* Belum Presensi */
                <div className="bg-gradient-to-r from-amber-50 via-orange-50/40 to-white border border-amber-200/90 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 mt-0.5">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-amber-950">
                          Belum Melakukan Presensi di Pos Piket
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                          Wajib Hadir di Sekolah
                        </span>
                      </div>
                      <p className="text-xs text-amber-800/90 leading-relaxed">
                        Anda belum tercatat hadir di pos piket hari ini. Demi kedisiplinan dan keamanan sekolah, presensi mandiri dari rumah ditiadakan. Silakan tunjukkan QR Code di samping kepada <strong>Guru Piket</strong> saat Anda tiba di gerbang sekolah.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* KPI Stats Guru */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Hadir"
                value={stats.totalHadir}
                subtext="Total Hari"
                icon={CheckCircle2}
                gradient="from-emerald-50 to-teal-50"
                iconBg="bg-emerald-700 text-white"
              />
              <StatCard
                title="Sakit"
                value={stats.totalSakit}
                subtext="Hari Sakit"
                icon={AlertTriangle}
                gradient="from-sky-50 to-sky-100/50"
                iconBg="bg-sky-600 text-white"
              />
              <StatCard
                title="Izin"
                value={stats.totalIzin}
                subtext="Hari Izin"
                icon={Calendar}
                gradient="from-amber-50 to-amber-100/50"
                iconBg="bg-amber-600 text-white"
              />
              <StatCard
                title="Alpha"
                value={stats.totalAlpha}
                subtext="Tanpa Ket."
                icon={XCircle}
                gradient="from-rose-50 to-rose-100/50"
                iconBg="bg-rose-600 text-white"
              />
            </div>
          </div>
        </div>

        {/* ─── RIWAYAT PRESENSI SAYA ─── */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Riwayat Presensi Saya
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Rekap kehadiran resmi yang dicatat dan diverifikasi di pos piket sekolah
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari tanggal/catatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs pl-3 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-44"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700"
              >
                <option value="">Semua Status</option>
                <option value="Hadir">Hadir</option>
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
                <option value="Alpha">Alpha</option>
              </select>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CalendarCheck className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                Belum ada data presensi tercatat
              </p>
              <p className="text-xs text-slate-400">
                Presensi akan tercatat otomatis saat Anda memindai QR Code di Pos Piket.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Hari</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Waktu Presensi</th>
                    <th className="py-3 px-4">Keterangan / Pos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 text-slate-700">
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.date}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {formatDateIndo(item.date).split(',')[0]}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            }) + ' WIB'
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL: TEACHER SCANS POS PIKET SCREEN ─── */}
      <Modal
        isOpen={isTeacherScannerOpen}
        onClose={() => setIsTeacherScannerOpen(false)}
        title="Scan QR Layar Pos Piket"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Arahkan kamera HP Anda ke <strong>QR Code di layar Pos Piket Sekolah</strong> untuk melakukan presensi.
          </p>

          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[280px]">
            <div id="teacher-kiosk-preview" className="w-full max-w-[320px] overflow-hidden rounded-xl" />

            {teacherScanScanning && (
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-52 h-52 border-2 border-emerald-400 rounded-2xl relative shadow-lg shadow-emerald-500/20">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                </div>
              </div>
            )}
          </div>

          {teacherScanMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                teacherScanMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
            >
              {teacherScanMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <p>{teacherScanMessage.text}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsTeacherScannerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════
// EXPORT COMPONENT: ROUTE BASED ON USER ROLE
// ═══════════════════════════════════════════════════

export default function TeacherAttendancePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Memuat Presensi Guru...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Admin & Staff: Pos Piket Hub (Scan incoming teachers / manage all teachers)
  if (user?.role === 'admin' || user?.role === 'staff') {
    return <AdminStaffPiketView />;
  }

  // Guru: Digital Card & QR Presensi
  return <GuruPresensiDigitalView />;
}
