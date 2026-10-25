import { NextRequest, NextResponse } from 'next/server';
import { DatabaseStore } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin credentials required to allocate emergency relief dispatches.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requestId, volunteerId, allocatedItems } = body;

    if (!requestId || !volunteerId || !allocatedItems || !Array.isArray(allocatedItems)) {
      return NextResponse.json(
        { error: 'Missing required allocation fields (requestId, volunteerId, allocatedItems).' },
        { status: 400 }
      );
    }

    // Execute atomic transaction
    const result = await DatabaseStore.allocateRequestTransaction({
      requestId,
      volunteerId,
      allocatedItems,
      adminUserId: session.userId,
      adminName: session.name,
    });

    return NextResponse.json({
      success: true,
      assignment: result.assignment,
      request: result.request,
      message: `Successfully allocated supplies and dispatched driver for ${requestId}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Transaction failed. Stock and assignment changes rolled back.' },
      { status: 400 }
    );
  }
}
