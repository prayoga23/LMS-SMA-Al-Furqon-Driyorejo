import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const parent = await prisma.parents.findFirst({
    where: { userId: auth.id },
  });

  if (!parent) {
    return NextResponse.json({ message: 'Data orang tua tidak ditemukan.' }, { status: 404 });
  }

  const student = await prisma.student.findFirst({
    where: { parentId: parent.id },
    include: {
      parent: { include: { user: true } },
      payments: { orderBy: { createdAt: 'desc' } },
      attendance: { orderBy: { date: 'desc' } },
      grades: true,
      allowances: { orderBy: { date: 'desc' } },
    },
  });

  if (!student) {
    return NextResponse.json({ message: 'Data siswa tidak ditemukan.' }, { status: 404 });
  }

  const totalAttendance = student.attendance.length;
  const hadir = student.attendance.filter((a: any) => a.status === 'Hadir').length;
  const attendancePercentage = totalAttendance > 0
    ? Number(((hadir / totalAttendance) * 100).toFixed(1))
    : 0;

  const totalScores = student.grades.reduce((sum: number, g: any) => sum + g.score, 0);
  const avgGrade = student.grades.length > 0
    ? Number((totalScores / student.grades.length).toFixed(1))
    : 0;

  const latestPayment = student.payments[0];

  return NextResponse.json({
    student,
    attendance_percentage: attendancePercentage,
    average_grade: avgGrade,
    latest_payment_status: latestPayment ? latestPayment.status : 'N/A',
  });
}
