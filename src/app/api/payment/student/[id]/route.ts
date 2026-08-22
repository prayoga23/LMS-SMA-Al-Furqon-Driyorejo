import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;
  const studentId = Number(id);

  if (auth.role === 'parent') {
    const parent = await prisma.parents.findFirst({ where: { userId: auth.id } });
    const parentStudent = await prisma.student.findFirst({
      where: { id: studentId, parentId: parent?.id ?? 0 },
    });
    if (!parentStudent) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
    }
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return NextResponse.json({ message: 'Student not found' }, { status: 404 });
  }

  const payments = await prisma.payment.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });

  const totalPaid = payments.filter((p: any) => p.status === 'Lunas').reduce((s: number, p: any) => s + p.amount, 0);
  const totalUnpaid = payments.filter((p: any) => p.status === 'Belum Lunas').reduce((s: number, p: any) => s + p.amount, 0);

  // Breakdown Yayasan vs Sekolah
  const yayasanPayments = payments.filter((p: any) => p.category === 'SPP' || p.destination.includes('Yayasan'));
  const yayasanPaid = yayasanPayments.filter((p: any) => p.status === 'Lunas').reduce((s: number, p: any) => s + p.amount, 0);
  const yayasanUnpaid = yayasanPayments.filter((p: any) => p.status === 'Belum Lunas').reduce((s: number, p: any) => s + p.amount, 0);

  const sekolahPayments = payments.filter((p: any) => p.category === 'Kegiatan' || p.destination.includes('Sekolah'));
  const sekolahPaid = sekolahPayments.filter((p: any) => p.status === 'Lunas').reduce((s: number, p: any) => s + p.amount, 0);
  const sekolahUnpaid = sekolahPayments.filter((p: any) => p.status === 'Belum Lunas').reduce((s: number, p: any) => s + p.amount, 0);

  return NextResponse.json({
    student,
    payments,
    total_paid: totalPaid,
    total_unpaid: totalUnpaid,
    breakdown: {
      yayasan: {
        destination: 'Yayasan Pondok Pesantren Al-Furqon',
        paid: yayasanPaid,
        unpaid: yayasanUnpaid,
        payments: yayasanPayments,
      },
      sekolah: {
        destination: 'Sekolah (SMA Al-Furqon)',
        paid: sekolahPaid,
        unpaid: sekolahUnpaid,
        payments: sekolahPayments,
      },
    },
  });
}
