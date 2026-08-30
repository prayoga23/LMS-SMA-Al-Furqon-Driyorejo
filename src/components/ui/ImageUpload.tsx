'use client';

import React, { useState } from 'react';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value = '',
  onChange,
  placeholder = 'Unggah gambar poster / edaran (PNG, JPG, max 5MB)',
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.url) {
        onChange(res.data.url);
      } else {
        setError('Gagal mendapatkan URL gambar dari server.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group max-h-64 flex items-center justify-center">
          <img src={value} alt="Preview" className="w-full h-full object-cover max-h-64" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
            title="Hapus Gambar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl cursor-pointer transition-all">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs mb-2">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            ) : (
              <Upload className="w-6 h-6 text-emerald-600" />
            )}
          </div>
          <span className="text-xs font-bold text-slate-800">
            {uploading ? 'Mengunggah Gambar...' : 'Klik untuk Unggah Gambar'}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">{placeholder}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}

      {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
    </div>
  );
};
