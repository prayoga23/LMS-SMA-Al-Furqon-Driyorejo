import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { token, platform = 'WEB', deviceName, browser, appVersion } = body;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json({ message: 'FCM Token wajib diisi' }, { status: 400 });
    }

    const validPlatform = ['WEB', 'ANDROID'].includes(platform) ? platform : 'WEB';

    // Upsert user device using unique fcmToken
    const device = await prisma.userDevice.upsert({
      where: { fcmToken: token.trim() },
      update: {
        userId: auth.id,
        platform: validPlatform,
        deviceName: deviceName || null,
        browser: browser || null,
        appVersion: appVersion || null,
        isActive: true,
        lastSeenAt: new Date(),
      },
      create: {
        userId: auth.id,
        fcmToken: token.trim(),
        platform: validPlatform,
        deviceName: deviceName || null,
        browser: browser || null,
        appVersion: appVersion || null,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Perangkat berhasil terdaftar',
      device,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[POST /api/notifications/device] Error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal mendaftarkan perangkat' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ message: 'FCM Token wajib diisi' }, { status: 400 });
    }

    // Deactivate device token owned by authenticated user
    await prisma.userDevice.updateMany({
      where: {
        fcmToken: token.trim(),
        userId: auth.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ message: 'Perangkat berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('[DELETE /api/notifications/device] Error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal menonaktifkan perangkat' },
      { status: 500 }
    );
  }
}
