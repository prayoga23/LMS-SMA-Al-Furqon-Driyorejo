import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Eksekusi seluruh 16 query database secara paralel (Promise.all) untuk performa super cepat
    const [
      totalStudents,
      totalParents,
      lunasPayments,
      yayasanLunas,
      sekolahLunas,
      totalAttendanceCount,
      hadirCount,
      sakitCount,
      izinCount,
      alphaCount,
      gradeAvg,
      latestPayments,
      latestStudents,
      latestAcademic,
      lunasCount,
      belumLunasCount,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.parents.count(),
      prisma.payment.aggregate({
        where: { status: 'Lunas' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'Lunas', category: 'SPP' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'Lunas', category: 'Kegiatan' },
        _sum: { amount: true },
      }),
      prisma.attendance.count(),
      prisma.attendance.count({ where: { status: 'Hadir' } }),
      prisma.attendance.count({ where: { status: 'Sakit' } }),
      prisma.attendance.count({ where: { status: 'Izin' } }),
      prisma.attendance.count({ where: { status: 'Alpha' } }),
      prisma.grade.aggregate({
        _avg: { score: true },
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { student: true },
      }),
      prisma.student.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: {
            include: { user: true },
          },
        },
      }),
      prisma.academicInformation.findMany({
        take: 5,
        orderBy: { date: 'desc' },
      }),
      prisma.payment.count({ where: { status: 'Lunas' } }),
      prisma.payment.count({ where: { status: 'Belum Lunas' } }),
    ]);

    const totalSppPaid = lunasPayments._sum?.amount || 0;
    const totalYayasanPaid = yayasanLunas._sum?.amount || 0;
    const totalSekolahPaid = sekolahLunas._sum?.amount || 0;

    const attendancePercentage =
      totalAttendanceCount > 0
        ? Number(((hadirCount / totalAttendanceCount) * 100).toFixed(1))
        : 0;

    const averageGrade = Number((gradeAvg._avg?.score || 0).toFixed(1));

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
        Hadir: hadirCount,
        Sakit: sakitCount,
        Izin: izinCount,
        Alpha: alphaCount,
      },
    });
  } catch (error: any) {
    console.error('Error GET /api/admin/dashboard-stats:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
