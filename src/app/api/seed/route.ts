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
    // Clean existing data in reverse order of dependencies
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
    const guruUser = await prisma.user.create({
      data: {
        name: 'Drs. H. Ahmad Wijaya, M.Pd',
        email: 'guru@sekolah.sch.id',
        password: defaultPassword,
        role: 'guru',
      },
    });

    // Create Teacher Profile for Guru User
    await prisma.teacher.create({
      data: {
        nip: 'GURU-0001',
        name: guruUser.name,
        email: guruUser.email,
        subject: 'Kimia',
        phone: '081299887766',
        status: 'Aktif',
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

    // 4. Parent User (Budi Santoso) + Sample Student (Sultan Syahrir)
    const parentUser = await prisma.user.create({
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
      include: { parent: true },
    });

    const parentId = parentUser.parent?.id;

    if (parentId) {
      await prisma.student.create({
        data: {
          parentId,
          nis: '20241001',
          name: 'Sultan Syahrir',
          class: 'X IPA 1',
          major: 'IPA',
          entryYear: 2024,
          isSantri: true,
          residenceType: 'Asrama Pondok Pesantren',
          sppNominal: 500000,
          activityNominal: 150000,
          payments: {
            create: [
              {
                category: 'SPP',
                destination: 'Yayasan Pondok Pesantren Al-Furqon',
                title: 'SPP Juli 2026',
                semester: 'Ganjil 2026/2027',
                academicYear: '2026/2027',
                amount: 500000,
                status: 'Lunas',
                notes: 'Pembayaran via Virtual Account BCA',
              },
              {
                category: 'SPP',
                destination: 'Yayasan Pondok Pesantren Al-Furqon',
                title: 'SPP Agustus 2026',
                semester: 'Ganjil 2026/2027',
                academicYear: '2026/2027',
                amount: 500000,
                status: 'Belum Lunas',
                notes: 'Jatuh tempo 10 Agustus 2026',
              },
              {
                category: 'Kegiatan',
                destination: 'Sekolah (SMA Al-Furqon)',
                title: 'Biaya Laboratorium & Ekskul',
                semester: 'Ganjil 2026/2027',
                academicYear: '2026/2027',
                amount: 150000,
                status: 'Lunas',
                notes: 'Biaya Kegiatan Tahunan',
              },
            ],
          },
          attendance: {
            create: [
              { date: '2026-08-25', status: 'Hadir', subject: 'Matematika', session: '07:00 - 08:30' },
              { date: '2026-08-26', status: 'Hadir', subject: 'Fisika', session: '08:30 - 10:00' },
              { date: '2026-08-27', status: 'Hadir', subject: 'Bahasa Indonesia', session: '10:15 - 11:45' },
              { date: '2026-08-28', status: 'Izin', subject: 'Bahasa Inggris', session: '07:00 - 08:30' },
              { date: '2026-08-29', status: 'Hadir', subject: 'PAI & Tahfidz', session: '08:30 - 10:00' },
            ],
          },
          grades: {
            create: [
              { subject: 'Matematika Wajib', semester: 'Ganjil 2026/2027', score: 88, predicate: 'Sangat Baik (A)' },
              { subject: 'Fisika', semester: 'Ganjil 2026/2027', score: 85, predicate: 'Baik (B)' },
              { subject: 'Bahasa Indonesia', semester: 'Ganjil 2026/2027', score: 92, predicate: 'Sangat Baik (A)' },
              { subject: 'Bahasa Inggris', semester: 'Ganjil 2026/2027', score: 86, predicate: 'Baik (B)' },
              { subject: 'PAI & Al-Qur\'an', semester: 'Ganjil 2026/2027', score: 95, predicate: 'Sangat Baik (A)' },
            ],
          },
          allowances: {
            create: [
              { date: '2026-08-28', income: 150000, expense: 0, description: 'Uang Saku Mingguan Orang Tua' },
              { date: '2026-08-29', income: 0, expense: 250000, description: 'Buku & Kitab Koperasi' },
            ],
          },
        },
      });
    }

    // 5. Academic Information / Announcements
    await prisma.academicInformation.createMany({
      data: [
        {
          title: 'Jadwal Ujian Tengah Semester (UTS) Ganjil 2026/2027',
          category: 'Akademik',
          description: 'UTS Ganjil akan dilaksanakan mulai tanggal 15 September 2026. Seluruh siswa diharapkan melunasi SPP s.d bulan Agustus.',
          date: '2026-08-28',
        },
        {
          title: 'Pendaftaran Ekstrakurikuler Wajib & Pilihan Tahun 2026',
          category: 'Kegiatan',
          description: 'Pendaftaran ekstrakurikuler Pramuka, PMR, Paskibra, Robotik, dan Futsal dibuka s.d 5 September 2026.',
          date: '2026-08-27',
        },
      ],
    });

    return NextResponse.json({
      message: 'Database berhasil di-reset dengan data lengkap (Admin, Guru, Staff, Orang Tua, Siswa, SPP, Nilai & Presensi)!',
      status: 'success',
    });
  } catch (error: any) {
    console.error('Seeding API Error:', error);
    return NextResponse.json({ message: error.message || 'Gagal seeding database' }, { status: 500 });
  }
}
