import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { teachers } = body;

    if (!Array.isArray(teachers) || teachers.length === 0) {
      return NextResponse.json(
        { message: 'Data guru dari Excel tidak ditemukan atau kosong.' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let updateCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < teachers.length; i++) {
      const item = teachers[i];
      const nip = String(item.nip || '').trim();
      const name = String(item.name || '').trim();
      const subject = String(item.subject || '').trim();
      const phone = item.phone ? String(item.phone).trim() : null;
      const email = item.email ? String(item.email).trim() : null;
      const status = item.status && ['Aktif', 'Non-Aktif'].includes(item.status) ? item.status : 'Aktif';

      if (!nip || !name || !subject) {
        errors.push(`Baris ${i + 1}: NIP, Nama, dan Mata Pelajaran wajib diisi.`);
        continue;
      }

      const existing = await prisma.teacher.findUnique({
        where: { nip },
      });

      if (existing) {
        await prisma.teacher.update({
          where: { id: existing.id },
          data: { name, subject, phone, email, status },
        });
        updateCount++;
      } else {
        await prisma.teacher.create({
          data: { nip, name, subject, phone, email, status },
        });
        successCount++;
      }
    }

    return NextResponse.json({
      message: `Import berhasil! ${successCount} data baru ditambahkan, ${updateCount} data diperbarui.`,
      successCount,
      updateCount,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Gagal mengimport data guru' },
      { status: 500 }
    );
  }
}
