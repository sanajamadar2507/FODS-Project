import { NextRequest, NextResponse } from 'next/server';
import { DatabaseStore } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { assignmentId, status, notes } = body;

    const validStatuses = ['Accepted', 'Picked Up', 'On the Way', 'Delivered', 'Declined'];
    if (!assignmentId || !status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid assignment or transition status requested.' },
        { status: 400 }
      );
    }

    const result = await DatabaseStore.updateAssignmentStatus(assignmentId, status, notes);

    return NextResponse.json({
      success: true,
      assignment: result.assignment,
      request: result.request,
      message: `Delivery status transitioned to "${status}".`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update assignment status.' },
      { status: 500 }
    );
  }
}
