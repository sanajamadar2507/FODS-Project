/**
 * 2D Matrix Data Structure
 * Used in ReliefLink for Area x Item Demand Heat-Map:
 * Rows = Geographic Areas
 * Columns = Relief Items (Food packets, Drinking water, Medicine kits, Blankets, Tents, Clothes)
 */

export interface DemandMatrixResult {
  areas: string[];
  items: string[];
  grid: number[][]; // [areaIndex][itemIndex]
  rowTotals: number[];
  colTotals: number[];
  maxCell: number;
}

export class DemandMatrix2D {
  private areas: string[];
  private items: string[];
  private grid: number[][];

  constructor(areas: string[], items: string[]) {
    this.areas = [...areas];
    this.items = [...items];
    this.grid = Array.from({ length: areas.length }, () =>
      new Array(items.length).fill(0)
    );
  }

  set(area: string, item: string, value: number): void {
    const r = this.areas.indexOf(area);
    const c = this.items.indexOf(item);
    if (r !== -1 && c !== -1) {
      this.grid[r][c] = value;
    }
  }

  add(area: string, item: string, delta: number): void {
    const r = this.areas.indexOf(area);
    const c = this.items.indexOf(item);
    if (r !== -1 && c !== -1) {
      this.grid[r][c] += delta;
    }
  }

  get(area: string, item: string): number {
    const r = this.areas.indexOf(area);
    const c = this.items.indexOf(item);
    if (r !== -1 && c !== -1) {
      return this.grid[r][c];
    }
    return 0;
  }

  /**
   * Builds the Demand Matrix from active requests and requested items.
   */
  static buildFromRequests(
    requests: Array<{ id: string; area: string; status: string }>,
    requestItems: Array<{ request_id: string; item_name: string; quantity: number }>,
    availableAreas: string[],
    availableItems: string[]
  ): DemandMatrixResult {
    const matrix = new DemandMatrix2D(availableAreas, availableItems);

    // Filter pending/active requests only (exclude delivered or declined)
    const activeReqMap = new Map<string, string>();
    for (const r of requests) {
      if (r.status !== 'Delivered' && r.status !== 'Declined') {
        activeReqMap.set(r.id, r.area);
      }
    }

    for (const item of requestItems) {
      const area = activeReqMap.get(item.request_id);
      if (area) {
        matrix.add(area, item.item_name, item.quantity);
      }
    }

    const rowTotals = matrix.grid.map((row) => row.reduce((a, b) => a + b, 0));
    const colTotals = availableItems.map((_, colIdx) =>
      matrix.grid.reduce((sum, row) => sum + row[colIdx], 0)
    );

    let maxCell = 0;
    for (let r = 0; r < availableAreas.length; r++) {
      for (let c = 0; c < availableItems.length; c++) {
        if (matrix.grid[r][c] > maxCell) {
          maxCell = matrix.grid[r][c];
        }
      }
    }

    return {
      areas: availableAreas,
      items: availableItems,
      grid: matrix.grid,
      rowTotals,
      colTotals,
      maxCell: Math.max(maxCell, 1),
    };
  }
}
