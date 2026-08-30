'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { GraduationCap, Calendar, Trophy, Bell, BookOpen, Clock, Eye, X } from 'lucide-react';

interface AcademicData {
  jadwal_pelajaran: any[];
  jadwal_ujian: any[];
  prestasi: any[];
  kegiatan: any[];
  pengumuman: any[];
  all: any[];
}

export default function ParentAcademicsPage() {
  const [data, setData] = useState<AcademicData | null>(null);
  const [activeTab, setActiveTab] = useState<'semua' | 'jadwal_pelajaran' | 'jadwal_ujian' | 'prestasi' | 'pengumuman'>('semua');
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    fetchAcademicInfo();
  }, []);

  const fetchAcademicInfo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academic');
      setData(res.data);
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
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat informasi akademik...
        </div>
      </DashboardLayout>
    );
  }

  const getFilteredItems = () => {
    if (!data) return [];
    if (activeTab === 'jadwal_pelajaran') return data.jadwal_pelajaran;
    if (activeTab === 'jadwal_ujian') return data.jadwal_ujian;
    if (activeTab === 'prestasi') return data.prestasi;
    if (activeTab === 'pengumuman') return [...data.pengumuman, ...data.kegiatan];
    return data.all;
  };

  const filteredItems = getFilteredItems();

  const getBadge = (cat: string) => {
    switch (cat) {
      case 'Jadwal Pelajaran':
        return <Badge variant="info">Jadwal Pelajaran</Badge>;
      case 'Jadwal Ujian':
        return <Badge variant="warning">Jadwal Ujian</Badge>;
      case 'Prestasi':
        return <Badge variant="success">Prestasi Siswa</Badge>;
      case 'Kegiatan':
        return <Badge variant="purple">Kegiatan Sekolah</Badge>;
      default:
        return <Badge variant="slate">Pengumuman</Badge>;
    }
  };

  return (
    <DashboardLayout allowedRole="parent">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Informasi Akademik Sekolah</h2>
          <p className="text-sm text-slate-600">
            Jadwal pelajaran, kalender ujian, pencapaian prestasi, dan pengumuman resmi
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
          {[
            { id: 'semua', label: 'Semua Informasi', icon: GraduationCap },
            { id: 'jadwal_pelajaran', label: 'Jadwal Pelajaran', icon: BookOpen },
            { id: 'jadwal_ujian', label: 'Jadwal Ujian', icon: Calendar },
            { id: 'prestasi', label: 'Prestasi Siswa', icon: Trophy },
            { id: 'pengumuman', label: 'Pengumuman & Kegiatan', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              Tidak ada informasi pada kategori ini.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="glass-card rounded-2xl overflow-hidden border border-emerald-100 flex flex-col justify-between hover:shadow-md transition-all group">
                <div>
                  {item.imageUrl && (
                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden group/img">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setLightboxImage(item.imageUrl)}
                        className="absolute inset-0 opacity-0 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5"
                      >
                        <Eye className="w-4 h-4" /> Lihat Gambar
                      </button>
                    </div>
                  )}

                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      {getBadge(item.category)}
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.date}
                      </span>
                    </div>
                    <Link
                      href={`/parent/academics/${item.id}`}
                      className="text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors block"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="pt-2">
                      <Link
                        href={`/parent/academics/${item.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Baca Detail Selengkapnya →</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Lightbox Preview Modal */}
        {lightboxImage && (
          <div className="fixed inset-0 z-50 bg-slate-900/85 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
            <div className="relative max-w-4xl max-h-[90vh] bg-transparent overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={lightboxImage}
                alt="Gambar Informasi Akademik"
                className="w-full h-full object-contain max-h-[85vh] rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
