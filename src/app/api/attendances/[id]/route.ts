import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const attendanceId = Number(id);

  try {
    const body = await req.json();
    const { status, date } = body;

    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { status, date },
      include: { student: true },
    });

    return NextResponse.json({
      message: 'Absensi berhasil diperbarui',
      attendance,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal memperbarui absensi' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const attendanceId = Number(id);

  try {
    await prisma.attendance.delete({
      where: { id: attendanceId },
    });
    return NextResponse.json({ message: 'Data absensi dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menghapus absensi' }, { status: 500 });
  }
}
