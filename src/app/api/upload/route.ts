import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // Validasi tipe file (hanya gambar)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Format file tidak didukung. Harap unggah gambar (JPG, PNG, WEBP, GIF)' }, { status: 400 });
    }

    // Validasi ukuran (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ message: 'Ukuran file terlalu besar (maksimal 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let publicUrl = '';

    try {
      const originalName = file.name || 'image.png';
      const ext = path.extname(originalName) || '.png';
      const filename = `academic-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext.toLowerCase()}`;

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'academics');
      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      publicUrl = `/uploads/academics/${filename}`;
    } catch (fsError) {
      console.warn('Filesystem write error, falling back to Data URL:', fsError);
      // Fallback to Data URL for serverless / read-only environment
      const base64 = buffer.toString('base64');
      const mimeType = file.type || 'image/png';
      publicUrl = `data:${mimeType};base64,${base64}`;
    }

    return NextResponse.json({
      message: 'Gambar berhasil diunggah',
      url: publicUrl,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ message: error.message || 'Gagal mengunggah gambar' }, { status: 500 });
  }
}

