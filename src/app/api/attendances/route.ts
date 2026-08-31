import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';

async function getTeacherSubject(auth: any): Promise<string | null> {
  if (auth.subject) return auth.subject;
  const teacher = await prisma.teacher.findFirst({
    where: {
      OR: [
        { email: auth.email },
        { id: auth.teacherId || 0 },
      ],
    },
  });
  return teacher?.subject || null;
}

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');
  const date = searchParams.get('date');
  const className = searchParams.get('class');
  const subject = searchParams.get('subject');
  const session = searchParams.get('session');

  const where: any = {};
  if (studentId) where.studentId = Number(studentId);
  if (date) where.date = date;
  if (subject) where.subject = subject;
  if (session) where.session = session;
  if (className) {
    where.student = { class: className };
  }

  if (auth.role === 'guru') {
    const teacherSubject = await getTeacherSubject(auth);
    if (teacherSubject) {
      where.subject = teacherSubject;
    }
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: { student: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(attendances);
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    let finalSubject = body.subject || null;
    let finalSession = body.session || null;

    if (auth.role === 'guru') {
      const teacherSubject = await getTeacherSubject(auth);
      if (teacherSubject) {
        finalSubject = teacherSubject;
      }
    }

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
        const itemSubject = finalSubject || item.subject || null;
        const itemSession = finalSession || item.session || null;

        const whereCondition: any = { studentId, date };
        if (itemSubject) whereCondition.subject = itemSubject;
        if (itemSession) whereCondition.session = itemSession;

        const existing = await prisma.attendance.findFirst({
          where: whereCondition,
        });

        if (existing) {
          const updated = await prisma.attendance.update({
            where: { id: existing.id },
            data: { status, subject: itemSubject, session: itemSession },
          });
          results.push(updated);
        } else {
          const created = await prisma.attendance.create({
            data: { studentId, date, status, subject: itemSubject, session: itemSession },
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

    const whereCondition: any = { studentId, date };
    if (finalSubject) whereCondition.subject = finalSubject;
    if (finalSession) whereCondition.session = finalSession;

    const existing = await prisma.attendance.findFirst({
      where: whereCondition,
    });

    let attendance;
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status, subject: finalSubject, session: finalSession },
        include: {
          student: {
            include: { parent: true },
          },
        },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: { studentId, date, status, subject: finalSubject, session: finalSession },
        include: {
          student: {
            include: { parent: true },
          },
        },
      });
    }

    if (attendance.student?.parent?.userId) {
      notificationService
        .sendToUser({
          userId: attendance.student.parent.userId,
          title: 'Update Presensi Siswa',
          body: `Presensi ${attendance.student.name} pada ${date}: ${status}${finalSubject ? ` (${finalSubject})` : ''}.`,
          type: 'ATTENDANCE',
          url: '/parent/attendance',
          createdBy: auth.id,
        })
        .catch((err) => console.error('[FCM Attendance Trigger Error]:', err));
    }

    return NextResponse.json({
      message: 'Absensi berhasil dicatat',
      attendance,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal merubah absensi' }, { status: 500 });
  }
}
