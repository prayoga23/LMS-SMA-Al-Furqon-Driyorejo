import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { notificationService, NotificationType } from '@/lib/notification-service';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        recipients: {
          select: {
            id: true,
            userId: true,
            status: true,
            sentAt: true,
            readAt: true,
            user: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const formatted = notifications.map((n) => {
      const totalRecipients = n.recipients.length;
      const sentCount = n.recipients.filter((r) => ['SENT', 'READ'].includes(r.status)).length;
      const readCount = n.recipients.filter((r) => r.status === 'READ').length;
      const failedCount = n.recipients.filter((r) => r.status === 'FAILED').length;

      return {
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type,
        url: n.url,
        imageUrl: n.imageUrl,
        createdAt: n.createdAt,
        authorName: n.author?.name || 'Admin Sekolah',
        totalRecipients,
        sentCount,
        readCount,
        failedCount,
        recipients: n.recipients,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('[GET /api/admin/notifications] Error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal mengambil riwayat notifikasi admin' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json(
      { message: 'Hanya Administrator yang dapat mengirim notifikasi' },
      { status: 403 }
    );
  }

  try {
    const reqBody = await req.json();
    const { title, body, type = 'ANNOUNCEMENT', url, targetType = 'INDIVIDUAL', targetUserId } = reqBody;

    if (!title || title.trim() === '') {
      return NextResponse.json({ message: 'Judul notifikasi wajib diisi' }, { status: 400 });
    }
    if (!body || body.trim() === '') {
      return NextResponse.json({ message: 'Isi notifikasi wajib diisi' }, { status: 400 });
    }

    let targetUserIds: number[] = [];

    if (targetType === 'INDIVIDUAL') {
      if (!targetUserId) {
        return NextResponse.json({ message: 'Pengguna tujuan wajib dipilih' }, { status: 400 });
      }
      targetUserIds = [Number(targetUserId)];
    } else if (targetType === 'ALL_PARENTS') {
      const parents = await prisma.user.findMany({
        where: { role: 'parent' },
        select: { id: true },
      });
      targetUserIds = parents.map((p) => p.id);
    } else if (targetType === 'ALL_TEACHERS') {
      const teachers = await prisma.user.findMany({
        where: { role: 'guru' },
        select: { id: true },
      });
      targetUserIds = teachers.map((t) => t.id);
    } else if (targetType === 'ALL_USERS') {
      const allUsers = await prisma.user.findMany({
        select: { id: true },
      });
      targetUserIds = allUsers.map((u) => u.id);
    } else {
      return NextResponse.json({ message: 'Jenis target tidak valid' }, { status: 400 });
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ message: 'Tidak ada penerima ditemukan untuk target ini' }, { status: 400 });
    }

    const result = await notificationService.sendToUsers({
      userIds: targetUserIds,
      title: title.trim(),
      body: body.trim(),
      type: type as NotificationType,
      url: url || '/parent/notifications',
      createdBy: auth.id,
    });

    return NextResponse.json({
      message: 'Notifikasi berhasil dikirim',
      result,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/admin/notifications] Error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal mengirim notifikasi' },
      { status: 500 }
    );
  }
}
