/**
 * Handcrafted Sorting Algorithms
 * 1. QuickSort: Divide-and-conquer partition sorting for general dynamic criteria.
 * 2. InsertionSort: Efficient adaptive sorting for smaller batches or nearly-sorted feeds.
 * 3. CountingSort / BucketSort: Specialized O(N) grouping by priority category.
 */

export type Comparator<T> = (a: T, b: T) => number;

/**
 * QuickSort Implementation
 */
export function quickSort<T>(arr: T[], compareFn: Comparator<T>): T[] {
  const list = [...arr];

  function sort(low: number, high: number) {
    if (low < high) {
      const pi = partition(low, high);
      sort(low, pi - 1);
      sort(pi + 1, high);
    }
  }

  function partition(low: number, high: number): number {
    const pivot = list[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (compareFn(list[j], pivot) <= 0) {
        i++;
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
      }
    }

    const temp = list[i + 1];
    list[i + 1] = list[high];
    list[high] = temp;

    return i + 1;
  }

  sort(0, list.length - 1);
  return list;
}

/**
 * InsertionSort Implementation
 */
export function insertionSort<T>(arr: T[], compareFn: Comparator<T>): T[] {
  const list = [...arr];
  const n = list.length;

  for (let i = 1; i < n; i++) {
    const key = list[i];
    let j = i - 1;

    while (j >= 0 && compareFn(list[j], key) > 0) {
      list[j + 1] = list[j];
      j--;
    }
    list[j + 1] = key;
  }

  return list;
}

/**
 * Bucket / Counting Sort for Categorical Urgency Grouping
 * Groups items into buckets: 'Critical' -> 'High' -> 'Medium' -> 'Low'
 */
export function bucketSortByPriority<T extends { priority_label: string }>(items: T[]): {
  Critical: T[];
  High: T[];
  Medium: T[];
  Low: T[];
  allSorted: T[];
} {
  const buckets: { Critical: T[]; High: T[]; Medium: T[]; Low: T[] } = {
    Critical: [],
    High: [],
    Medium: [],
    Low: [],
  };

  // Counting distribution
  for (const item of items) {
    const label = item.priority_label as keyof typeof buckets;
    if (buckets[label]) {
      buckets[label].push(item);
    } else {
      buckets.Low.push(item);
    }
  }

  return {
    ...buckets,
    allSorted: [...buckets.Critical, ...buckets.High, ...buckets.Medium, ...buckets.Low],
  };
}
