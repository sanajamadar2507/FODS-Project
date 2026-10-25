import { NextResponse } from 'next/server';
import { DatabaseStore } from '@/lib/db/store';

export async function GET() {
  try {
    const logs = await DatabaseStore.getActivityLogs();
    return NextResponse.json({ activity: logs });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 });
  }
}
