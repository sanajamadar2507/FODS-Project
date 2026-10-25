import { NextRequest, NextResponse } from 'next/server';
import { DatabaseStore } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ notifications: [] });
    }

    const notifs = await DatabaseStore.getNotifications(session.userId);
    return NextResponse.json({ notifications: notifs });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId } = body;
    if (notificationId) {
      await DatabaseStore.markNotificationRead(notificationId);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
  }
}
