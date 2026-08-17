'use client';

import React, { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-5xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col modal-backdrop-enter overflow-hidden">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-100 px-6 sm:px-10 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all"
            title="Kembali ke Halaman Sebelumnya (Esc)"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-emerald-600 rounded-full inline-block shrink-0" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-slate-500 leading-none mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <span className="hidden sm:inline">Tutup</span>
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Main Fullscreen Form Content */}
      <main className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 sm:py-8 custom-scrollbar">
        <div className={`mx-auto w-full ${maxWidth}`}>
          {children}
        </div>
      </main>
    </div>
  );
};
