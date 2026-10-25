import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { DatabaseStore } from '@/lib/db/store';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const user = await DatabaseStore.getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  let volunteerInfo = null;
  if (user.role === 'volunteer') {
    volunteerInfo = await DatabaseStore.getVolunteerByUserId(user.id);
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    volunteer: volunteerInfo,
  });
}
