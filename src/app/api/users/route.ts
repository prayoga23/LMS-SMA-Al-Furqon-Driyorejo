import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized. Akses ditolak.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized. Akses ditolak.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role, studentId, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Semua bidang (Nama, Email, Password, Role) wajib diisi.' }, { status: 400 });
    }

    const validRoles = ['admin', 'guru', 'staff', 'parent'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: 'Role pengguna tidak valid.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar dalam sistem.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        ...(role === 'parent' ? { parent: { create: { phone: phone || null } } } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        parent: { select: { id: true } },
      },
    });

    if (role === 'parent' && studentId && newUser.parent) {
      await prisma.student.update({
        where: { id: Number(studentId) },
        data: { parentId: newUser.parent.id },
      });
    }

    return NextResponse.json(
      {
        message: 'Pengguna baru berhasil ditambahkan.',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal membuat pengguna baru' }, { status: 500 });
  }
}
