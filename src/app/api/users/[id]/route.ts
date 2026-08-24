import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    const body = await req.json();
    const { name, email, role, password } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    if (email && email !== existingUser.email) {
      const emailCheck = await prisma.user.findUnique({
        where: { email },
      });
      if (emailCheck) {
        return NextResponse.json({ message: 'Email sudah digunakan oleh pengguna lain.' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) {
      const validRoles = ['admin', 'guru', 'staff', 'parent'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ message: 'Role pengguna tidak valid.' }, { status: 400 });
      }
      updateData.role = role;
    }

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Data pengguna berhasil diperbarui.',
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal memperbarui data pengguna' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (userId === auth.id) {
      return NextResponse.json(
        { message: 'Anda tidak dapat menghapus akun Anda sendiri saat ini.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'Pengguna berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menghapus pengguna' }, { status: 500 });
  }
}
