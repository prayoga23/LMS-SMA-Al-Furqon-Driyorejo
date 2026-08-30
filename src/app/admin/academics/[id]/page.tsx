'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Share2,
  Trash2,
  Edit,
  Loader2,
  Building2,
  Megaphone,
} from 'lucide-react';

interface AcademicInfo {
  id: number;
  title: string;
  category: string;
  description: string;
  date: string;
  imageUrl?: string;
  createdAt?: string;
  createdBy?: {
    name: string;
    role: string;
  };
}

export default function AdminAcademicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const infoId = params?.id as string;

  const [item, setItem] = useState<AcademicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (infoId) {
      fetchDetail();
    }
  }, [infoId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/academics/${infoId}`);
      setItem(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Informasi akademik tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm(`Hapus informasi "${item.title}"?`)) return;
    try {
      await api.delete(`/academics/${item.id}`);
      router.push('/admin/academics');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus informasi');
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRole="admin">
        <div className="py-20 text-center text-slate-500">
          <Loader2 className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat detail informasi sekolah...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !item) {
    return (
      <DashboardLayout allowedRole="admin">
        <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
          <p className="text-sm font-semibold text-rose-600">{error || 'Informasi tidak ditemukan'}</p>
          <Link
            href="/admin/academics"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Informasi Sekolah
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRole="admin">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
        {/* Top Header & Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/admin/academics"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Informasi Sekolah
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus</span>
            </button>
          </div>
        </div>

        {/* Detail Content Card */}
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {item.imageUrl && (
            <div className="w-full max-h-96 overflow-hidden bg-slate-900 flex items-center justify-center">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover max-h-96"
              />
            </div>
          )}

          <div className="p-6 sm:p-10 space-y-6">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={item.category === 'Penting' ? 'danger' : 'success'}>
                {item.category}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>
                  {new Date(item.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <User className="w-4 h-4 text-slate-400" />
                <span>Oleh: {item.createdBy?.name || 'Administrator SMA Al-Furqon'}</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {item.title}
            </h1>

            <hr className="border-slate-100" />

            {/* Description Body */}
            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line space-y-4">
              {item.description}
            </div>

            {/* Footer Badge Info */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold text-slate-600">SMA AL-FURQON DRIYOREJO</span>
              </div>
              <span>Portal Pemantauan Akademik & Karakter Siswa</span>
            </div>
          </div>
        </article>
      </div>
    </DashboardLayout>
  );
}
