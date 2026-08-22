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
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const destination = searchParams.get('destination');

  const where: any = {};
  if (studentId) where.studentId = Number(studentId);
  if (status) where.status = status;
  if (category) where.category = category;
  if (destination) where.destination = destination;

  const payments = await prisma.payment.findMany({
    where,
    include: { student: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      student_id,
      category = 'SPP',
      destination,
      title,
      semester,
      academic_year,
      amount,
      status,
      notes,
    } = body;

    // Determine destination automatically based on category if not provided
    const finalDestination =
      destination ||
      (category === 'Kegiatan'
        ? 'Sekolah (SMA Al-Furqon)'
        : 'Yayasan Pondok Pesantren Al-Furqon');

    const payment = await prisma.payment.create({
      data: {
        studentId: Number(student_id),
        category,
        destination: finalDestination,
        title: title || (category === 'Kegiatan' ? 'Anggaran Kegiatan Sekolah' : 'SPP Bulanan / Semester'),
        semester,
        academicYear: academic_year,
        amount: Number(amount),
        status: status || 'Belum Lunas',
        notes: notes || null,
      },
      include: { student: true },
    });

    return NextResponse.json(
      {
        message: 'Tagihan pembayaran berhasil ditambahkan',
        payment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal membuat pembayaran' }, { status: 500 });
  }
}
