import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const academicId = Number(id);

  try {
    const existing = await prisma.academicInformation.findUnique({
      where: { id: academicId },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Informasi akademik tidak ditemukan' }, { status: 404 });
    }

    // Admin can edit everything. Non-admin can only edit their own uploaded items.
    if (auth.role !== 'admin' && existing.createdById && existing.createdById !== auth.id) {
      return NextResponse.json({ message: 'Anda tidak memiliki akses untuk mengedit informasi ini' }, { status: 403 });
    }

    const body = await req.json();
    const { title, category, description, date, imageUrl } = body;

    const academic = await prisma.academicInformation.update({
      where: { id: academicId },
      data: { title, category, description, date, imageUrl: imageUrl !== undefined ? imageUrl : undefined },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Informasi akademik berhasil diperbarui',
      academic,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal memperbarui informasi akademik' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const academicId = Number(id);

  try {
    const existing = await prisma.academicInformation.findUnique({
      where: { id: academicId },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Informasi akademik tidak ditemukan' }, { status: 404 });
    }

    // Admin can delete everything. Non-admin can only delete their own uploaded items.
    if (auth.role !== 'admin' && existing.createdById && existing.createdById !== auth.id) {
      return NextResponse.json({ message: 'Anda tidak memiliki akses untuk menghapus informasi ini' }, { status: 403 });
    }

    await prisma.academicInformation.delete({
      where: { id: academicId },
    });
    return NextResponse.json({ message: 'Informasi akademik dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menghapus informasi akademik' }, { status: 500 });
  }
}

