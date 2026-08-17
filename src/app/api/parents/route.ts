import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const parents = await prisma.parents.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(parents);
}
