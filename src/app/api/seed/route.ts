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

    // 1b. Guru User
    await prisma.user.create({
      data: {
        name: 'Drs. H. Ahmad Wijaya, M.Pd',
        email: 'guru@sekolah.sch.id',
        password: defaultPassword,
        role: 'guru',
      },
    });

    // 1c. Staff User
    await prisma.user.create({
      data: {
        name: 'Siti Rahmawati, S.Kom',
        email: 'staff@sekolah.sch.id',
        password: defaultPassword,
        role: 'staff',
      },
    });

    // 2. Parent 1 & Student 1
    const parentUser1 = await prisma.user.create({
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

    const student1 = await prisma.student.create({
      data: {
        parentId: parentUser1.parent!.id,
        nis: '20241001',
        name: 'Ahmad Rizky Santoso',
        class: 'X IPA 1',
        major: 'IPA (MIPA)',
        entryYear: 2024,
        isSantri: true,
        residenceType: 'Asrama',
        sppNominal: 750000,
        activityNominal: 200000,
        hasDiscount: false,
      },
    });

    // 3. Parent 2 & Student 2
    const parentUser2 = await prisma.user.create({
      data: {
        name: 'Siti Aminah',
        email: 'orangtua2@sekolah.sch.id',
        password: defaultPassword,
        role: 'parent',
        parent: {
          create: {
            phone: '082198765432',
          },
        },
      },
      include: { parent: true },
    });

    const student2 = await prisma.student.create({
      data: {
        parentId: parentUser2.parent!.id,
        nis: '20231045',
        name: 'Dewi Lestari (Keringanan Santri)',
        class: 'XI IPS 1',
        major: 'IPS',
        entryYear: 2023,
        isSantri: true,
        residenceType: 'Asrama',
        sppNominal: 400000,
        activityNominal: 100000,
        hasDiscount: true,
        discountNotes: 'Pengajuan Keringanan Santri Yatim / Ekonomi',
      },
    });

    // 4. Parent 3 & Student 3
    const parentUser3 = await prisma.user.create({
      data: {
        name: 'Hendra Pratama',
        email: 'orangtua3@sekolah.sch.id',
        password: defaultPassword,
        role: 'parent',
        parent: {
          create: {
            phone: '085711223344',
          },
        },
      },
      include: { parent: true },
    });

    const student3 = await prisma.student.create({
      data: {
        parentId: parentUser3.parent!.id,
        nis: '20241012',
        name: 'Fajar Pratama',
        class: 'X IPA 1',
        major: 'IPA (MIPA)',
        entryYear: 2024,
        isSantri: false,
        residenceType: 'Non-Asrama',
        sppNominal: 500000,
        activityNominal: 150000,
        hasDiscount: false,
      },
    });

    // Seed SPP & Payments
    await prisma.payment.createMany({
      data: [
        {
          studentId: student1.id,
          category: 'SPP',
          destination: 'Yayasan Pondok Pesantren Al-Furqon',
          title: 'SPP Bulanan / Semester 1',
          semester: 'Semester 1',
          academicYear: '2024/2025',
          amount: 750000,
          status: 'Lunas',
          notes: 'Disalurkan ke Yayasan Pondok Pesantren Al-Furqon',
        },
        {
          studentId: student1.id,
          category: 'Kegiatan',
          destination: 'Sekolah (SMA Al-Furqon)',
          title: 'Anggaran Kegiatan Pembelajaran & Ekstrakurikuler',
          semester: 'Semester 1',
          academicYear: '2024/2025',
          amount: 200000,
          status: 'Lunas',
          notes: 'Disalurkan ke Rekening Sekolah (SMA Al-Furqon)',
        },
        {
          studentId: student1.id,
          category: 'SPP',
          destination: 'Yayasan Pondok Pesantren Al-Furqon',
          title: 'SPP Bulanan / Semester 2',
          semester: 'Semester 2',
          academicYear: '2024/2025',
          amount: 750000,
          status: 'Belum Lunas',
          notes: 'Tagihan SPP Semester 2 ke Yayasan',
        },
        {
          studentId: student2.id,
          category: 'SPP',
          destination: 'Yayasan Pondok Pesantren Al-Furqon',
          title: 'SPP Bulanan (Tarif Khusus Keringanan)',
          semester: 'Semester 1',
          academicYear: '2024/2025',
          amount: 400000,
          status: 'Lunas',
          notes: 'Disetujui Keringanan SPP Yayasan Al-Furqon',
        },
        {
          studentId: student2.id,
          category: 'Kegiatan',
          destination: 'Sekolah (SMA Al-Furqon)',
          title: 'Anggaran Kegiatan Sekolah (Keringanan)',
          semester: 'Semester 1',
          academicYear: '2024/2025',
          amount: 100000,
          status: 'Belum Lunas',
          notes: 'Tagihan Anggaran Kegiatan Sekolah',
        },
        {
          studentId: student3.id,
          category: 'SPP',
          destination: 'Yayasan Pondok Pesantren Al-Furqon',
          title: 'SPP Bulanan Siswa Reguler',
          semester: 'Semester 1',
          academicYear: '2024/2025',
          amount: 500000,
          status: 'Lunas',
          notes: 'Setoran SPP Yayasan Al-Furqon',
        },
        {
          studentId: student3.id,
          category: 'Kegiatan',
          destination: 'Sekolah (SMA Al-Furqon)',
          title: 'Anggaran Kegiatan & Praktikum Sekolah',
          semester: 'Semester 1',
          academicYear: '2024/2025',
          amount: 150000,
          status: 'Lunas',
          notes: 'Setoran Kegiatan ke Sekolah',
        },
      ],
    });

    // Helper date generator
    const getSubDays = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    const getAddDays = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    // Seed Attendance
    const statuses = [
      'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir',
      'Hadir', 'Sakit', 'Hadir', 'Hadir', 'Izin',
      'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir',
    ];

    for (let i = 0; i < statuses.length; i++) {
      const dateStr = getSubDays(15 - i);
      await prisma.attendance.create({
        data: {
          studentId: student1.id,
          date: dateStr,
          status: statuses[i],
        },
      });
      await prisma.attendance.create({
        data: {
          studentId: student2.id,
          date: dateStr,
          status: 'Hadir',
        },
      });
      await prisma.attendance.create({
        data: {
          studentId: student3.id,
          date: dateStr,
          status: i === 3 ? 'Alpha' : 'Hadir',
        },
      });
    }

    // Seed Grades
    const gradesData = [
      { subject: 'Pemrograman Web & Perangkat Bergerak', score: 92, predicate: 'A' },
      { subject: 'Basis Data & SQL', score: 88, predicate: 'A' },
      { subject: 'Matematika Terapan', score: 84, predicate: 'B' },
      { subject: 'Bahasa Inggris Industri', score: 90, predicate: 'A' },
      { subject: 'Bahasa Indonesia', score: 86, predicate: 'A' },
      { subject: 'Pendidikan Pancasila', score: 80, predicate: 'B' },
      { subject: 'Fisika Komputasi', score: 78, predicate: 'B' },
    ];

    for (const g of gradesData) {
      await prisma.grade.create({
        data: {
          studentId: student1.id,
          subject: g.subject,
          semester: 'Semester 1',
          score: g.score,
          predicate: g.predicate,
        },
      });
    }

    // Seed Allowances
    await prisma.allowance.createMany({
      data: [
        {
          studentId: student1.id,
          date: getSubDays(5),
          income: 150000,
          expense: 0,
          description: 'Transfer Uang Saku Mingguan dari Orang Tua',
        },
        {
          studentId: student1.id,
          date: getSubDays(4),
          income: 0,
          expense: 25000,
          description: 'Makan Siang & Minum di Kantin Sekolah',
        },
        {
          studentId: student1.id,
          date: getSubDays(3),
          income: 0,
          expense: 35000,
          description: 'Pembelian Buku Catatan & Alat Tulis',
        },
        {
          studentId: student1.id,
          date: getSubDays(1),
          income: 50000,
          expense: 0,
          description: 'Bonus Nilai Ujian Kuis Koding',
        },
        {
          studentId: student1.id,
          date: getSubDays(0),
          income: 0,
          expense: 20000,
          description: 'Top Up Saldo E-Money Kartu Bus Sekolah',
        },
      ],
    });

    // Seed Academic Info
    await prisma.academicInformation.createMany({
      data: [
        {
          title: 'Jadwal Pelajaran Kelas X IPA 1 Semester Genap 2024/2025',
          category: 'Jadwal Pelajaran',
          description:
            'Senin: Biologi & Fisika (07.00-10.00), B. Indo (10.15-12.00)\nSelasa: Kimia & Matematika (07.00-10.00), B. Inggris (10.15-12.00)\nRabu: Matematika Peminatan (07.00-09.30), PJOK (09.45-12.00)\nKamis: Fisika (07.00-09.30), PKN (09.45-12.00)\nJumat: Agama & Pembinaan Karakter (07.00-11.00)',
          date: getSubDays(10),
        },
        {
          title: 'Penilaian Tengah Semester (PTS) Genap 2024/2025',
          category: 'Jadwal Ujian',
          description:
            'Ujian Tengah Semester (PTS) akan dilaksanakan secara serentak menggunakan CBT (Computer Based Test) mulai tanggal 15 Maret 2025 s/d 22 Maret 2025. Harap persiapkan diri dengan baik.',
          date: getAddDays(14),
        },
        {
          title: 'Juara 1 Lomba Karya Ilmiah Remaja (KIR) Tingkat Provinsi',
          category: 'Prestasi',
          description:
            'Selamat kepada Ahmad Rizky Santoso (Kelas X IPA 1) atas perolehan Medali Emas Juara 1 Lomba Karya Ilmiah Remaja (KIR) SMA 2025.',
          date: getSubDays(3),
        },
        {
          title: 'Peringatan Hari Pendidikan Nasional & Pentas Seni',
          category: 'Kegiatan',
          description:
            'Kegiatan pentas seni siswa dan bazaar kewirausahaan SMA AL - FURQON DRIYOREJO akan diselenggarakan pada halaman utama sekolah.',
          date: getAddDays(20),
        },
        {
          title: 'Pengumuman Libur Awal Ramadhan 1446 H',
          category: 'Pengumuman',
          description:
            'Diberitahukan kepada seluruh siswa dan bapak/ibu wali murid bahwa kegiatan belajar mengajar diliburkan pada awal Ramadhan selama 3 hari.',
          date: getSubDays(1),
        },
      ],
    });

    // Seed Teachers
    const teacher1 = await prisma.teacher.create({
      data: {
        nip: '197805122005011002',
        name: 'Drs. H. Ahmad Wijaya, M.Pd',
        subject: 'Matematika Terapan',
        phone: '081234567891',
        email: 'guru@sekolah.sch.id',
        status: 'Aktif',
      },
    });

    const teacher2 = await prisma.teacher.create({
      data: {
        nip: '198503202010012005',
        name: 'Siti Nurhaliza, S.ST, M.T',
        subject: 'Pemrograman Web & Perangkat Bergerak',
        phone: '081398765432',
        email: 'siti.nurhaliza@sekolah.sch.id',
        status: 'Aktif',
      },
    });

    const teacher3 = await prisma.teacher.create({
      data: {
        nip: '199011152018011003',
        name: 'Bambang Supriyadi, S.Kom',
        subject: 'Teknik Komputer & Jaringan',
        phone: '085712344321',
        email: 'bambang.s@sekolah.sch.id',
        status: 'Aktif',
      },
    });

    const teacher4 = await prisma.teacher.create({
      data: {
        nip: '199208042020022008',
        name: 'Rina Kartika, S.Pd',
        subject: 'Bahasa Inggris Industri',
        phone: '082155443322',
        email: 'rina.k@sekolah.sch.id',
        status: 'Aktif',
      },
    });

    // Seed Teacher Attendance
    for (let i = 0; i < 5; i++) {
      const d = getSubDays(i);
      await prisma.teacherAttendance.createMany({
        data: [
          { teacherId: teacher1.id, date: d, status: 'Hadir', notes: 'Mengajar jam ke 1-4' },
          { teacherId: teacher2.id, date: d, status: i === 2 ? 'Izin' : 'Hadir', notes: i === 2 ? 'Tugas Luar Sekolah' : 'Mengajar jam ke 3-6' },
          { teacherId: teacher3.id, date: d, status: 'Hadir', notes: 'Praktikum Lab TKJ' },
          { teacherId: teacher4.id, date: d, status: i === 4 ? 'Sakit' : 'Hadir', notes: i === 4 ? 'Surat Dokter' : 'Mengajar Bahasa Inggris' },
        ],
      });
    }

    return NextResponse.json({
      message: 'Database berhasil di-seed dengan data awal!',
      status: 'success',
    });
  } catch (error: any) {
    console.error('Seeding API Error:', error);
    return NextResponse.json({ message: error.message || 'Gagal seeding database' }, { status: 500 });
  }
}
