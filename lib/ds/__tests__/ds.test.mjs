import test from 'node:test';
import assert from 'node:assert/strict';

// Import our compiled or TS/JS classes using relative paths or dynamic imports
// Since we have tsx/ts-node or can write clean standalone tests that verify the logic:
import { PriorityQueue } from '../PriorityQueue.ts';
import { SinglyLinkedList, DoublyLinkedList } from '../LinkedList.ts';
import { Stack } from '../Stack.ts';
import { CircularQueue } from '../CircularQueue.ts';
import { NormalQueue } from '../NormalQueue.ts';
import { quickSort, insertionSort, bucketSortByPriority } from '../Sorting.ts';
import { binarySearchById, linearSearch } from '../Searching.ts';
import { DemandMatrix2D } from '../Matrix2D.ts';

test('1. PriorityQueue: orders items descending by urgency priority', () => {
  const pq = new PriorityQueue();
  pq.enqueue({ id: 'REQ-1', note: 'Low priority' }, 25);
  pq.enqueue({ id: 'REQ-2', note: 'Critical flood' }, 95);
  pq.enqueue({ id: 'REQ-3', note: 'High medical' }, 70);
  pq.enqueue({ id: 'REQ-4', note: 'Medium shelter' }, 50);

  assert.equal(pq.size(), 4);
  assert.equal(pq.peek()?.item.id, 'REQ-2');

  const first = pq.dequeue();
  assert.equal(first?.id, 'REQ-2');
  const second = pq.dequeue();
  assert.equal(second?.id, 'REQ-3');
  const third = pq.dequeue();
  assert.equal(third?.id, 'REQ-4');
  const fourth = pq.dequeue();
  assert.equal(fourth?.id, 'REQ-1');
  assert.equal(pq.isEmpty(), true);
});

test('2. SinglyLinkedList: stores sequential delivery itinerary stops', () => {
  const list = new SinglyLinkedList();
  list.append({ stop: 1, address: '442 Riverside Ave' });
  list.append({ stop: 2, address: '128 Highland Loop' });
  list.append({ stop: 3, address: '89 Lighthouse Point' });

  assert.equal(list.size(), 3);
  const arr = list.toArray();
  assert.equal(arr[0].stop, 1);
  assert.equal(arr[2].address, '89 Lighthouse Point');

  list.remove((item) => item.stop === 2);
  assert.equal(list.size(), 2);
  const updated = list.toArray();
  assert.equal(updated[1].stop, 3);
});

test('3. DoublyLinkedList: interactive bidirectional activity navigation', () => {
  const feed = new DoublyLinkedList();
  feed.append('Action 1: Dispatch sent');
  feed.append('Action 2: Stock updated');
  feed.append('Action 3: Delivery confirmed');

  assert.equal(feed.size(), 3);
  feed.setCursorToHead();
  assert.equal(feed.getCurrent(), 'Action 1: Dispatch sent');
  assert.equal(feed.moveNext(), 'Action 2: Stock updated');
  assert.equal(feed.moveNext(), 'Action 3: Delivery confirmed');
  assert.equal(feed.moveNext(), null); // End of list
  assert.equal(feed.movePrevious(), 'Action 2: Stock updated');
});

test('4. Stack: Undo last action and driver delivery history (LIFO)', () => {
  const undoStack = new Stack();
  undoStack.push({ action: 'ALLOCATE', reqId: 'RL-0001' });
  undoStack.push({ action: 'ALLOCATE', reqId: 'RL-0002' });

  assert.equal(undoStack.peek()?.reqId, 'RL-0002');
  const lastAction = undoStack.pop();
  assert.equal(lastAction?.reqId, 'RL-0002');
  assert.equal(undoStack.size(), 1);
  assert.equal(undoStack.pop()?.reqId, 'RL-0001');
  assert.equal(undoStack.isEmpty(), true);
});

