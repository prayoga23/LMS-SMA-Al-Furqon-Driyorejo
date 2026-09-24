import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated. Silakan login terlebih dahulu.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { qrData, date: customDate } = body;

    if (!qrData || typeof qrData !== 'string') {
      return NextResponse.json(
        { message: 'Data QR Code tidak valid atau kosong.' },
        { status: 400 }
      );
    }

    const today = customDate || new Date().toISOString().split('T')[0];

    // Try to parse QR data
    let parsed: any = null;
    try {
      parsed = JSON.parse(qrData);
    } catch {
      parsed = null;
    }

    // ─── CASE A: TEACHER SCANS KIOSK DISPLAY (ROLE: GURU) ──────────
    if (parsed && parsed.type === 'ALFURQON_PIKET_KIOSK') {
      if (auth.role !== 'guru') {
        return NextResponse.json(
          { message: 'QR Kiosk Pos Piket ini ditujukan untuk di-scan oleh akun Guru.' },
          { status: 400 }
        );
      }

      if (parsed.date !== today) {
        return NextResponse.json(
          { message: 'QR Code Kiosk pos piket sudah kadaluarsa (berbeda tanggal).' },
          { status: 400 }
        );
      }

      // Find teacher profile for this user
      const user = await prisma.user.findUnique({ where: { id: auth.id } });
      if (!user) {
        return NextResponse.json({ message: 'Data akun tidak ditemukan.' }, { status: 404 });
      }

      const teacher = await prisma.teacher.findFirst({
        where: {
          OR: [
            { email: user.email },
            { name: user.name },
          ],
        },
      });

      if (!teacher) {
        return NextResponse.json(
          { message: 'Data guru belum terhubung dengan akun Anda. Hubungi Admin.' },
          { status: 404 }
        );
      }

      const existing = await prisma.teacherAttendance.findFirst({
        where: { teacherId: teacher.id, date: today },
      });

      if (existing && existing.status === 'Hadir') {
        const checkTime = new Date(existing.createdAt).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        return NextResponse.json({
          success: true,
          alreadyHadir: true,
          teacher,
          attendance: existing,
          message: `Anda sudah tercatat Hadir hari ini pukul ${checkTime} WIB.`,
        });
      }

      let attendance;
      if (existing) {
        attendance = await prisma.teacherAttendance.update({
          where: { id: existing.id },
          data: {
            status: 'Hadir',
            notes: 'Presensi via Scan Layar QR Pos Piket',
          },
          include: { teacher: true },
        });
      } else {
        attendance = await prisma.teacherAttendance.create({
          data: {
            teacherId: teacher.id,
            date: today,
            status: 'Hadir',
            notes: 'Presensi via Scan Layar QR Pos Piket',
          },
          include: { teacher: true },
        });
      }

      return NextResponse.json({
        success: true,
        alreadyHadir: false,
        teacher,
        attendance,
        message: `Presensi berhasil! Selamat bertugas, Bpk/Ibu ${teacher.name}.`,
      });
    }

    // ─── CASE B: GURU PIKET SCANS TEACHER QR (ROLE: ADMIN / STAFF) ──
    if (!['admin', 'staff'].includes(auth.role)) {
      return NextResponse.json(
        { message: 'Hanya Guru Piket atau Admin/Staff yang dapat memindai QR Code guru.' },
        { status: 403 }
      );
    }

    let targetTeacherId: number | null = null;
    let targetNip: string | null = null;

    if (parsed) {
      if (parsed.teacherId) targetTeacherId = Number(parsed.teacherId);
      if (parsed.nip) targetNip = String(parsed.nip).trim();
    } else {
      // Raw string format, e.g., "NIP:GURU-0028" or "GURU-0028" or "ID:15"
      const trimmed = qrData.trim();
      if (trimmed.startsWith('NIP:')) {
        targetNip = trimmed.replace('NIP:', '').trim();
      } else if (trimmed.startsWith('ID:') || trimmed.startsWith('TEACHER:')) {
        targetTeacherId = Number(trimmed.split(':')[1]);
      } else if (/^\d+$/.test(trimmed)) {
        targetTeacherId = Number(trimmed);
      } else {
        targetNip = trimmed;
      }
    }

    // Find teacher
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          ...(targetTeacherId ? [{ id: targetTeacherId }] : []),
          ...(targetNip ? [{ nip: targetNip }] : []),
        ],
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Data Guru tidak ditemukan dalam sistem sekolah.' },
        { status: 404 }
      );
    }

    if (teacher.status !== 'Aktif') {
      return NextResponse.json(
        { message: `Guru ${teacher.name} berstatus "${teacher.status}" (Non-Aktif).` },
        { status: 400 }
      );
    }

    // Check existing attendance for today
    const existing = await prisma.teacherAttendance.findFirst({
      where: { teacherId: teacher.id, date: today },
    });

    if (existing && existing.status === 'Hadir') {
      const checkTime = new Date(existing.createdAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return NextResponse.json({
        success: true,
        alreadyHadir: true,
        teacher,
        attendance: existing,
        message: `Bpk/Ibu ${teacher.name} (${teacher.nip}) sudah tercatat Hadir hari ini pukul ${checkTime} WIB.`,
      });
    }

    let attendance;
    if (existing) {
      attendance = await prisma.teacherAttendance.update({
        where: { id: existing.id },
        data: {
          status: 'Hadir',
          notes: 'Presensi via Scan QR di Meja Piket Sekolah',
        },
        include: { teacher: true },
      });
    } else {
      attendance = await prisma.teacherAttendance.create({
        data: {
          teacherId: teacher.id,
          date: today,
          status: 'Hadir',
          notes: 'Presensi via Scan QR di Meja Piket Sekolah',
        },
        include: { teacher: true },
      });
    }

    return NextResponse.json({
      success: true,
      alreadyHadir: false,
      teacher,
      attendance,
      message: `Presensi Berhasil: ${teacher.name} (${teacher.nip}) tercatat HADIR di pos piket.`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/teachers/attendance/scan:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal memproses scan QR presensi guru' },
      { status: 500 }
    );
  }
}
