'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function PaymentDynamicPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  useEffect(() => {
    if (id) {
      router.replace(`/parent/payments/pay?id=${id}`);
    } else {
      router.replace('/parent/payments/pay');
    }
  }, [id, router]);

  return (
    <DashboardLayout allowedRole="parent">
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-700 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Mengarahkan ke halaman pembayaran...</p>
      </div>
    </DashboardLayout>
  );
}
