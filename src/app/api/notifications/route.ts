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
    const limit = Number(searchParams.get('limit')) || 20;

    const recipients = await prisma.notificationRecipient.findMany({
      where: {
        userId: auth.id,
      },
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

    const unreadCount = await prisma.notificationRecipient.count({
      where: {
        userId: auth.id,
        status: { not: 'READ' },
      },
    });

    const formattedNotifications = recipients.map((r) => ({
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
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
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
