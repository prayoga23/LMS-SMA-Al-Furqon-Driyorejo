import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const totalStudents = await prisma.student.count();
  const totalParents = await prisma.parents.count();

  const lunasPayments = await prisma.payment.aggregate({
    where: { status: 'Lunas' },
    _sum: { amount: true },
  });
  const totalSppPaid = lunasPayments._sum.amount || 0;

  const yayasanLunas = await prisma.payment.aggregate({
    where: { status: 'Lunas', category: 'SPP' },
    _sum: { amount: true },
  });
  const totalYayasanPaid = yayasanLunas._sum.amount || 0;

  const sekolahLunas = await prisma.payment.aggregate({
    where: { status: 'Lunas', category: 'Kegiatan' },
    _sum: { amount: true },
  });
  const totalSekolahPaid = sekolahLunas._sum.amount || 0;

  const totalAttendanceCount = await prisma.attendance.count();
  const hadirCount = await prisma.attendance.count({ where: { status: 'Hadir' } });
  const attendancePercentage = totalAttendanceCount > 0
    ? Number(((hadirCount / totalAttendanceCount) * 100).toFixed(1))
    : 0;

  const gradeAvg = await prisma.grade.aggregate({
    _avg: { score: true },
  });
  const averageGrade = Number((gradeAvg._avg.score || 0).toFixed(1));

  const latestPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { student: true },
  });

  const latestStudents = await prisma.student.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      parent: {
        include: { user: true },
      },
    },
  });

  const latestAcademic = await prisma.academicInformation.findMany({
    take: 5,
    orderBy: { date: 'desc' },
  });

  const lunasCount = await prisma.payment.count({ where: { status: 'Lunas' } });
  const belumLunasCount = await prisma.payment.count({ where: { status: 'Belum Lunas' } });

  const hadirB = await prisma.attendance.count({ where: { status: 'Hadir' } });
  const sakitB = await prisma.attendance.count({ where: { status: 'Sakit' } });
  const izinB = await prisma.attendance.count({ where: { status: 'Izin' } });
  const alphaB = await prisma.attendance.count({ where: { status: 'Alpha' } });

  return NextResponse.json({
    total_students: totalStudents,
    total_parents: totalParents,
    total_spp_paid: totalSppPaid,
    total_yayasan_paid: totalYayasanPaid,
    total_sekolah_paid: totalSekolahPaid,
    attendance_percentage: attendancePercentage,
    average_grade: averageGrade,
    latest_payments: latestPayments,
    latest_students: latestStudents,
    latest_academic: latestAcademic,
    spp_summary: {
      lunas: lunasCount,
      belum_lunas: belumLunasCount,
    },
    attendance_breakdown: {
      Hadir: hadirB,
      Sakit: sakitB,
      Izin: izinB,
      Alpha: alphaB,
    },
  });
}
