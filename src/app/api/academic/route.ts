import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  const where: any = {};
  if (category) where.category = category;

  const items = await prisma.academicInformation.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  const grouped = {
    jadwal_pelajaran: items.filter((i: any) => i.category === 'Jadwal Pelajaran'),
    jadwal_ujian: items.filter((i: any) => i.category === 'Jadwal Ujian'),
    prestasi: items.filter((i: any) => i.category === 'Prestasi'),
    kegiatan: items.filter((i: any) => i.category === 'Kegiatan'),
    pengumuman: items.filter((i: any) => i.category === 'Pengumuman'),
    all: items,
  };

  return NextResponse.json(grouped);
}
