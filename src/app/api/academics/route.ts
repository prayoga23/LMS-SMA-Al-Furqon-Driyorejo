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

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, category, description, date } = body;

    const academic = await prisma.academicInformation.create({
      data: { title, category, description, date },
    });

    return NextResponse.json({
      message: 'Informasi akademik berhasil ditambahkan',
      academic,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menambahkan informasi akademik' }, { status: 500 });
  }
}
