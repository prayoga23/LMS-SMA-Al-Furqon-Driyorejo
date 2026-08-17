import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const studentId = Number(id);

  try {
    const body = await req.json();
    const { nis, name, class: studentClass, major, entry_year, parent_name, parent_phone } = body;

    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        nis,
        name,
        class: studentClass,
        major,
        entryYear: entry_year ? Number(entry_year) : undefined,
      },
      include: {
        parent: {
          include: { user: true },
        },
      },
    });

    if (student.parent) {
      if (parent_phone !== undefined) {
        await prisma.parents.update({
          where: { id: student.parent.id },
          data: { phone: parent_phone },
        });
      }
      if (parent_name !== undefined && student.parent.user) {
        await prisma.user.update({
          where: { id: student.parent.user.id },
          data: { name: parent_name },
        });
      }
    }

    const updatedStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parent: {
          include: { user: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Data siswa berhasil diperbarui',
      student: updatedStudent,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal memperbarui siswa' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const studentId = Number(id);

  try {
    await prisma.student.delete({
      where: { id: studentId },
    });
    return NextResponse.json({ message: 'Data siswa berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menghapus siswa' }, { status: 500 });
  }
}
