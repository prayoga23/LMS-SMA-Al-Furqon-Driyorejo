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
    const body = await req.json();
    const { title, category, description, date, imageUrl } = body;

    const academic = await prisma.academicInformation.update({
      where: { id: academicId },
      data: { title, category, description, date, imageUrl: imageUrl !== undefined ? imageUrl : undefined },
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
    await prisma.academicInformation.delete({
      where: { id: academicId },
    });
    return NextResponse.json({ message: 'Informasi akademik dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menghapus informasi akademik' }, { status: 500 });
  }
}
