/**
 * Linked List Implementations
 * 1. SinglyLinkedList: Stores ordered delivery stops for driver trip dispatch.
 * 2. DoublyLinkedList: Bidirectional activity navigation (newer / older) for admin feed.
 */

// --- 1. SINGLY LINKED LIST ---
export class SinglyNode<T> {
  data: T;
  next: SinglyNode<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

export class SinglyLinkedList<T> {
  private head: SinglyNode<T> | null = null;
  private tail: SinglyNode<T> | null = null;
  private count: number = 0;

  append(data: T): void {
    const newNode = new SinglyNode(data);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else if (this.tail) {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.count++;
  }

  prepend(data: T): void {
    const newNode = new SinglyNode(data);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head = newNode;
    }
    this.count++;
  }

  remove(predicate: (item: T) => boolean): boolean {
    if (!this.head) return false;

    if (predicate(this.head.data)) {
      this.head = this.head.next;
      if (!this.head) this.tail = null;
      this.count--;
      return true;
    }

    let current = this.head;
    while (current.next && !predicate(current.next.data)) {
      current = current.next;
    }

    if (current.next) {
      if (current.next === this.tail) {
        this.tail = current;
      }
      current.next = current.next.next;
      this.count--;
      return true;
    }

    return false;
  }

  size(): number {
    return this.count;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  getHead(): T | null {
    return this.head ? this.head.data : null;
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
}

// --- 2. DOUBLY LINKED LIST ---
export class DoublyNode<T> {
  data: T;
  prev: DoublyNode<T> | null = null;
  next: DoublyNode<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

export class DoublyLinkedList<T> {
  private head: DoublyNode<T> | null = null;
  private tail: DoublyNode<T> | null = null;
  private cursor: DoublyNode<T> | null = null;
  private count: number = 0;

  append(data: T): void {
    const newNode = new DoublyNode(data);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
      this.cursor = newNode;
    } else if (this.tail) {
      this.tail.next = newNode;
      newNode.prev = this.tail;
      this.tail = newNode;
    }
    this.count++;
  }

  prepend(data: T): void {
    const newNode = new DoublyNode(data);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
      this.cursor = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }
    this.count++;
  }

  /**
   * Cursor navigation for interactive feeds: move newer (prev) or older (next)
   */
  setCursorToHead(): void {
    this.cursor = this.head;
  }

  setCursorToTail(): void {
    this.cursor = this.tail;
  }

  getCurrent(): T | null {
    return this.cursor ? this.cursor.data : null;
  }

  hasPrevious(): boolean {
    return Boolean(this.cursor && this.cursor.prev);
  }

  hasNext(): boolean {
    return Boolean(this.cursor && this.cursor.next);
  }

  movePrevious(): T | null {
    if (this.cursor && this.cursor.prev) {
      this.cursor = this.cursor.prev;
      return this.cursor.data;
    }
    return null;
  }

  moveNext(): T | null {
    if (this.cursor && this.cursor.next) {
      this.cursor = this.cursor.next;
      return this.cursor.data;
    }
    return null;
  }

  size(): number {
    return this.count;
  }

  isEmpty(): boolean {
    return this.count === 0;
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
}
