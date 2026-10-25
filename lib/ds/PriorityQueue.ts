/**
 * Priority Queue Implementation (Descending: Highest Priority First)
 * Implemented via an ordered linked list with manual pointer manipulation.
 * Used in ReliefLink to rank pending relief requests by urgency score.
 */

export class PQNode<T> {
  item: T;
  priority: number;
  next: PQNode<T> | null = null;

  constructor(item: T, priority: number) {
    this.item = item;
    this.priority = priority;
  }
}

export class PriorityQueue<T> {
  private head: PQNode<T> | null = null;
  private count: number = 0;

  /**
   * Enqueue an element in descending order of priority.
   * If priorities are identical, elements maintain FIFO order.
   */
  enqueue(item: T, priority: number): void {
    const newNode = new PQNode(item, priority);

    // If queue is empty or new item has higher priority than head
    if (!this.head || priority > this.head.priority) {
      newNode.next = this.head;
      this.head = newNode;
      this.count++;
      return;
    }

    // Traverse to find insertion point
    let current = this.head;
    while (current.next && current.next.priority >= priority) {
      current = current.next;
    }

    newNode.next = current.next;
    current.next = newNode;
    this.count++;
  }

  /**
   * Remove and return the highest priority element.
   */
  dequeue(): T | null {
    if (!this.head) return null;
    const item = this.head.item;
    this.head = this.head.next;
    this.count--;
    return item;
  }

  /**
   * Inspect the highest priority element without removing it.
   */
  peek(): { item: T; priority: number } | null {
    if (!this.head) return null;
    return { item: this.head.item, priority: this.head.priority };
  }

  /**
   * Returns current count of elements.
   */
  size(): number {
    return this.count;
  }

  /**
   * Check if queue is empty.
   */
  isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Convert all items in priority order into a regular JavaScript array.
   */
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.item);
      current = current.next;
    }
    return result;
  }

  /**
   * Clear all elements.
   */
  clear(): void {
    this.head = null;
    this.count = 0;
  }
}
