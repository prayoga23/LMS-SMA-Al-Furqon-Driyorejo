import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
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
      try {
        const item = teachers[i];
        const nip = String(item.nip || item.NIP || '').trim();
        const name = String(item.name || item.nama || item['Nama Guru'] || '').trim();
        const subject = String(item.subject || item.mapel || item['Mata Pelajaran'] || '').trim();
        const phone = item.phone || item.no_hp ? String(item.phone || item.no_hp).trim() : null;
        const email = item.email ? String(item.email).trim() : null;
        
        let status = 'Aktif';
        if (item.status) {
          const sLower = String(item.status).toLowerCase().trim();
          if (sLower.includes('non') || sLower.includes('pasif') || sLower.includes('inaktif')) {
            status = 'Non-Aktif';
          }
        }

        if (!nip || !name || !subject) {
          errors.push(`Baris ${i + 1}: NIP (${nip || 'kosong'}), Nama Guru, dan Mata Pelajaran wajib diisi.`);
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
      } catch (rowErr: any) {
        console.error(`Error processing teacher row ${i + 1}:`, rowErr);
        errors.push(`Baris ${i + 1}: ${rowErr.message || 'Gagal memproses data guru ini.'}`);
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
