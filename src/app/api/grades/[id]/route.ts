import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

function calculatePredicate(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  return 'D';
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const gradeId = Number(id);

  try {
    const body = await req.json();
    const { subject, semester, score, predicate } = body;

    const numericScore = Number(score);
    const finalPredicate = predicate || calculatePredicate(numericScore);

    const grade = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        subject,
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
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const gradeId = Number(id);

  try {
    await prisma.grade.delete({
      where: { id: gradeId },
    });
    return NextResponse.json({ message: 'Nilai berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menghapus nilai' }, { status: 500 });
  }
}
