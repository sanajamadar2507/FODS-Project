import { NextRequest, NextResponse } from 'next/server';
import { DatabaseStore } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const volunteers = await DatabaseStore.getVolunteers();
    return NextResponse.json({ volunteers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch volunteer roster.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { isAvailable, userId } = body;

    // A volunteer can toggle their own, or admin can toggle any
    const targetUserId = session.role === 'admin' && userId ? userId : session.userId;

    const updated = await DatabaseStore.updateVolunteerAvailability(targetUserId, Boolean(isAvailable));
    if (!updated) {
      return NextResponse.json({ error: 'Volunteer driver record not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      volunteer: updated,
      message: `Status updated to ${updated.is_available ? 'Available' : 'Offline'}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update availability.' },
      { status: 500 }
    );
  }
}
