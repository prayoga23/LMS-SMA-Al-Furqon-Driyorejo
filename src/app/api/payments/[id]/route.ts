import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const paymentId = Number(id);

  try {
    const body = await req.json();
    const { semester, academic_year, amount, status } = body;

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        semester,
        academicYear: academic_year,
        amount: Number(amount),
        status,
      },
      include: { student: true },
    });

    return NextResponse.json({
      message: 'Pembayaran SPP berhasil diperbarui',
      payment,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal memperbarui pembayaran' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const paymentId = Number(id);

  try {
    await prisma.payment.delete({
      where: { id: paymentId },
    });
    return NextResponse.json({ message: 'Data pembayaran berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menghapus pembayaran' }, { status: 500 });
  }
}
