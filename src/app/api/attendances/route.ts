import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');
  const date = searchParams.get('date');

  const where: any = {};
  if (studentId) where.studentId = Number(studentId);
  if (date) where.date = date;

  const attendances = await prisma.attendance.findMany({
    where,
    include: { student: true },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(attendances);
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Check if batch payload
    if (body.items && Array.isArray(body.items)) {
      const { date, items } = body;
      if (!date) {
        return NextResponse.json({ message: 'Tanggal presensi wajib diisi.' }, { status: 400 });
      }

      const results = [];
      for (const item of items) {
        const studentId = Number(item.student_id);
        const status = item.status || 'Hadir';

        const existing = await prisma.attendance.findFirst({
          where: { studentId, date },
        });

        if (existing) {
          const updated = await prisma.attendance.update({
            where: { id: existing.id },
            data: { status },
          });
          results.push(updated);
        } else {
          const created = await prisma.attendance.create({
            data: { studentId, date, status },
          });
          results.push(created);
        }
      }

      return NextResponse.json({
        message: `Berhasil menyimpan presensi ${results.length} siswa`,
        records: results,
      });
    }

    // Single payload
    const { student_id, date, status } = body;
    const studentId = Number(student_id);

    const existing = await prisma.attendance.findFirst({
      where: { studentId, date },
    });

    let attendance;
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status },
        include: { student: true },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: { studentId, date, status },
        include: { student: true },
      });
    }

    return NextResponse.json({
      message: 'Absensi berhasil dicatat',
      attendance,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal merubah absensi' }, { status: 500 });
  }
}
