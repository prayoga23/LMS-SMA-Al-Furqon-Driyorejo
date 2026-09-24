import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized. Hanya Guru Piket atau Staff/Admin yang berhak.' }, { status: 403 });
  }

  const today = new Date().toISOString().split('T')[0];
  const payload = {
    type: 'ALFURQON_PIKET_KIOSK',
    school: 'SMA AL-FURQON DRIYOREJO',
    date: today,
    issuedAt: Date.now(),
  };

  return NextResponse.json({
    kioskPayload: JSON.stringify(payload),
    date: today,
    school: 'SMA AL-FURQON DRIYOREJO',
  });
}
