const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding notifications for Web App View...');

  // Find users
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  const staff = await prisma.user.findFirst({ where: { role: 'staff' } });
  const guru = await prisma.user.findFirst({ where: { role: 'guru' } });
  const parents = await prisma.user.findMany({ where: { role: 'parent' } });

  const adminId = admin ? admin.id : null;
  const staffId = staff ? staff.id : adminId;
  const guruId = guru ? guru.id : adminId;

  if (parents.length === 0) {
    console.log('No parent users found. Skipping parent notifications.');
    return;
  }

  const parentUserIds = parents.map((p) => p.id);
  console.log(`Found ${parents.length} parents:`, parentUserIds);

  const now = new Date();

  // Notification definitions
  const notificationsData = [
    {
      title: 'Presensi Masuk Tepat Waktu - Prayoga Nugroho',
      body: 'Ananda Prayoga Nugroho (X IPA 1) telah melakukan presensi masuk di gerbang sekolah pada pukul 06:45 WIB. Status: Hadir Tepat Waktu.',
      type: 'ATTENDANCE',
      url: '/parent/attendance',
      createdBy: guruId,
      timeOffsetMinutes: 30, // 30 minutes ago
      status: 'PENDING',
      targetUserIds: parentUserIds,
    },
    {
      title: 'Nilai Penilaian Harian Matematika Wajib Diterbitkan',
      body: 'Nilai ulangan Bab Matriks untuk Prayoga Nugroho telah dimasukkan oleh Guru Pengampu: Nilai 94 (Predikat A - Sangat Baik).',
      type: 'GRADE',
      url: '/parent/grades',
      createdBy: guruId,
      timeOffsetMinutes: 180, // 3 hours ago
      status: 'PENDING',
      targetUserIds: parentUserIds,
    },
    {
      title: 'Pengingat Tagihan SPP Oktober 2026',
      body: 'Tagihan SPP Bulan Oktober 2026 sebesar Rp 500.000 atas nama Prayoga Nugroho telah diterbitkan. Batas akhir pembayaran adalah 10 Oktober 2026.',
      type: 'SPP',
      url: '/parent/payments',
      createdBy: staffId,
      timeOffsetMinutes: 1440, // 1 day ago
      status: 'PENDING',
      targetUserIds: parentUserIds,
    },
    {
      title: 'Rapor PTS Semester Ganjil 2026/2027 Telah Terbit',
      body: 'Hasil Penilaian Tengah Semester (PTS) Ganjil Tahun Pelajaran 2026/2027 telah dirilis. Silakan unduh e-Rapor dan pantau perkembangan belajar putra/putri Anda.',
      type: 'GRADE',
      url: '/parent/grades',
      createdBy: adminId,
      timeOffsetMinutes: 2880, // 2 days ago
      status: 'PENDING',
      targetUserIds: parentUserIds,
    },
    {
      title: 'Undangan Rapat Evaluasi Pembelajaran & Silaturahmi Wali Murid',
      body: 'Kami mengundang seluruh Bapak/Ibu Wali Murid SMA Al-Furqon Driyorejo dalam Rapat Pertemuan Semester Ganjil pada Sabtu mendatang, pukul 08:30 WIB di Aula Utama.',
      type: 'ANNOUNCEMENT',
      url: '/parent/academics',
      createdBy: adminId,
      timeOffsetMinutes: 4320, // 3 days ago
      status: 'PENDING',
      targetUserIds: parentUserIds,
    },
    {
      title: 'Pembayaran SPP September 2026 Berhasil Diverifikasi',
      body: 'Alhamdulillah, pembayaran SPP September 2026 sebesar Rp 500.000 telah diverifikasi Lunas oleh Bagian Keuangan Yayasan Pondok Pesantren Al-Furqon.',
      type: 'PAYMENT',
      url: '/parent/payments',
      createdBy: staffId,
      timeOffsetMinutes: 7200, // 5 days ago
      status: 'READ',
      targetUserIds: parentUserIds,
    },
    {
      title: 'Pencatatan Penarikan Uang Saku Santri',
      body: 'Transaksi uang saku santri tercatat: Pengeluaran sebesar Rp 25.000 untuk keperluan pembelian buku catatan & perlengkapan di Koperasi Sekolah.',
      type: 'SYSTEM',
      url: '/parent/allowance',
      createdBy: staffId,
      timeOffsetMinutes: 8640, // 6 days ago
      status: 'READ',
      targetUserIds: parentUserIds,
    },
    {
      title: 'Jadwal & Tata Tertib Ujian Semester Ganjil 2026',
      body: 'Penilaian Akhir Semester (PAS) Ganjil akan dimulai 2 pekan ke depan. Mohon Bapak/Ibu mendampingi dan memotivasi belajar putra/putri di rumah maupun asrama.',
      type: 'ANNOUNCEMENT',
      url: '/parent/academics',
      createdBy: adminId,
      timeOffsetMinutes: 10080, // 7 days ago
      status: 'READ',
      targetUserIds: parentUserIds,
    },
    {
      title: 'Selamat Datang di Portal Wali Siswa SMA Al-Furqon',
      body: 'Aplikasi web kini mendukung Web App View (PWA). Anda dapat menambahkan aplikasi ini ke Layar Utama smartphone Anda (Add to Home Screen) untuk akses cepat dan notifikasi realtime.',
      type: 'SYSTEM',
      url: '/parent/dashboard',
      createdBy: adminId,
      timeOffsetMinutes: 20160, // 14 days ago
      status: 'READ',
      targetUserIds: parentUserIds,
    },
  ];

  // Admin / Staff specific notifications
  if (adminId) {
    notificationsData.push(
      {
        title: 'Laporan Rekapitulasi Presensi Siswa Harian',
        body: 'Rekapitulasi presensi siswa hari ini telah selesai diinput oleh Guru Piket. Tingkat kehadiran rata-rata mencapai 98.4%.',
        type: 'ATTENDANCE',
        url: '/admin/attendance',
        createdBy: adminId,
        timeOffsetMinutes: 60,
        status: 'PENDING',
        targetUserIds: [adminId],
      },
      {
        title: 'Pemberitahuan Sistem: Backup Database Sukses',
        body: 'Proses sinkronisasi dan pencadangan database sistem LMS SMA Al-Furqon Driyorejo telah selesai dijalankan dengan aman.',
        type: 'SYSTEM',
        url: '/admin/dashboard',
        createdBy: adminId,
        timeOffsetMinutes: 720,
        status: 'READ',
        targetUserIds: [adminId],
      }
    );
  }

  // Clear existing if any to avoid exact duplicates
  await prisma.notificationRecipient.deleteMany({});
  await prisma.notification.deleteMany({});
  console.log('Cleared previous notifications.');

  // Create notifications and recipients
  for (const item of notificationsData) {
    const createdAt = new Date(now.getTime() - item.timeOffsetMinutes * 60 * 1000);

    const notification = await prisma.notification.create({
      data: {
        title: item.title,
        body: item.body,
        type: item.type,
        url: item.url,
        createdBy: item.createdBy,
        createdAt,
      },
    });

    const recipientData = item.targetUserIds.map((userId) => ({
      notificationId: notification.id,
      userId,
      status: item.status,
      sentAt: createdAt,
      readAt: item.status === 'READ' ? new Date(createdAt.getTime() + 15 * 60 * 1000) : null,
    }));

    await prisma.notificationRecipient.createMany({
      data: recipientData,
    });
  }

  const totalNotifs = await prisma.notification.count();
  const totalRecipients = await prisma.notificationRecipient.count();
  console.log(`Successfully created ${totalNotifs} notifications with ${totalRecipients} recipients!`);
}

main()
  .catch((e) => {
    console.error('Error seeding notifications:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
