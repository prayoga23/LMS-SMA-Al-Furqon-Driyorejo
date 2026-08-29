import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  return handleSeed();
}

export async function POST(req: NextRequest) {
  return handleSeed();
}

async function handleSeed() {
  try {
    // Clean existing data
    await prisma.teacherAttendance.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.academicInformation.deleteMany({});
    await prisma.allowance.deleteMany({});
    await prisma.grade.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.parents.deleteMany({});
    await prisma.user.deleteMany({});

    const defaultPassword = await bcrypt.hash('password123', 10);

    // 1. Admin User
    await prisma.user.create({
      data: {
        name: 'Administrator Sekolah',
        email: 'admin@sekolah.sch.id',
        password: defaultPassword,
        role: 'admin',
      },
    });

    // 2. Guru User
    await prisma.user.create({
      data: {
        name: 'Drs. H. Ahmad Wijaya, M.Pd',
        email: 'guru@sekolah.sch.id',
        password: defaultPassword,
        role: 'guru',
      },
    });

    // 3. Staff User
    await prisma.user.create({
      data: {
        name: 'Siti Rahmawati, S.Kom',
        email: 'staff@sekolah.sch.id',
        password: defaultPassword,
        role: 'staff',
      },
    });

    // 4. Parent User
    await prisma.user.create({
      data: {
        name: 'Budi Santoso',
        email: 'orangtua@sekolah.sch.id',
        password: defaultPassword,
        role: 'parent',
        parent: {
          create: {
            phone: '081234567890',
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Database berhasil di-reset! Hanya akun role user untuk login yang disiapkan.',
      status: 'success',
    });
  } catch (error: any) {
    console.error('Seeding API Error:', error);
    return NextResponse.json({ message: error.message || 'Gagal seeding database' }, { status: 500 });
  }
}

