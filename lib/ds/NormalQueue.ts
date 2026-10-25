/**
 * Normal FIFO Queue Implementation (Linked Queue)
 * Implemented with explicit Node pointers (head and tail) for O(1) enqueue and dequeue.
 * Used in ReliefLink for driver notification dispatches and event queues.
 */

export class QueueNode<T> {
  data: T;
  next: QueueNode<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

export class NormalQueue<T> {
  private head: QueueNode<T> | null = null;
  private tail: QueueNode<T> | null = null;
  private count: number = 0;

  /**
   * Enqueue item at rear of queue (O(1))
   */
  enqueue(item: T): void {
    const newNode = new QueueNode(item);
    if (!this.tail) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.count++;
  }

  /**
   * Dequeue item from front of queue (O(1))
   */
  dequeue(): T | null {
    if (!this.head) return null;
    const item = this.head.data;
    this.head = this.head.next;
    if (!this.head) {
      this.tail = null;
    }
    this.count--;
    return item;
  }

  /**
   * Peek at front item without dequeuing
   */
  peek(): T | null {
    return this.head ? this.head.data : null;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  size(): number {
    return this.count;
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.data);
      current = current.next;
    }
    return result;
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this.count = 0;
  }
}
