import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
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
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
      include: { student: true },
    });

    return NextResponse.json({
      message: 'Transaksi uang saku berhasil ditambahkan',
      allowance,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menambahkan transaksi uang saku' }, { status: 500 });
  }
}
