/**
 * Circular Queue Implementation (Ring Buffer)
 * Used in ReliefLink for Fair Volunteer Rotation:
 * Round-robin driver dispatch algorithm that prioritizes available drivers in matching areas,
 * ensuring fair workload distribution among emergency relief couriers.
 */

export class CircularQueue<T> {
  private buffer: (T | null)[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  private readonly capacity: number;

  constructor(capacity: number = 100) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  enqueue(item: T): boolean {
    if (this.isFull()) return false;
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return true;
  }

  dequeue(): T | null {
    if (this.isEmpty()) return null;
    const item = this.buffer[this.head];
    this.buffer[this.head] = null;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }

  peek(): T | null {
    if (this.isEmpty()) return null;
    return this.buffer[this.head];
  }

  /**
   * Advance rotation by 1 step (round-robin shift)
   */
  advance(): void {
    if (this.isEmpty()) return;
    const item = this.dequeue();
    if (item !== null) {
      this.enqueue(item);
    }
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  isFull(): boolean {
    return this.count === this.capacity;
  }

  size(): number {
    return this.count;
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const idx = (this.head + i) % this.capacity;
      const val = this.buffer[idx];
      if (val !== null) result.push(val);
    }
    return result;
  }

  /**
   * Fair Volunteer Selector:
   * Round-robin picks among available volunteers in the same area first.
   * If none available in that area, picks next available volunteer anywhere.
   */
  static selectNextDriver<V extends { id: string; area: string; is_available: boolean; name: string }>(
    volunteers: V[],
    targetArea: string,
    lastAssignedIndex: number = -1
  ): { driver: V | null; nextIndex: number; matchedByArea: boolean } {
    if (!volunteers || volunteers.length === 0) {
      return { driver: null, nextIndex: -1, matchedByArea: false };
    }

    const n = volunteers.length;
    const startIdx = (lastAssignedIndex + 1) % n;

    // Pass 1: Look for available driver in the same area
    for (let i = 0; i < n; i++) {
      const currentIdx = (startIdx + i) % n;
      const v = volunteers[currentIdx];
      if (v.is_available && v.area.toLowerCase() === targetArea.toLowerCase()) {
        return { driver: v, nextIndex: currentIdx, matchedByArea: true };
      }
    }

    // Pass 2: Look for any available driver (fair rotation)
    for (let i = 0; i < n; i++) {
      const currentIdx = (startIdx + i) % n;
      const v = volunteers[currentIdx];
      if (v.is_available) {
        return { driver: v, nextIndex: currentIdx, matchedByArea: false };
      }
    }

    // Pass 3: All drivers busy, return least recently assigned anyway
    return { driver: volunteers[startIdx], nextIndex: startIdx, matchedByArea: false };
  }
}
