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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const mode = searchParams.get('mode');

    // Piket Mode: Return all active teachers merged with their attendance for this date
    if (mode === 'piket') {
      const teachers = await prisma.teacher.findMany({
        where: { status: 'Aktif' },
        orderBy: { name: 'asc' },
      });

      const attendances = await prisma.teacherAttendance.findMany({
        where: { date },
        include: { teacher: true },
        orderBy: { createdAt: 'desc' },
      });

      const attendanceMap = new Map();
      attendances.forEach((att) => {
        attendanceMap.set(att.teacherId, att);
      });

      const records = teachers.map((t) => {
        const att = attendanceMap.get(t.id);
        return {
          id: att ? att.id : null,
          teacherId: t.id,
          teacher: t,
          date,
          status: att ? att.status : 'Belum Hadir',
          notes: att ? att.notes : null,
          createdAt: att ? att.createdAt : null,
          isRecorded: !!att,
        };
      });

      const summary = {
        totalTeachers: teachers.length,
        totalHadir: records.filter((r) => r.status === 'Hadir').length,
        totalBelumHadir: records.filter((r) => r.status === 'Belum Hadir').length,
        totalSakit: records.filter((r) => r.status === 'Sakit').length,
        totalIzin: records.filter((r) => r.status === 'Izin').length,
        totalAlpha: records.filter((r) => r.status === 'Alpha').length,
      };

      return NextResponse.json({ date, summary, records });
    }

    // Default / legacy fallback
    const attendances = await prisma.teacherAttendance.findMany({
      where: { date },
      include: { teacher: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(attendances);
  } catch (error: any) {
    console.error('Error in GET /api/teachers/attendance:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal mengambil presensi guru' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized. Hanya Guru Piket, Admin, atau Staff yang berhak.' }, { status: 403 });
  }

  try {
    const body = await req.json();

    // 1. Action: Mark remaining unrecorded teachers as Alpha
    if (body.action === 'mark-remaining-alpha') {
      const date = body.date || new Date().toISOString().split('T')[0];
      const notes = body.notes || 'Ditandai Alpha oleh Guru Piket (tidak hadir hingga jam penutupan)';

      const activeTeachers = await prisma.teacher.findMany({
        where: { status: 'Aktif' },
        select: { id: true },
      });

      const existingAttendances = await prisma.teacherAttendance.findMany({
        where: { date },
        select: { teacherId: true },
      });

      const recordedTeacherIds = new Set(existingAttendances.map((a) => a.teacherId));
      const unrecordedTeachers = activeTeachers.filter((t) => !recordedTeacherIds.has(t.id));

      if (unrecordedTeachers.length === 0) {
        return NextResponse.json({
          message: 'Semua guru sudah memiliki catatan kehadiran hari ini.',
          count: 0,
        });
      }

      const createdList = [];
      for (const t of unrecordedTeachers) {
        const created = await prisma.teacherAttendance.create({
          data: {
            teacherId: t.id,
            date,
            status: 'Alpha',
            notes,
          },
        });
        createdList.push(created);
      }

      return NextResponse.json({
        message: `Berhasil menandai ${createdList.length} guru yang belum hadir sebagai Alpha.`,
        count: createdList.length,
      });
    }

    // 2. Batch array: { date: string, items: Array<{ teacher_id: number, status: string, notes?: string }> }
    if (body.items && Array.isArray(body.items)) {
      const { date, items } = body;
      if (!date) {
        return NextResponse.json({ message: 'Tanggal wajib diisi.' }, { status: 400 });
      }

      const results = [];
      for (const item of items) {
        const teacherId = Number(item.teacher_id);
        const status = item.status || 'Hadir';
        const notes = item.notes || '';

        const existing = await prisma.teacherAttendance.findFirst({
          where: { teacherId, date },
        });

        if (existing) {
          const updated = await prisma.teacherAttendance.update({
            where: { id: existing.id },
            data: { status, notes },
          });
          results.push(updated);
        } else {
          const created = await prisma.teacherAttendance.create({
            data: { teacherId, date, status, notes },
          });
          results.push(created);
        }
      }

      return NextResponse.json({
        message: `Berhasil menyimpan ${results.length} presensi guru`,
        records: results,
      });
    }

    // 3. Single item: { teacher_id, date, status, notes }
    const { teacher_id, date, status, notes } = body;
    if (!teacher_id || !date) {
      return NextResponse.json(
        { message: 'ID Guru dan Tanggal presensi wajib diisi.' },
        { status: 400 }
      );
    }

    const teacherId = Number(teacher_id);
    const existing = await prisma.teacherAttendance.findFirst({
      where: { teacherId, date },
    });

    let record;
    if (existing) {
      record = await prisma.teacherAttendance.update({
        where: { id: existing.id },
        data: {
          status: status || 'Hadir',
          notes: notes !== undefined ? notes : existing.notes,
        },
        include: { teacher: true },
      });
    } else {
      record = await prisma.teacherAttendance.create({
        data: {
          teacherId,
          date,
          status: status || 'Hadir',
          notes: notes || null,
        },
        include: { teacher: true },
      });
    }

    return NextResponse.json({
      message: 'Presensi guru berhasil disimpan',
      attendance: record,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Gagal menyimpan presensi guru' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID presensi wajib diisi.' }, { status: 400 });
    }

    await prisma.teacherAttendance.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: 'Presensi guru berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Gagal menghapus presensi guru' },
      { status: 500 }
    );
  }
}
