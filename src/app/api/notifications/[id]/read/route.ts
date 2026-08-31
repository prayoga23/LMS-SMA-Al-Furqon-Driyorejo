import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const notificationId = Number(resolvedParams.id);
    if (!notificationId || isNaN(notificationId)) {
      return NextResponse.json({ message: 'ID notifikasi tidak valid' }, { status: 400 });
    }

    await prisma.notificationRecipient.updateMany({
      where: {
        notificationId,
        userId: auth.id,
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Notifikasi ditandai telah dibaca' });
  } catch (error: any) {
    console.error('[PATCH /api/notifications/[id]/read] Error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal merubah status notifikasi' },
      { status: 500 }
    );
  }
}
