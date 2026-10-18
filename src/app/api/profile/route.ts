import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthUser, signToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized. Silakan login kembali.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: {
        parent: {
          include: {
            students: {
              select: {
                id: true,
                nis: true,
                name: true,
                class: true,
                major: true,
                isSantri: true,
                residenceType: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
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

    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        phone: user.parent?.phone || teacherData?.phone || '',
        teacher: teacherData
          ? {
              id: teacherData.id,
              nip: teacherData.nip,
              name: teacherData.name,
              subject: teacherData.subject,
              phone: teacherData.phone,
              status: teacherData.status,
            }
          : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Gagal mengambil data profil.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized. Silakan login kembali.' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, currentPassword, newPassword, confirmPassword } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ message: 'Nama lengkap wajib diisi.' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ message: 'Format email tidak valid.' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: auth.id },
      include: {
        parent: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Cek jika email diganti dan sudah digunakan oleh akun lain
    if (email.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (emailExists) {
        return NextResponse.json(
          { message: 'Email sudah digunakan oleh akun lain. Gunakan email yang berbeda.' },
          { status: 400 }
        );
      }
    }

    const updateData: {
      name: string;
      email: string;
      password?: string;
    } = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
    };

    // Validasi Ganti Password jika ada input password baru
    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword || currentPassword.trim() === '') {
        return NextResponse.json(
          { message: 'Password saat ini (lama) wajib diisi untuk verifikasi keamanan.' },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { message: 'Password saat ini yang Anda masukkan salah.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { message: 'Password baru minimal harus 6 karakter.' },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { message: 'Konfirmasi password baru tidak cocok.' },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update user di database
    const updatedUser = await prisma.user.update({
      where: { id: auth.id },
      data: updateData,
      include: {
        parent: {
          include: {
            students: {
              select: {
                id: true,
                nis: true,
                name: true,
                class: true,
                major: true,
                isSantri: true,
                residenceType: true,
              },
            },
          },
        },
      },
    });

    // Update data parent nomor telepon jika role parent
    if (currentUser.role === 'parent') {
      if (currentUser.parent) {
        await prisma.parents.update({
          where: { id: currentUser.parent.id },
          data: { phone: phone?.trim() || null },
        });
      } else {
        await prisma.parents.create({
          data: {
            userId: currentUser.id,
            phone: phone?.trim() || null,
          },
        });
      }
    }

    // Update data teacher jika role guru
    let teacherData = null;
    if (currentUser.role === 'guru') {
      const existingTeacher = await prisma.teacher.findFirst({
        where: {
          OR: [
            { email: currentUser.email },
            { name: currentUser.name },
          ],
        },
      });

      if (existingTeacher) {
        teacherData = await prisma.teacher.update({
          where: { id: existingTeacher.id },
          data: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || existingTeacher.phone,
          },
        });
      }
    }

    // Generate token baru dengan data terupdate
    const newToken = signToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      parentId: updatedUser.parent?.id || null,
      subject: teacherData?.subject || auth.subject || null,
      teacherId: teacherData?.id || auth.teacherId || null,
    });

    const { password, ...safeUser } = updatedUser;

    return NextResponse.json({
      message: newPassword
        ? 'Profil dan password Anda berhasil diperbarui!'
        : 'Profil Anda berhasil diperbarui!',
      access_token: newToken,
      user: {
        id: safeUser.id,
        name: safeUser.name,
        email: safeUser.email,
        role: safeUser.role,
        parent_id: safeUser.parent ? safeUser.parent.id : null,
        phone: phone?.trim() || safeUser.parent?.phone || teacherData?.phone || '',
        subject: teacherData?.subject || null,
        teacher_id: teacherData?.id || null,
        teacher: teacherData,
        parent: safeUser.parent,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Gagal memperbarui profil pengguna.' },
      { status: 500 }
    );
  }
}
