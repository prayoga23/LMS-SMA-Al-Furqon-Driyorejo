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

  const transactions = await prisma.allowance.findMany({
    where: { studentId },
    orderBy: { date: 'desc' },
  });

  const totalIncome = transactions.reduce((sum: number, t: any) => sum + t.income, 0);
  const totalExpense = transactions.reduce((sum: number, t: any) => sum + t.expense, 0);
  const currentBalance = totalIncome - totalExpense;

  return NextResponse.json({
    student,
    balance: currentBalance,
    total_income: totalIncome,
    total_expense: totalExpense,
    transactions,
  });
}
