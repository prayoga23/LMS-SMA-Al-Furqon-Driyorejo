import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;
  const paymentId = Number(id);

  if (isNaN(paymentId)) {
    return NextResponse.json({ message: 'ID pembayaran tidak valid' }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { paymentMethod, bankName } = body;

    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json({ message: 'Data pembayaran tidak ditemukan' }, { status: 404 });
    }

    // Security check for parent role
    if (auth.role === 'parent') {
      const parent = await prisma.parents.findFirst({
        where: { userId: auth.id },
      });
      if (!parent || existingPayment.student.parentId !== parent.id) {
        return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
      }
    }

    const methodText = paymentMethod || 'Online Payment';
    const channelText = bankName ? `${methodText} (${bankName})` : methodText;
    const nowStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const noteText = `Pembayaran Online via ${channelText} pada ${nowStr}`;

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'Lunas',
        notes: noteText,
      },
      include: {
        student: true,
      },
    });

    return NextResponse.json({
      message: 'Pembayaran online berhasil dikonfirmasi!',
      payment: updatedPayment,
      receipt: {
        transaction_id: `PAY-${Date.now()}-${updatedPayment.id}`,
        date: nowStr,
        student_name: updatedPayment.student.name,
        nis: updatedPayment.student.nis,
        title: updatedPayment.title || (updatedPayment.category === 'Kegiatan' ? 'Anggaran Kegiatan' : 'SPP Bulanan'),
        category: updatedPayment.category,
        destination: updatedPayment.destination,
        amount: updatedPayment.amount,
        payment_method: channelText,
        status: 'LUNAS',
      },
    });
  } catch (error: any) {
    console.error('Error processing online payment:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal memproses pembayaran online' },
      { status: 500 }
    );
  }
}
