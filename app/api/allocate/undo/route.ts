import { NextRequest, NextResponse } from 'next/server';
import { DatabaseStore } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin credentials required to undo allocations.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requestId, assignmentId, restoredItems } = body;

    if (!requestId || !assignmentId || !restoredItems) {
      return NextResponse.json(
        { error: 'Missing required undo parameters.' },
        { status: 400 }
      );
    }

    await DatabaseStore.undoAllocationTransaction({
      requestId,
      assignmentId,
      restoredItems,
      adminUserId: session.userId,
      adminName: session.name,
    });

    return NextResponse.json({
      success: true,
      message: `Reverted allocation for ${requestId}. Stock inventory restored.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to revert allocation.' },
      { status: 400 }
    );
  }
}
