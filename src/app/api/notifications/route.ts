import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 50;
    const filter = searchParams.get('filter') || 'ALL'; // 'ALL', 'IMPORTANT', 'UNREAD', 'ATTENDANCE', 'GRADE', 'SPP', 'ANNOUNCEMENT'

    const where: any = {
      userId: auth.id,
    };

    if (filter === 'UNREAD') {
      where.status = { not: 'READ' };
    } else if (filter === 'IMPORTANT') {
      where.notification = {
        type: { in: ['GRADE', 'SPP', 'PAYMENT', 'ATTENDANCE', 'ANNOUNCEMENT'] },
      };
    } else if (filter === 'ATTENDANCE') {
      where.notification = { type: 'ATTENDANCE' };
    } else if (filter === 'GRADE') {
      where.notification = { type: 'GRADE' };
    } else if (filter === 'SPP') {
      where.notification = { type: { in: ['SPP', 'PAYMENT'] } };
    } else if (filter === 'ANNOUNCEMENT') {
      where.notification = { type: 'ANNOUNCEMENT' };
    }

    const recipients = await prisma.notificationRecipient.findMany({
      where,
      include: {
        notification: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        notification: {
          createdAt: 'desc',
        },
      },
      take: limit,
    });

    // Counts for UI filters
    const [totalCount, unreadCount, importantCount] = await Promise.all([
      prisma.notificationRecipient.count({
        where: { userId: auth.id },
      }),
      prisma.notificationRecipient.count({
        where: { userId: auth.id, status: { not: 'READ' } },
      }),
      prisma.notificationRecipient.count({
        where: {
          userId: auth.id,
          notification: {
            type: { in: ['GRADE', 'SPP', 'PAYMENT', 'ATTENDANCE', 'ANNOUNCEMENT'] },
          },
        },
      }),
    ]);

    const formattedNotifications = recipients.map((r) => {
      const isImportant = ['GRADE', 'SPP', 'PAYMENT', 'ATTENDANCE', 'ANNOUNCEMENT'].includes(
        r.notification.type
      );

      return {
        id: r.notification.id,
        recipientId: r.id,
        title: r.notification.title,
        body: r.notification.body,
        type: r.notification.type,
        url: r.notification.url,
        imageUrl: r.notification.imageUrl,
        createdAt: r.notification.createdAt,
        status: r.status,
        readAt: r.readAt,
        sentAt: r.sentAt,
        authorName: r.notification.author?.name || 'Sistem Sekolah',
        isImportant,
      };
    });

    return NextResponse.json({
      notifications: formattedNotifications,
      counts: {
        total: totalCount,
        unread: unreadCount,
        important: importantCount,
      },
      unreadCount,
    });
  } catch (error: any) {
    console.error('[GET /api/notifications] Error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal memuat notifikasi' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Seed action to populate notifications for current user or all parents
    if (body.action === 'seed') {
      const now = new Date();
      const parentUser = await prisma.user.findUnique({
        where: { id: auth.id },
        include: { parent: { include: { students: true } } },
      });

      const studentName = parentUser?.parent?.students?.[0]?.name || 'Siswa';
      const studentClass = parentUser?.parent?.students?.[0]?.class || 'X IPA 1';

      const samples = [
        {
          title: `Presensi Masuk Tepat Waktu - ${studentName}`,
          body: `Ananda ${studentName} (${studentClass}) telah melakukan presensi masuk di gerbang sekolah pada pukul 06:45 WIB. Status: Hadir Tepat Waktu.`,
          type: 'ATTENDANCE',
          url: '/parent/attendance',
          timeOffset: 25,
          status: 'PENDING',
        },
        {
          title: 'Nilai Penilaian Harian Matematika Wajib Diterbitkan',
          body: `Nilai ulangan Bab Matriks untuk ${studentName} telah dimasukkan oleh Guru: Nilai 94 (Predikat A - Sangat Baik).`,
          type: 'GRADE',
          url: '/parent/grades',
          timeOffset: 120,
          status: 'PENDING',
        },
        {
          title: 'Pengingat Tagihan SPP Oktober 2026',
          body: `Tagihan SPP Bulan Oktober 2026 sebesar Rp 500.000 atas nama ${studentName} telah diterbitkan. Batas akhir pembayaran adalah 10 Oktober 2026.`,
          type: 'SPP',
          url: '/parent/payments',
          timeOffset: 1440,
          status: 'PENDING',
        },
        {
          title: 'Rapor PTS Semester Ganjil 2026/2027 Telah Terbit',
          body: `Hasil Penilaian Tengah Semester (PTS) Ganjil Tahun Pelajaran 2026/2027 telah dirilis. Silakan unduh e-Rapor dan pantau perkembangan belajar putra/putri Anda.`,
          type: 'GRADE',
          url: '/parent/grades',
          timeOffset: 2880,
          status: 'PENDING',
        },
        {
          title: 'Undangan Rapat Evaluasi Pembelajaran & Silaturahmi Wali Murid',
          body: `Kami mengundang seluruh Bapak/Ibu Wali Murid SMA Al-Furqon Driyorejo dalam Rapat Pertemuan Semester Ganjil pada Sabtu mendatang, pukul 08:30 WIB di Aula Utama.`,
          type: 'ANNOUNCEMENT',
          url: '/parent/academics',
          timeOffset: 4320,
          status: 'PENDING',
        },
        {
          title: 'Pembayaran SPP September 2026 Berhasil Diverifikasi',
          body: `Alhamdulillah, pembayaran SPP September 2026 sebesar Rp 500.000 telah diverifikasi Lunas oleh Bagian Keuangan Yayasan Pondok Pesantren Al-Furqon.`,
          type: 'PAYMENT',
          url: '/parent/payments',
          timeOffset: 7200,
          status: 'READ',
        },
        {
          title: 'Selamat Datang di Portal Wali Siswa SMA Al-Furqon',
          body: `Aplikasi web kini mendukung Web App View (PWA). Anda dapat menambahkan aplikasi ini ke Layar Utama smartphone Anda (Add to Home Screen) untuk akses cepat dan notifikasi realtime.`,
          type: 'SYSTEM',
          url: '/parent/dashboard',
          timeOffset: 10080,
          status: 'READ',
        },
      ];

      for (const item of samples) {
        const createdAt = new Date(now.getTime() - item.timeOffset * 60 * 1000);
        const notif = await prisma.notification.create({
          data: {
            title: item.title,
            body: item.body,
            type: item.type,
            url: item.url,
            createdBy: auth.id,
            createdAt,
          },
        });

        await prisma.notificationRecipient.create({
          data: {
            notificationId: notif.id,
            userId: auth.id,
            status: item.status,
            sentAt: createdAt,
            readAt: item.status === 'READ' ? createdAt : null,
          },
        });
      }

      return NextResponse.json({
        message: 'Berhasil memuat notifikasi contoh untuk web app view!',
      });
    }

    return NextResponse.json({ message: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error: any) {
    console.error('[POST /api/notifications] Error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal memproses aksi notifikasi' },
      { status: 500 }
    );
  }
}
