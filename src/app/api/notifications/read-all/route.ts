import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    await prisma.notificationRecipient.updateMany({
      where: {
        userId: auth.id,
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Semua notifikasi telah ditandai dibaca' });
  } catch (error: any) {
    console.error('[POST /api/notifications/read-all] Error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal menandai semua notifikasi' },
      { status: 500 }
    );
  }
}
