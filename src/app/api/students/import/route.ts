import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { students } = body;

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { message: 'Data siswa dari Excel tidak ditemukan atau kosong.' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let updateCount = 0;
    const errors: string[] = [];

    const defaultPassword = await bcrypt.hash('password123', 10);

    for (let i = 0; i < students.length; i++) {
      try {
        const item = students[i];
        const nis = String(item.nis || item.NIS || '').trim();
        const name = String(item.name || item.name_siswa || item['Nama Siswa'] || '').trim();
        const className = String(item.class || item.kelas || 'X IPA 1').trim();
        const major = String(item.major || item.jurusan || 'IPA (MIPA)').trim();
        const entryYear = Number(item.entryYear || item.entry_year || item['Tahun Masuk']) || 2024;
        
        const isSantri = Boolean(item.isSantri || item.is_santri || item.santri);
        const residenceType = String(item.residenceType || item.residence_type || 'Non-Asrama').trim();
        const sppNominal = Number(item.sppNominal || item.spp_nominal) || 500000;
        const activityNominal = Number(item.activityNominal || item.activity_nominal) || 150000;

        const parentName = item.parent_name || item.parentName
          ? String(item.parent_name || item.parentName).trim()
          : `Wali ${name}`;
          
        let parentEmail = item.parent_email || item.parentEmail
          ? String(item.parent_email || item.parentEmail).trim()
          : `ortu_${nis}@sekolah.sch.id`;

        if (!parentEmail.includes('@')) {
          parentEmail = `ortu_${nis}@sekolah.sch.id`;
        }

        const parentPhone = item.parent_phone || item.parentPhone
          ? String(item.parent_phone || item.parentPhone).trim()
          : null;

        if (!nis || !name) {
          errors.push(`Baris ${i + 1}: NIS (${nis || 'kosong'}) atau Nama Siswa wajib diisi.`);
          continue;
        }

        // Find or create parent user
        let parentUser = await prisma.user.findUnique({
          where: { email: parentEmail },
          include: { parent: true },
        });

        let parentId: number;

        if (!parentUser) {
          parentUser = await prisma.user.create({
            data: {
              name: parentName,
              email: parentEmail,
              password: defaultPassword,
              role: 'parent',
              parent: {
                create: {
                  phone: parentPhone,
                },
              },
            },
            include: { parent: true },
          });
          parentId = parentUser.parent!.id;
        } else if (!parentUser.parent) {
          const p = await prisma.parents.create({
            data: {
              userId: parentUser.id,
              phone: parentPhone,
            },
          });
          parentId = p.id;
        } else {
          parentId = parentUser.parent.id;
          if (parentPhone) {
            await prisma.parents.update({
              where: { id: parentId },
              data: { phone: parentPhone },
            });
          }
        }

        // Check if student exists
        const existingStudent = await prisma.student.findUnique({
          where: { nis },
        });

        if (existingStudent) {
          await prisma.student.update({
            where: { id: existingStudent.id },
            data: {
              name,
              class: className,
              major,
              entryYear,
              parentId,
              isSantri,
              residenceType,
              sppNominal,
              activityNominal,
            },
          });
          updateCount++;
        } else {
          await prisma.student.create({
            data: {
              nis,
              name,
              class: className,
              major,
              entryYear,
              parentId,
              isSantri,
              residenceType,
              sppNominal,
              activityNominal,
            },
          });
          successCount++;
        }
      } catch (rowErr: any) {
        console.error(`Error processing row ${i + 1}:`, rowErr);
        errors.push(`Baris ${i + 1}: ${rowErr.message || 'Gagal memproses baris data ini.'}`);
      }
    }

    return NextResponse.json({
      message: `Import berhasil! ${successCount} siswa baru ditambahkan, ${updateCount} siswa diperbarui.`,
      successCount,
      updateCount,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Gagal mengimport data siswa' },
      { status: 500 }
    );
  }
}
