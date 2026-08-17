import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const allowanceId = Number(id);

  try {
    const body = await req.json();
    const { date, income, expense, description } = body;

    const allowance = await prisma.allowance.update({
      where: { id: allowanceId },
      data: {
        date,
        income: income !== undefined ? Number(income) : 0,
        expense: expense !== undefined ? Number(expense) : 0,
        description,
      },
      include: { student: true },
    });

    return NextResponse.json({
      message: 'Transaksi uang saku berhasil diperbarui',
      allowance,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal memperbarui transaksi' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const allowanceId = Number(id);

  try {
    await prisma.allowance.delete({
      where: { id: allowanceId },
    });
    return NextResponse.json({ message: 'Transaksi uang saku dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menghapus transaksi' }, { status: 500 });
  }
}
