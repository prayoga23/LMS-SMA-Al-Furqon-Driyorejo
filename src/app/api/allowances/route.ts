import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role === 'guru') {
    return NextResponse.json({ message: 'Unauthorized. Akses ditolak.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');

  const where: any = {};
  if (studentId) where.studentId = Number(studentId);

  const allowances = await prisma.allowance.findMany({
    where,
    include: { student: true },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(allowances);
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized. Akses ditolak.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { student_id, date, income, expense, description } = body;

    const allowance = await prisma.allowance.create({
      data: {
        studentId: Number(student_id),
        date,
        income: income ? Number(income) : 0,
        expense: expense ? Number(expense) : 0,
        description,
      },
      include: {
        student: {
          include: { parent: true },
        },
      },
    });

    // Send notification to parent
    if (allowance.student?.parent?.userId) {
      const isExpense = Number(expense) > 0;
      const nominalStr = isExpense
        ? `Rp ${Number(expense).toLocaleString('id-ID')}`
        : `Rp ${Number(income).toLocaleString('id-ID')}`;
      const title = isExpense
        ? `Pengeluaran Uang Saku - ${allowance.student.name}`
        : `Pemasukan Uang Saku - ${allowance.student.name}`;
      const notifBody = isExpense
        ? `Tercatat penarikan/jajan uang saku ${nominalStr} pada ${date}: ${description || '-'}.`
        : `Tercatat penambahan/top-up uang saku ${nominalStr} pada ${date}: ${description || '-'}.`;

      notificationService
        .sendToUser({
          userId: allowance.student.parent.userId,
          title,
          body: notifBody,
          type: 'SYSTEM',
          url: '/parent/allowance',
          createdBy: auth.id,
        })
        .catch((err) => console.error('[FCM Allowance Trigger Error]:', err));
    }

    return NextResponse.json({
      message: 'Transaksi uang saku berhasil ditambahkan',
      allowance,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menambahkan transaksi uang saku' }, { status: 500 });
  }
}
