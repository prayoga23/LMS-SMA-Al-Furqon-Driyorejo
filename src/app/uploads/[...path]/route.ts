import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    // Prevent directory traversal
    if (pathSegments.some((segment) => segment.includes('..'))) {
      return new NextResponse('Invalid Path', { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments);

    const buffer = await readFile(filePath);

    // Determine MIME type
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('File Not Found', { status: 404 });
  }
}
