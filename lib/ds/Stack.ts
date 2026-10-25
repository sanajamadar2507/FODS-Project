/**
 * Stack Implementation (LIFO - Last In, First Out)
 * Used in ReliefLink for:
 * 1. Admin "Undo Last Allocation" stack (reverts stock, status, assignment)
 * 2. Driver "Recently Delivered" history stack
 */

export class StackNode<T> {
  data: T;
  next: StackNode<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

export class Stack<T> {
  private topNode: StackNode<T> | null = null;
  private count: number = 0;

  /**
   * Push an item onto top of the stack.
   */
  push(item: T): void {
    const newNode = new StackNode(item);
    newNode.next = this.topNode;
    this.topNode = newNode;
    this.count++;
  }

  /**
   * Pop the topmost item off the stack.
   */
  pop(): T | null {
    if (!this.topNode) return null;
    const item = this.topNode.data;
    this.topNode = this.topNode.next;
    this.count--;
    return item;
  }

  /**
   * Peek at the topmost item without removing it.
   */
  peek(): T | null {
    return this.topNode ? this.topNode.data : null;
  }

  /**
   * Returns current count of items.
   */
  size(): number {
    return this.count;
  }

  /**
   * Returns true if stack is empty.
   */
  isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Return items as an array from top to bottom.
   */
  toArray(): T[] {
    const result: T[] = [];
    let current = this.topNode;
    while (current) {
      result.push(current.data);
      current = current.next;
    }
    return result;
  }

  /**
   * Clear all items.
   */
  clear(): void {
    this.topNode = null;
    this.count = 0;
  }
}
