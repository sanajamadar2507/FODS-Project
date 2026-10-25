import { NextRequest, NextResponse } from 'next/server';
import { DatabaseStore } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const requests = await DatabaseStore.getRequests();

    // If logged in as requester, can query user's requests or full list if authorized
    const { searchParams } = new URL(req.url);
    const userIdFilter = searchParams.get('userId');

    let filtered = requests;
    if (userIdFilter) {
      filtered = requests.filter((r) => r.user_id === userIdFilter);
    } else if (session && session.role === 'requester') {
      filtered = requests.filter((r) => r.user_id === session.userId);
    }

    return NextResponse.json({ requests: filtered });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch relief requests.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();

    const {
      name,
      phone,
      area,
      address,
      peopleAffected,
      situationType,
      specialGroups,
      description,
      itemsNeeded,
    } = body;

    if (!name || !phone || !area || !address || !peopleAffected || !situationType) {
      return NextResponse.json(
        { error: 'Please fill in all required disaster incident details.' },
        { status: 400 }
      );
    }

    if (!itemsNeeded || !Array.isArray(itemsNeeded) || itemsNeeded.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one relief item needed.' },
        { status: 400 }
      );
    }

    // Default to session user or create anonymous guest user id
    const userId = session?.userId || `usr-req-guest-${Date.now().toString(36)}`;

    const newRequest = await DatabaseStore.createRequest({
      userId,
      requesterName: name.trim(),
      phone: phone.trim(),
      area: area.trim(),
      address: address.trim(),
      peopleAffected: Number(peopleAffected),
      situationType,
      specialGroups: Array.isArray(specialGroups) ? specialGroups : [],
      description: description || '',
      itemsNeeded: itemsNeeded.map((it) => ({
        item_name: it.item_name,
        quantity: Math.max(1, Number(it.quantity) || 1),
      })),
    });

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: `Disaster relief request ${newRequest.id} has been registered with ${newRequest.priority_label} urgency priority.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to submit request.' },
      { status: 500 }
    );
  }
}
