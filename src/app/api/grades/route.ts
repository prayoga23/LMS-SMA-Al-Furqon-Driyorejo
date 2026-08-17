import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

function calculatePredicate(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  return 'D';
}

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');
  const semester = searchParams.get('semester');

  const where: any = {};
  if (studentId) where.studentId = Number(studentId);
  if (semester) where.semester = semester;

  const grades = await prisma.grade.findMany({
    where,
    include: { student: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(grades);
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { student_id, subject, semester, score, predicate } = body;

    const numericScore = Number(score);
    const finalPredicate = predicate || calculatePredicate(numericScore);

    const grade = await prisma.grade.create({
      data: {
        studentId: Number(student_id),
        subject,
        semester,
        score: numericScore,
        predicate: finalPredicate,
      },
      include: { student: true },
    });

    return NextResponse.json({
      message: 'Nilai siswa berhasil disimpan',
      grade,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menyimpan nilai' }, { status: 500 });
  }
}
