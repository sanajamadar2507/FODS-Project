import { NextRequest, NextResponse } from 'next/server';
import { DatabaseStore } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const stock = await DatabaseStore.getStock();
    return NextResponse.json({ stock });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch inventory stock.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only coordinators can update warehouse stock.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { itemName, quantityAvailable } = body;

    if (!itemName || quantityAvailable === undefined) {
      return NextResponse.json(
        { error: 'Item name and valid quantity are required.' },
        { status: 400 }
      );
    }

    const updated = await DatabaseStore.updateStockQuantity(
      itemName,
      Number(quantityAvailable),
      session.userId,
      session.name
    );

    if (!updated) {
      return NextResponse.json({ error: 'Item not found in stock inventory.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: updated,
      message: `Updated inventory for ${itemName} to ${updated.quantity_available} units.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update stock.' },
      { status: 500 }
    );
  }
}
