'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ParentProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">Membuka Halaman Profile...</p>
      </div>
    </div>
  );
}
