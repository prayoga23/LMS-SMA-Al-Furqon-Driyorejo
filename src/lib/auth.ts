import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'sekolah-secret-key-2025';

export interface JwtPayload {
  id: number;
  email: string;
  role: 'admin' | 'guru' | 'staff' | 'parent' | string;
  parentId?: number | null;
  subject?: string | null;
  teacherId?: number | null;
}

export function signToken(payload: JwtPayload): string {
  // Akun orang tua (parent) dan mobile app tidak boleh otomatis ke-logout: berlaku 10 tahun (3650d)
  const expiresIn = payload.role === 'parent' ? '3650d' : '60d';
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getAuthUser(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}
