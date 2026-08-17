'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Menu, ShieldCheck, User as UserIcon, Building2 } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-4 md:px-8 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/logo.png" alt="Logo SMA AL - FURQON" className="w-6 h-6 object-contain shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight truncate">
              SMA AL - FURQON DRIYOREJO
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block truncate">
              Portal Pemantauan Akademik & Karakter Siswa
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-500 leading-tight">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
