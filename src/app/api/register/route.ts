import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, nis, studentId, studentName } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nama lengkap, email, dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Kata sandi minimal 6 karakter.' },
        { status: 400 }
      );
    }

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' },
        { status: 400 }
      );
    }

    // Pre-verify target student if provided
    let targetStudent = null;
    if (studentId) {
      targetStudent = await prisma.student.findUnique({
        where: { id: Number(studentId) },
      });
    } else if (nis && nis.trim()) {
      targetStudent = await prisma.student.findUnique({
        where: { nis: nis.trim() },
      });
    } else if (studentName && studentName.trim()) {
      targetStudent = await prisma.student.findFirst({
        where: { name: { contains: studentName.trim() } },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User & Parent record
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'parent',
        parent: {
          create: {
            phone: phone ? phone.trim() : null,
          },
        },
      },
      include: { parent: true },
    });

    const parentId = user.parent?.id;

    // Link student if found
    if (targetStudent && parentId) {
      await prisma.student.update({
        where: { id: targetStudent.id },
        data: { parentId },
      });
    }

    // Generate JWT token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: 'parent',
      parentId,
    });

    return NextResponse.json(
      {
        message: targetStudent
          ? `Pendaftaran akun orang tua berhasil! Terhubung dengan siswa ${targetStudent.name} (${targetStudent.class}).`
          : 'Pendaftaran akun orang tua berhasil!',
        access_token: token,
        token_type: 'Bearer',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          parent_id: parentId || null,
          student: targetStudent
            ? {
                id: targetStudent.id,
                name: targetStudent.name,
                class: targetStudent.class,
                nis: targetStudent.nis,
              }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal mendaftar akun orang tua.' },
      { status: 500 }
    );
  }
}
