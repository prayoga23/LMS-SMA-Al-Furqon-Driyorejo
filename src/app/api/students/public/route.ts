import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { nis: { contains: search.trim() } },
        { class: { contains: search.trim() } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        nis: true,
        name: true,
        class: true,
        major: true,
        entryYear: true,
        parentId: true,
      },
      orderBy: [
        { name: 'asc' },
      ],
      take: 20, // limit to max 20 results for quick UI search
    });

    const formattedStudents = students.map((s: any) => ({
      id: s.id,
      nis: s.nis,
      name: s.name,
      class: s.class,
      major: s.major,
      entryYear: s.entryYear,
      hasParent: !!s.parentId,
    }));

    return NextResponse.json(formattedStudents);
  } catch (error: any) {
    console.error('Error fetching public students:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal mengambil data siswa' },
      { status: 500 }
    );
  }
}
