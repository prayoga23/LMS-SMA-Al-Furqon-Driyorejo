import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

async function findOrCreateTeacher(auth: { id: number; email: string; role: string; teacherId?: number | null }) {
  // 1. Check by teacherId if available
  if (auth.teacherId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: auth.teacherId } });
    if (teacher) return teacher;
  }

  // 2. Fetch user to get name and email
  const user = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!user) return null;

  // 3. Search by email or name
  let teacher = await prisma.teacher.findFirst({
    where: {
      OR: [
        { email: user.email },
        { name: user.name },
      ],
    },
  });

  if (teacher) return teacher;

  // 4. If user role is 'guru', auto-create teacher profile so they can presensi
  if (user.role === 'guru') {
    const nip = `GURU-${String(user.id).padStart(4, '0')}`;
    teacher = await prisma.teacher.create({
      data: {
        nip,
        name: user.name,
        email: user.email,
        subject: 'Mata Pelajaran',
        status: 'Aktif',
      },
    });
    return teacher;
  }

  return null;
}

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const teacher = await findOrCreateTeacher(auth);
    if (!teacher) {
      return NextResponse.json(
        { message: 'Data guru belum terhubung dengan akun Anda. Silakan hubungi Admin.' },
        { status: 404 }
      );
    }

    // Today date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Today's attendance
    const todayAttendance = await prisma.teacherAttendance.findFirst({
      where: {
        teacherId: teacher.id,
        date: today,
      },
    });

    // All attendance history
    const history = await prisma.teacherAttendance.findMany({
      where: {
        teacherId: teacher.id,
      },
      orderBy: { date: 'desc' },
    });

    // Compute stats
    const totalHadir = history.filter((h: { status: string }) => h.status === 'Hadir').length;
    const totalSakit = history.filter((h: { status: string }) => h.status === 'Sakit').length;
    const totalIzin = history.filter((h: { status: string }) => h.status === 'Izin').length;
    const totalAlpha = history.filter((h: { status: string }) => h.status === 'Alpha').length;
    const totalHari = history.length;
    const percentage = totalHari > 0 ? Math.round((totalHadir / totalHari) * 100) : 100;

    // QR Payload for Teacher to show Guru Piket
    const qrPayload = JSON.stringify({
      type: 'ALFURQON_TEACHER_QR',
      teacherId: teacher.id,
      nip: teacher.nip,
      name: teacher.name,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      teacher,
      todayDate: today,
      todayAttendance,
      qrPayload,
      history,
      stats: {
        totalHadir,
        totalSakit,
        totalIzin,
        totalAlpha,
        totalHari,
        percentage,
      },
    });
  } catch (error: any) {
    console.error('Error GET /api/teachers/my-attendance:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal memuat presensi guru' },
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
    const body = await req.json();

    // Check if body contains kioskToken (Guru scans school kiosk QR)
    if (body.kioskToken) {
      let parsed: any = null;
      try {
        parsed = typeof body.kioskToken === 'string' ? JSON.parse(body.kioskToken) : body.kioskToken;
      } catch {
        parsed = null;
      }

      const today = new Date().toISOString().split('T')[0];
      if (!parsed || parsed.type !== 'ALFURQON_PIKET_KIOSK' || parsed.date !== today) {
        return NextResponse.json(
          { message: 'QR Code Pos Piket tidak valid atau tanggal tidak sesuai hari ini.' },
          { status: 400 }
        );
      }

      const teacher = await findOrCreateTeacher(auth);
      if (!teacher) {
        return NextResponse.json(
          { message: 'Data guru tidak ditemukan untuk akun ini.' },
          { status: 404 }
        );
      }

      const existing = await prisma.teacherAttendance.findFirst({
        where: { teacherId: teacher.id, date: today },
      });

      if (existing && existing.status === 'Hadir') {
        return NextResponse.json({
          message: 'Anda sudah tercatat Hadir hari ini.',
          attendance: existing,
        });
      }

      let record;
      if (existing) {
        record = await prisma.teacherAttendance.update({
          where: { id: existing.id },
          data: {
            status: 'Hadir',
            notes: 'Presensi via Scan Layar Pos Piket',
          },
        });
      } else {
        record = await prisma.teacherAttendance.create({
          data: {
            teacherId: teacher.id,
            date: today,
            status: 'Hadir',
            notes: 'Presensi via Scan Layar Pos Piket',
          },
        });
      }

      return NextResponse.json({
        message: 'Presensi Hadir di Pos Piket berhasil dicatat!',
        attendance: record,
      });
    }

    // Direct manual self-attendance is disallowed
    return NextResponse.json(
      {
        message:
          'Presensi mandiri langsung telah dinonaktifkan. Anda diwajibkan melakukan presensi saat tiba di sekolah melalui Scan QR di Pos Piket Sekolah atau melalui Guru Piket.',
      },
      { status: 403 }
    );
  } catch (error: any) {
    console.error('Error POST /api/teachers/my-attendance:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal menyimpan presensi guru' },
      { status: 500 }
    );
  }
}
