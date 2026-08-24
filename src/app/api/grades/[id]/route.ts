import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

function calculatePredicate(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  return 'D';
}

async function getTeacherSubject(auth: any): Promise<string | null> {
  if (auth.subject) return auth.subject;
  const teacher = await prisma.teacher.findFirst({
    where: {
      OR: [
        { email: auth.email },
        { id: auth.teacherId || 0 },
      ],
    },
  });
  return teacher?.subject || null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const gradeId = Number(id);

  try {
    const existingGrade = await prisma.grade.findUnique({
      where: { id: gradeId },
    });

    if (!existingGrade) {
      return NextResponse.json({ message: 'Data nilai tidak ditemukan' }, { status: 404 });
    }

    let finalSubject = existingGrade.subject;

    if (auth.role === 'guru') {
      const teacherSubject = await getTeacherSubject(auth);
      if (!teacherSubject || existingGrade.subject.toLowerCase() !== teacherSubject.toLowerCase()) {
        return NextResponse.json(
          { message: 'Anda tidak memiliki hak akses untuk mengedit nilai mata pelajaran ini.' },
          { status: 403 }
        );
      }
      finalSubject = teacherSubject;
    }

    const body = await req.json();
    const { subject, semester, score, predicate } = body;

    const numericScore = Number(score);
    const finalPredicate = predicate || calculatePredicate(numericScore);

    const grade = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        subject: auth.role === 'guru' ? finalSubject : (subject || finalSubject),
        semester,
        score: numericScore,
        predicate: finalPredicate,
      },
      include: { student: true },
    });

    return NextResponse.json({
      message: 'Nilai siswa berhasil diperbarui',
      grade,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal memperbarui nilai' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const gradeId = Number(id);

  try {
    const existingGrade = await prisma.grade.findUnique({
      where: { id: gradeId },
    });

    if (!existingGrade) {
      return NextResponse.json({ message: 'Data nilai tidak ditemukan' }, { status: 404 });
    }

    if (auth.role === 'guru') {
      const teacherSubject = await getTeacherSubject(auth);
      if (!teacherSubject || existingGrade.subject.toLowerCase() !== teacherSubject.toLowerCase()) {
        return NextResponse.json(
          { message: 'Anda tidak memiliki hak akses untuk menghapus nilai mata pelajaran ini.' },
          { status: 403 }
        );
      }
    }

    await prisma.grade.delete({
      where: { id: gradeId },
    });
    return NextResponse.json({ message: 'Nilai berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menghapus nilai' }, { status: 500 });
  }
}
