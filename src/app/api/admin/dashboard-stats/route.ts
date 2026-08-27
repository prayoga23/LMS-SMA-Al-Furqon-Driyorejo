import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// In-Memory Server Cache untuk 0ms response time
let cachedStats: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 30 * 1000; // Cache 30 detik

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const now = Date.now();
    const refresh = req.nextUrl.searchParams.get('refresh') === 'true';

    // Kembalikan dari cache server jika masih dalam TTL 30 detik (0ms delay!)
    if (!refresh && cachedStats && now - cachedStats.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedStats.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }

    // Eksekusi seluruh 16 query database secara paralel (Promise.all)
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

    const result = {
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
    };

    // Simpan ke in-memory cache
    cachedStats = { data: result, timestamp: now };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
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
