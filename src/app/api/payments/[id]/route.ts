import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const paymentId = Number(id);

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { student: true },
    });

    if (!payment) {
      return NextResponse.json({ message: 'Pembayaran tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal mengambil data pembayaran' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const paymentId = Number(id);

  try {
    const body = await req.json();
    const { category, destination, title, semester, academic_year, amount, status, notes } = body;

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        category,
        destination,
        title,
        semester,
        academicYear: academic_year,
        amount: amount !== undefined ? Number(amount) : undefined,
        status,
        notes,
      },
      include: {
        student: {
          include: {
            parent: true,
          },
        },
      },
    });

    try {
      if (payment.student?.parent?.userId) {
        const isLunas = status === 'Lunas';
        await notificationService.sendToUser({
          userId: payment.student.parent.userId,
          title: isLunas ? `Pembayaran SPP Lunas - ${payment.student.name}` : `Update SPP - ${payment.student.name}`,
          body: isLunas
            ? `Pembayaran ${payment.title} (${payment.semester}) sebesar Rp ${payment.amount.toLocaleString('id-ID')} telah terverifikasi LUNAS.`
            : `Data tagihan ${payment.title} (${payment.semester}) telah diperbarui oleh pihak sekolah.`,
          type: 'SPP',
          url: '/parent/payments',
          createdBy: auth.id,
        });
      }
    } catch (notifErr) {
      console.error('Failed sending FCM payment update notification:', notifErr);
    }

    return NextResponse.json({
      message: 'Data pembayaran berhasil diperbarui',
      payment,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal memperbarui pembayaran' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
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
