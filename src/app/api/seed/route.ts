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

    // 2. Guru & Pimpinan Sekolah (Struktur Organisasi TP 2026/2027)
    const officialTeachers = [
      { nip: '196003151985031001', name: 'KH. Mashuri Abdurrohim', subject: 'Pendiri - Pengasuh PP. Al-Furqon', email: 'kh.mashuri@alfurqon.sch.id', phone: '081230010001', role: 'admin' },
      { nip: '196508201990032001', name: 'Ny. Hj. Dian Puspasari Mashuri', subject: 'Wakil Pengasuh PP. Al-Furqon', email: 'dian.puspasari@alfurqon.sch.id', phone: '081230010002', role: 'admin' },
      { nip: '198604122011011001', name: 'Gus Reva Mashuri, M.Pd.', subject: 'Ketua Yayasan PP. Al-Furqon', email: 'gus.reva@alfurqon.sch.id', phone: '081230010003', role: 'admin' },
      { nip: '197509182000121002', name: 'Suryanto, S.Pd., M.Pd.', subject: 'Kepala Sekolah', email: 'suryanto@sekolah.sch.id', phone: '081234567001', role: 'guru' },
      { nip: '198206142006042003', name: 'Siti Alfiyatus Sa\'diyah, S.Pd.', subject: 'Kepala TU / Bendahara SMA Al-Furqon', email: 'siti.alfiyatus@sekolah.sch.id', phone: '081234567002', role: 'staff' },
      { nip: '198411052009022004', name: 'Triana Dewitasari, S.Pd.', subject: 'Waka Kurikulum / Wali Kelas XII-3', email: 'triana.dewitasari@sekolah.sch.id', phone: '081234567003', role: 'guru' },
      { nip: '198007222005011005', name: 'Suherman, S.Pd., M.Pd.', subject: 'Waka Kesiswaan SMA Al-Furqon', email: 'suherman@sekolah.sch.id', phone: '081234567004', role: 'guru' },
      { nip: '198302192010011006', name: 'Masyhudan, ST.', subject: 'Waka Humas SMA Al-Furqon', email: 'masyhudan@sekolah.sch.id', phone: '081234567005', role: 'guru' },
      { nip: '198810282014032007', name: 'Fita Islmiah, S.Pd.', subject: 'Waka Bina Prestasi / Wali Kelas XII-1', email: 'fita.islmiah@sekolah.sch.id', phone: '081234567006', role: 'guru' },
      { nip: '199105152018012008', name: 'Khoirum Umala, S.Pd.', subject: 'Wali Kelas X-1', email: 'khoirum.umala@sekolah.sch.id', phone: '081234567007', role: 'guru' },
      { nip: '198903102015021009', name: 'Sugeng Utomo, S.Pd.', subject: 'Wali Kelas X-2', email: 'sugeng.utomo@sekolah.sch.id', phone: '081234567008', role: 'guru' },
      { nip: '199008242016042010', name: 'Dian Purwanti, S.Pd.', subject: 'Wali Kelas XI-1', email: 'dian.purwanti@sekolah.sch.id', phone: '081234567009', role: 'guru' },
      { nip: '199212032019032011', name: 'Nurul Idhomah, S.Pd.', subject: 'Wali Kelas XI-2', email: 'nurul.idhomah@sekolah.sch.id', phone: '081234567010', role: 'guru' },
      { nip: '198709142012011012', name: 'M. Mas\'ud Yunus, S.Pd.', subject: 'Wali Kelas XII-2', email: 'masud.yunus@sekolah.sch.id', phone: '081234567011', role: 'guru' },
    ];

    // Akun demo guru umum
    await prisma.user.create({
      data: {
        name: 'Drs. H. Ahmad Wijaya, M.Pd',
        email: 'guru@sekolah.sch.id',
        password: defaultPassword,
        role: 'guru',
      },
    });

    await prisma.teacher.create({
      data: {
        nip: '197805122005011002',
        name: 'Drs. H. Ahmad Wijaya, M.Pd',
        email: 'guru@sekolah.sch.id',
        subject: 'Matematika Terapan',
        phone: '081234567891',
        status: 'Aktif',
      },
    });

    for (const item of officialTeachers) {
      await prisma.user.create({
        data: {
          name: item.name,
          email: item.email,
          password: defaultPassword,
          role: item.role,
        },
      });

      const teacher = await prisma.teacher.create({
        data: {
          nip: item.nip,
          name: item.name,
          email: item.email,
          subject: item.subject,
          phone: item.phone,
          status: 'Aktif',
        },
      });

      // Sample presensi hadir
      await prisma.teacherAttendance.create({
        data: {
          teacherId: teacher.id,
          date: new Date().toISOString().split('T')[0],
          status: 'Hadir',
          notes: 'Hadir tepat waktu di sekolah',
        },
      });
    }

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
