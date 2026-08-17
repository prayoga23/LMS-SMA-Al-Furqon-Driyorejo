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

  const { searchParams } = new URL(req.url);
  const semester = searchParams.get('semester');

  const where: any = { studentId };
  if (semester) where.semester = semester;

  const grades = await prisma.grade.findMany({
    where,
    orderBy: { subject: 'asc' },
  });

  const totalScore = grades.reduce((s: number, g: any) => s + g.score, 0);
  const average = grades.length > 0 ? Number((totalScore / grades.length).toFixed(1)) : 0;

  return NextResponse.json({
    student,
    grades,
    average,
  });
}
