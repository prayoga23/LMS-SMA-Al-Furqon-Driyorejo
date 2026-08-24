import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { parent: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ message: 'Email atau password salah.' }, { status: 401 });
    }

    let teacherData = null;
    if (user.role === 'guru') {
      teacherData = await prisma.teacher.findFirst({
        where: {
          OR: [
            { email: user.email },
            { name: user.name },
          ],
        },
      });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      parentId: user.parent?.id,
      subject: teacherData?.subject || null,
      teacherId: teacherData?.id || null,
    });

    return NextResponse.json({
      message: 'Login berhasil',
      access_token: token,
      token_type: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        parent_id: user.parent ? user.parent.id : null,
        subject: teacherData?.subject || null,
        teacher_id: teacherData?.id || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
