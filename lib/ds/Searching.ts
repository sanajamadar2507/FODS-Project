/**
 * Handcrafted Searching Algorithms
 * 1. Binary Search: O(log N) lookup on requests sorted by Request ID (e.g., "RL-0005").
 * 2. Linear Search: O(N) flexible multi-attribute text search for requester names, areas, or notes.
 */

/**
 * Binary search for an exact request ID on an array sorted ascendingly by ID.
 * Returns the matching element or null if not found.
 */
export function binarySearchById<T extends { id: string }>(
  sortedItems: T[],
  targetId: string
): { item: T | null; comparisons: number; index: number } {
  let low = 0;
  let high = sortedItems.length - 1;
  let comparisons = 0;
  const cleanTarget = targetId.trim().toUpperCase();

  while (low <= high) {
    comparisons++;
    const mid = Math.floor((low + high) / 2);
    const midId = sortedItems[mid].id.toUpperCase();

    if (midId === cleanTarget) {
      return { item: sortedItems[mid], comparisons, index: mid };
    } else if (midId < cleanTarget) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return { item: null, comparisons, index: -1 };
}

/**
 * Linear search across multiple text fields (name, area, address, description).
 */
export function linearSearch<T extends { requester_name?: string; area?: string; address?: string; id?: string }>(
  items: T[],
  query: string
): { results: T[]; totalScanned: number } {
  if (!query || query.trim() === "") {
    return { results: items, totalScanned: items.length };
  }

  const cleanQuery = query.trim().toLowerCase();
  const results: T[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const matchName = item.requester_name?.toLowerCase().includes(cleanQuery);
    const matchArea = item.area?.toLowerCase().includes(cleanQuery);
    const matchAddress = item.address?.toLowerCase().includes(cleanQuery);
    const matchId = item.id?.toLowerCase().includes(cleanQuery);

    if (matchName || matchArea || matchAddress || matchId) {
      results.push(item);
    }
  }

  return { results, totalScanned: items.length };
}