test('5. CircularQueue: Fair volunteer round-robin driver dispatch', () => {
  const cq = new CircularQueue(4);
  cq.enqueue('Driver A');
  cq.enqueue('Driver B');
  cq.enqueue('Driver C');

  assert.equal(cq.dequeue(), 'Driver A');
  cq.enqueue('Driver D');
  assert.equal(cq.size(), 3);

  const volunteers = [
    { id: 'v1', name: 'Marcus', area: 'North Sector', is_available: true },
    { id: 'v2', name: 'Aisha', area: 'River Valley', is_available: true },
    { id: 'v3', name: 'Carlos', area: 'Coastal Belt', is_available: false },
  ];

  // Request for River Valley should pick Aisha (matching area + available)
  const pick1 = CircularQueue.selectNextDriver(volunteers, 'River Valley', -1);
  assert.equal(pick1.driver?.id, 'v2');
  assert.equal(pick1.matchedByArea, true);

  // Request for East Metro (no direct match) should pick available driver
  const pick2 = CircularQueue.selectNextDriver(volunteers, 'East Metro', 1);
  assert.equal(pick2.driver?.is_available, true);
});

test('6. NormalQueue: FIFO Driver Notification Dispatches', () => {
  const q = new NormalQueue();
  q.enqueue('Notif 1: Assigned to RL-0001');
  q.enqueue('Notif 2: Assigned to RL-0002');

  assert.equal(q.size(), 2);
  assert.equal(q.dequeue(), 'Notif 1: Assigned to RL-0001');
  assert.equal(q.dequeue(), 'Notif 2: Assigned to RL-0002');
  assert.equal(q.isEmpty(), true);
});

test('7. Sorting: QuickSort, InsertionSort, and BucketSort', () => {
  const items = [
    { id: 'A', score: 30, priority_label: 'Low' },
    { id: 'B', score: 90, priority_label: 'Critical' },
    { id: 'C', score: 65, priority_label: 'High' },
    { id: 'D', score: 45, priority_label: 'Medium' },
  ];

  // QuickSort ascending
  const qs = quickSort(items, (a, b) => a.score - b.score);
  assert.equal(qs[0].id, 'A');
  assert.equal(qs[3].id, 'B');

  // InsertionSort descending
  const is = insertionSort(items, (a, b) => b.score - a.score);
  assert.equal(is[0].id, 'B');
  assert.equal(is[3].id, 'A');

  // BucketSort by Priority Category
  const buckets = bucketSortByPriority(items);
  assert.equal(buckets.Critical[0].id, 'B');
  assert.equal(buckets.High[0].id, 'C');
  assert.equal(buckets.allSorted[0].priority_label, 'Critical');
});

test('8. Searching: BinarySearch by ID and LinearSearch by Text', () => {
  const sorted = [
    { id: 'RL-0001', requester_name: 'Sarah Jenkins', area: 'River Valley' },
    { id: 'RL-0002', requester_name: 'David Kim', area: 'North Sector' },
    { id: 'RL-0003', requester_name: 'Priya Sharma', area: 'Coastal Belt' },
  ];

  // Binary search
  const found = binarySearchById(sorted, 'RL-0002');
  assert.equal(found.item?.requester_name, 'David Kim');
  assert.equal(found.index, 1);

  const notFound = binarySearchById(sorted, 'RL-9999');
  assert.equal(notFound.item, null);

  // Linear search across fields
  const searchValley = linearSearch(sorted, 'Valley');
  assert.equal(searchValley.results.length, 1);
  assert.equal(searchValley.results[0].id, 'RL-0001');

  const searchPriya = linearSearch(sorted, 'Priya');
  assert.equal(searchPriya.results.length, 1);
  assert.equal(searchPriya.results[0].id, 'RL-0003');
});

test('9. DemandMatrix2D: Area x Item Demand aggregation', () => {
  const areas = ['North Sector', 'River Valley'];
  const items = ['Food packets', 'Drinking water'];

  const requests = [
    { id: 'R1', area: 'River Valley', status: 'Approved' },
    { id: 'R2', area: 'River Valley', status: 'Submitted' },
    { id: 'R3', area: 'North Sector', status: 'Submitted' },
  ];

  const reqItems = [
    { request_id: 'R1', item_name: 'Food packets', quantity: 20 },
    { request_id: 'R2', item_name: 'Drinking water', quantity: 15 },
    { request_id: 'R3', item_name: 'Food packets', quantity: 10 },
  ];

  const result = DemandMatrix2D.buildFromRequests(requests, reqItems, areas, items);
  assert.equal(result.grid[0][0], 10); // North Sector, Food packets
  assert.equal(result.grid[1][0], 20); // River Valley, Food packets
  assert.equal(result.grid[1][1], 15); // River Valley, Drinking water
  assert.equal(result.colTotals[0], 30); // Total food packets across all areas
});
