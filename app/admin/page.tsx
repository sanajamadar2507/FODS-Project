'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Clock,
  CheckCircle2,
  Users,
  Search,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  X,
  AlertTriangle,
  ArrowUpDown,
  Download,
  Info,
  Truck,
  Box,
  TrendingUp,
  MapPin,
  Flame,
  Droplet,
  HeartPulse,
  Activity,
  Edit2,
  Check,
  Building,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useToast } from '@/components/ui/Toast';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  ReliefRequest,
  StockItem,
  Volunteer,
  Assignment,
  ActivityLogEntry,
} from '@/lib/db/types';

// Import our handcrafted Data Structures
import {
  PriorityQueue,
  DoublyLinkedList,
  Stack,
  CircularQueue,
  quickSort,
  insertionSort,
  bucketSortByPriority,
  binarySearchById,
  linearSearch,
  DemandMatrix2D,
} from '@/lib/ds';

type AdminTab = 'overview' | 'requests' | 'stock' | 'volunteers' | 'deliveries' | 'activity';

const RELIEF_AREAS = [
  'North Sector',
  'River Valley',
  'Coastal Belt',
  'Highland Ridge',
  'East Metro',
  'Industrial Zone',
];

const ITEM_NAMES = [
  'Food packets',
  'Drinking water',
  'Medicine kits',
  'Blankets',
  'Tents',
  'Clothes',
];

const DONUT_COLORS = ['#0d9488', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981', '#94a3b8'];

export default function AdminDashboard() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);

  // Core Data
  const [requests, setRequests] = useState<ReliefRequest[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);

  // Allocation Side Drawer State
  const [allocatingRequest, setAllocatingRequest] = useState<ReliefRequest | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isPartialAllowed, setIsPartialAllowed] = useState(false);
  const [submittingAllocation, setSubmittingAllocation] = useState(false);

  // Undo Stack state (in memory client-side stack mirrored to backend)
  const [undoStack] = useState(() => new Stack<{
    requestId: string;
    assignmentId: string;
    restoredItems: Array<{ item_name: string; quantity: number }>;
  }>());
  const [undoCount, setUndoCount] = useState(0);

  // Filtering & Sorting State for Requests Table
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModeUsed, setSearchModeUsed] = useState<string>('Standard Scan');
  const [sortBy, setSortBy] = useState<'priority' | 'time' | 'people' | 'area'>('priority');
  const [sortAlgorithm, setSortAlgorithm] = useState<'quick' | 'insertion'>('quick');
  const [activePriorityBucket, setActivePriorityBucket] = useState<'ALL' | 'Critical' | 'High' | 'Medium' | 'Low'>('ALL');

  // Stock Inline Editing State
  const [editingStockItem, setEditingStockItem] = useState<string | null>(null);
  const [editingStockQty, setEditingStockQty] = useState<number>(0);

  // Activity Feed Doubly-Linked-List Cursor State
  const [activityDLL, setActivityDLL] = useState<DoublyLinkedList<ActivityLogEntry>>(() => new DoublyLinkedList<ActivityLogEntry>());
  const [currentActivityItem, setCurrentActivityItem] = useState<ActivityLogEntry | null>(null);

  // Fetch all administrative dataset
  const fetchAllData = async () => {
    try {
      const [reqRes, stkRes, volRes, actRes] = await Promise.all([
        fetch('/api/requests'),
        fetch('/api/stock'),
        fetch('/api/volunteers'),
        fetch('/api/activity'),
      ]);

      const [reqData, stkData, volData, actData] = await Promise.all([
        reqRes.json(),
        stkRes.json(),
        volRes.json(),
        actRes.json(),
      ]);

      if (reqData.requests) setRequests(reqData.requests);
      if (stkData.stock) setStock(stkData.stock);
      if (volData.volunteers) setVolunteers(volData.volunteers);
      if (actData.activity) {
        setActivityLogs(actData.activity);

        // Populate Doubly Linked List for activity navigation
        const dll = new DoublyLinkedList<ActivityLogEntry>();
        actData.activity.forEach((log: ActivityLogEntry) => dll.append(log));
        dll.setCursorToHead();
        setActivityDLL(dll);
        setCurrentActivityItem(dll.getCurrent());
      }
    } catch {
      showToast('Error refreshing operations data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000); // 10s auto sync
    return () => clearInterval(interval);
  }, []);

  // --- 1. DATA STRUCTURE: PRIORITY QUEUE (DESCENDING URGENCY) ---
  // Drives the Priority Queue card (highest priority first)
  const priorityQueueRequests = useMemo(() => {
    const pq = new PriorityQueue<ReliefRequest>();
    // Filter pending/actionable requests (Submitted or Approved)
    const pendingList = requests.filter(
      (r) => r.status === 'Submitted' || r.status === 'Approved'
    );
    for (const req of pendingList) {
      pq.enqueue(req, req.priority_score);
    }
    return pq.toArray();
  }, [requests]);

  // --- 4. DATA STRUCTURE: CIRCULAR QUEUE (FAIR VOLUNTEER ROTATION) ---
  // Picks next driver round-robin in target area first, or next available
  const suggestedDriverInfo = useMemo(() => {
    if (!allocatingRequest) return null;
    return CircularQueue.selectNextDriver(
      volunteers,
      allocatingRequest.area,
      0 // start rotation
    );
  }, [allocatingRequest, volunteers]);

  // Auto-set selected driver when drawer opens
  useEffect(() => {
    if (suggestedDriverInfo?.driver) {
      setSelectedDriverId(suggestedDriverInfo.driver.id);
    }
  }, [suggestedDriverInfo]);

  // --- 6 & 7. DATA STRUCTURES: SEARCHING & SORTING FOR REQUESTS TABLE ---
  const processedRequests = useMemo(() => {
    let result = [...requests];

    // Priority Categorization via Bucket / Counting Sort
    if (activePriorityBucket !== 'ALL') {
      const buckets = bucketSortByPriority(result);
      result = buckets[activePriorityBucket] || [];
    }

    // Searching: Binary Search if searching exact ID (e.g. "RL-0005"), else Linear Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      if (/^RL-\d{4}$/i.test(q)) {
        // Prepare array sorted by ID for Binary Search
        const sortedById = [...result].sort((a, b) => a.id.localeCompare(b.id));
        const bsResult = binarySearchById(sortedById, q);
        setSearchModeUsed(`Binary Search (${bsResult.comparisons} comparisons)`);
        result = bsResult.item ? [bsResult.item] : [];
      } else {
        const lsResult = linearSearch(result, q);
        setSearchModeUsed(`Linear Search (${lsResult.totalScanned} records scanned)`);
        result = lsResult.results;
      }
    }

    // Sorting via Handcrafted QuickSort or InsertionSort
    const compareFunctions: Record<string, (a: ReliefRequest, b: ReliefRequest) => number> = {
      priority: (a, b) => b.priority_score - a.priority_score, // descending
      time: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      people: (a, b) => b.people_affected - a.people_affected,
      area: (a, b) => a.area.localeCompare(b.area),
    };

    const comparator = compareFunctions[sortBy] || compareFunctions.priority;

    if (sortAlgorithm === 'quick') {
      result = quickSort(result, comparator);
    } else {
      result = insertionSort(result, comparator);
    }

    return result;
  }, [requests, activePriorityBucket, searchQuery, sortBy, sortAlgorithm]);

  // --- 8. DATA STRUCTURE: 2D MATRIX (AREA X ITEM DEMAND) ---
  const demandMatrix = useMemo(() => {
    // Gather all request items
    const allItems: Array<{ request_id: string; item_name: string; quantity: number }> = [];
    requests.forEach((r) => {
      if (r.items) {
        r.items.forEach((it) =>
          allItems.push({ request_id: r.id, item_name: it.item_name, quantity: it.quantity })
        );
      }
    });

    return DemandMatrix2D.buildFromRequests(requests, allItems, RELIEF_AREAS, ITEM_NAMES);
  }, [requests]);

  // Chart data: Requests by Area
  const areaChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    RELIEF_AREAS.forEach((a) => (counts[a] = 0));
    requests.forEach((r) => {
      counts[r.area] = (counts[r.area] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name: name.replace(' Sector', '').replace(' Valley', ' Vly'),
      count,
    }));
  }, [requests]);

  // Chart data: Status Split
  const statusSplitData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requests]);

  // Confirm Allocation (Atomic DB Transaction)
  const handleConfirmAllocation = async () => {
    if (!allocatingRequest || !selectedDriverId) {
      showToast('Please select a driver to dispatch', 'error');
      return;
    }

    const neededItems = allocatingRequest.items || [];
    setSubmittingAllocation(true);

    try {
      const res = await fetch('/api/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: allocatingRequest.id,
          volunteerId: selectedDriverId,
          allocatedItems: neededItems.map((it) => ({
            item_name: it.item_name,
            quantity: it.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Allocation transaction failed', 'error');
        setSubmittingAllocation(false);
        return;
      }

      // Push onto client Undo Stack (Data Structure: Stack)
      undoStack.push({
        requestId: allocatingRequest.id,
        assignmentId: data.assignment.id,
        restoredItems: neededItems.map((it) => ({
          item_name: it.item_name,
          quantity: it.quantity,
        })),
      });
      setUndoCount(undoStack.size());

      showToast(`Dispatched ${allocatingRequest.id} to driver!`, 'success');
      setAllocatingRequest(null);
      fetchAllData();
    } catch {
      showToast('Network failure during allocation dispatch', 'error');
    } finally {
      setSubmittingAllocation(false);
    }
  };

  // Undo Last Allocation (Data Structure: Stack LIFO Pop)
  const handleUndoLastAllocation = async () => {
    if (undoStack.isEmpty()) {
      showToast('No recent allocation to undo in the action stack.', 'info');
      return;
    }

    const lastAction = undoStack.pop();
    setUndoCount(undoStack.size());

    if (!lastAction) return;

    try {
      const res = await fetch('/api/allocate/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: lastAction.requestId,
          assignmentId: lastAction.assignmentId,
          restoredItems: lastAction.restoredItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to undo allocation', 'error');
        return;
      }

      showToast(`Reverted allocation for ${lastAction.requestId}. Supplies restored.`, 'success');
      fetchAllData();
    } catch {
      showToast('Error executing undo transaction', 'error');
    }
  };

  // Save Inline Stock Update
  const handleSaveStockUpdate = async (itemName: string) => {
    try {
      const res = await fetch('/api/stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName,
          quantityAvailable: editingStockQty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update stock', 'error');
        return;
      }

      showToast(`Inventory updated for ${itemName}`, 'success');
      setEditingStockItem(null);
      fetchAllData();
    } catch {
      showToast('Error saving inventory quantity', 'error');
    }
  };

  // Export Deliveries CSV
  const handleExportCSV = () => {
    const headers = ['Request ID', 'Requester', 'Area', 'Address', 'Status', 'Driver', 'Allocated At'];
    const rows = requests.map((r) => [
      r.id,
      `"${r.requester_name.replace(/"/g, '""')}"`,
      `"${r.area}"`,
      `"${r.address.replace(/"/g, '""')}"`,
      r.status,
      `"${r.assignment?.volunteer_name || 'Unassigned'}"`,
      r.assignment?.allocated_at ? new Date(r.assignment.allocated_at).toLocaleString() : 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relieflink-deliveries-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Deliveries CSV export generated', 'success');
  };

  // Stats calculation
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(
    (r) => r.status === 'Submitted' || r.status === 'Approved'
  ).length;
  const completedDeliveries = requests.filter((r) => r.status === 'Delivered').length;
  const availableVolunteers = volunteers.filter((v) => v.is_available).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Bar: Search, Stats, Undo Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized humanitarian triage, inventory allocation, and dispatch rotation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Top Search Box (Binary & Linear Search) */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID (RL-0001) or area..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          {/* Undo Last Allocation Button (Stack LIFO) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndoLastAllocation}
              disabled={undoCount === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                undoCount > 0
                  ? 'bg-white border-amber-300 text-amber-800 hover:bg-amber-50 shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Last Action</span>
              {undoCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {undoCount}
                </span>
              )}
            </button>
            <Tooltip content="Undo stack (LIFO): Reverts your most recent allocation dispatch, restoring warehouse stock and returning the request to triage." />
          </div>
        </div>
      </div>

      {/* Admin Layout: Slim Left Sidebar + Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Slim Left Sidebar */}
        <aside className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-card space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
                activeTab === 'overview'
                  ? 'bg-teal-50 text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-teal-600" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                activeTab === 'requests'
                  ? 'bg-teal-50 text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-teal-600" />
                Requests
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-mono">
                {requests.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
                activeTab === 'stock'
                  ? 'bg-teal-50 text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Box className="w-4 h-4 text-teal-600" />
              Stock Levels
            </button>
            <button
              onClick={() => setActiveTab('volunteers')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                activeTab === 'volunteers'
                  ? 'bg-teal-50 text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-teal-600" />
                Volunteers
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-mono">
                {availableVolunteers} on-call
              </span>
            </button>
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
                activeTab === 'deliveries'
                  ? 'bg-teal-50 text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4 text-teal-600" />
              Deliveries
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
                activeTab === 'activity'
                  ? 'bg-teal-50 text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4 text-teal-600" />
              Activity Feed
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-10 space-y-6">
          {/* TAB 1: OVERVIEW PAGE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 1. Four Stat Cards (Max 4 visible per row) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
                  <div className="text-xs font-medium text-slate-500">Total Requests</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{totalRequests}</div>
                  <div className="text-[11px] text-teal-700 font-medium mt-1">Across 6 relief sectors</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
                  <div className="text-xs font-medium text-slate-500">Pending Triage</div>
                  <div className="text-2xl font-bold text-amber-600 mt-1">{pendingRequests}</div>
                  <div className="text-[11px] text-amber-700 font-medium mt-1">Awaiting driver allocation</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
                  <div className="text-xs font-medium text-slate-500">Completed Deliveries</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">{completedDeliveries}</div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-1">Verified on site</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
                  <div className="text-xs font-medium text-slate-500">Available Couriers</div>
                  <div className="text-2xl font-bold text-teal-600 mt-1">{availableVolunteers}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    {volunteers.length} registered in roster
                  </div>
                </div>
              </div>

              {/* 2. "Priority Queue" Card (THE HERO) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Priority Queue</h2>
                    <Tooltip content="Priority Queue: Dynamic list ordered strictly descending by emergency urgency score (highest priority first). Inserted upon request submission, dequeued upon allocation." />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {priorityQueueRequests.length} Pending Incidents
                  </span>
                </div>

                {priorityQueueRequests.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-400">
                    All emergency requests currently allocated or resolved.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {priorityQueueRequests.slice(0, 6).map((req, rankIdx) => (
                      <div
                        key={req.id}
                        className="p-4 sm:px-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Rank & Requester Summary */}
                        <div className="flex items-start sm:items-center gap-3.5 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                            #{rankIdx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">{req.id}</span>
                              <span className="font-medium text-xs text-slate-800">{req.requester_name}</span>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {req.area}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                              <span className="font-medium text-slate-700">{req.people_affected} affected</span>
                              <span>•</span>
                              <span>{req.situation_type} incident</span>
                              {req.items && (
                                <div className="flex items-center gap-1">
                                  {req.items.map((it, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                                    >
                                      {it.item_name} ({it.quantity})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Priority Badge, Progress Bar, and Allocate CTA */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                              <span
                                className={`px-2 py-0.5 rounded-full ${
                                  req.priority_label === 'Critical'
                                    ? 'bg-rose-100 text-rose-800'
                                    : req.priority_label === 'High'
                                    ? 'bg-orange-100 text-orange-800'
                                    : req.priority_label === 'Medium'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {req.priority_label}
                              </span>
                              <span className="font-mono text-slate-700">{req.priority_score}%</span>
                            </div>
                            {/* Thin progress bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  req.priority_score >= 75
                                    ? 'bg-rose-500'
                                    : req.priority_score >= 50
                                    ? 'bg-orange-500'
                                    : req.priority_score >= 25
                                    ? 'bg-amber-500'
                                    : 'bg-teal-500'
                                }`}
                                style={{ width: `${Math.min(100, req.priority_score)}%` }}
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => setAllocatingRequest(req)}
                            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition-colors shrink-0"
                          >
                            Allocate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3 & 4. Stock Levels & Recharts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 3. Stock Levels Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Stock Levels</h3>
                      <Tooltip content="Live warehouse inventory tracking available vs. reserved quotas with low-stock amber warning thresholds." />
                    </div>
                    <button
                      onClick={() => setActiveTab('stock')}
                      className="text-xs text-teal-600 hover:underline font-semibold"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {stock.map((item) => {
                      const isLowStock = item.quantity_available <= item.min_threshold;
                      const percentage = Math.min(100, Math.round((item.quantity_available / 800) * 100));

                      return (
                        <div key={item.id} className="text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-800">{item.item_name}</span>
                            <span className="font-mono text-slate-500">
                              <strong className={isLowStock ? 'text-amber-600 font-bold' : 'text-slate-900'}>
                                {item.quantity_available}
                              </strong>{' '}
                              available ({item.quantity_reserved} reserved)
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isLowStock ? 'bg-amber-500' : 'bg-teal-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          {isLowStock && (
                            <div className="text-[10px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Low inventory threshold ({item.min_threshold} {item.unit})
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Requests by Area & Status Split (Recharts kept small) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Requests by Operating Area</h3>
                    <div className="h-36 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={areaChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Status Distribution</div>
                      <div className="text-[11px] text-slate-500">Incident resolution breakdown</div>
                    </div>
                    <div className="h-16 w-16">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusSplitData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={16}
                            outerRadius={28}
                          >
                            {statusSplitData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Recent Activity Feed (Doubly Linked List navigation) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Recent Incident Activity</h3>
                    <Tooltip content="Doubly Linked List Feed: Bidirectional cursor navigation allows coordinators to step forward and backward between older and newer audit trail records." />
                  </div>

                  {/* Newer / Older DLL navigation buttons */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <button
                      onClick={() => {
                        const prev = activityDLL.movePrevious();
                        if (prev) setCurrentActivityItem(prev);
                      }}
                      disabled={!activityDLL.hasPrevious()}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-medium"
                    >
                      ← Newer
                    </button>
                    <button
                      onClick={() => {
                        const next = activityDLL.moveNext();
                        if (next) setCurrentActivityItem(next);
                      }}
                      disabled={!activityDLL.hasNext()}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-medium"
                    >
                      Older →
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {activityLogs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{log.action_type}: </span>
                        <span>{JSON.stringify(log.details)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REQUESTS TABLE VIEW */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
              {/* Table Controls Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Incident Requests Register</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Search via {searchModeUsed} • Sorted via {sortAlgorithm === 'quick' ? 'QuickSort' : 'InsertionSort'}
                    </p>
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
                    >
                      <option value="priority">Priority Urgency</option>
                      <option value="time">Time Submitted</option>
                      <option value="people">People Affected</option>
                      <option value="area">Area / Sector</option>
                    </select>

                    <button
                      onClick={() => setSortAlgorithm(sortAlgorithm === 'quick' ? 'insertion' : 'quick')}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700"
                    >
                      Alg: {sortAlgorithm === 'quick' ? 'QuickSort' : 'Insertion'}
                    </button>
                  </div>
                </div>

                {/* Priority Category Filtering Tabs (Counting / Bucket Sort) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {(['ALL', 'Critical', 'High', 'Medium', 'Low'] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setActivePriorityBucket(b)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        activePriorityBucket === b
                          ? 'bg-teal-600 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Requests Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Request ID</th>
                      <th className="py-3 px-4">Requester</th>
                      <th className="py-3 px-4">Sector</th>
                      <th className="py-3 px-4">People</th>
                      <th className="py-3 px-4">Situation</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.id}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{r.requester_name}</td>
                        <td className="py-3 px-4 text-slate-600">{r.area}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{r.people_affected}</td>
                        <td className="py-3 px-4 text-slate-600">{r.situation_type}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold ${
                              r.priority_label === 'Critical'
                                ? 'bg-rose-100 text-rose-800'
                                : r.priority_label === 'High'
                                ? 'bg-orange-100 text-orange-800'
                                : r.priority_label === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {r.priority_label} ({r.priority_score}%)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700">{r.status}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {r.status === 'Submitted' || r.status === 'Approved' ? (
                            <button
                              onClick={() => setAllocatingRequest(r)}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
                            >
                              Allocate
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Dispatched</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: STOCK LEVELS & 2D DEMAND MATRIX */}
          {activeTab === 'stock' && (
            <div className="space-y-6">
              {/* Stock Inventory Table with Inline Editing */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Relief Inventory Warehouse</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click the edit icon to adjust inventory supplies inline
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stock.map((item) => {
                    const isEditing = editingStockItem === item.item_name;
                    const isLow = item.quantity_available <= item.min_threshold;

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isLow ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-slate-900">{item.item_name}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {item.category}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="number"
                              min="0"
                              value={editingStockQty}
                              onChange={(e) => setEditingStockQty(Number(e.target.value))}
                              className="w-24 px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                            />
                            <button
                              onClick={() => handleSaveStockUpdate(item.item_name)}
                              className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingStockItem(null)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-2">
                            <div>
                              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                                {item.quantity_available}{' '}
                                <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {item.quantity_reserved} reserved • Min alert: {item.min_threshold}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingStockItem(item.item_name);
                                setEditingStockQty(item.quantity_available);
                              }}
                              className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DATA STRUCTURE: 2D MATRIX HEAT MAP (AREA X ITEM DEMAND) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Demand Heat-Map by Sector</h2>
                    <Tooltip content="2D Array Data Structure: Rows represent geographic sectors, columns represent relief supplies. Cell values quantify active requested units to identify regional deficits." />
                  </div>
                  <span className="text-xs text-slate-500">Rows = Sectors • Columns = Supplies</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                        <th className="py-2.5 px-3 text-left font-semibold">Sector / Area</th>
                        {demandMatrix.items.map((it) => (
                          <th key={it} className="py-2.5 px-3 font-semibold text-slate-700">
                            {it}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 font-bold text-slate-900 bg-slate-100">Total Units</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {demandMatrix.areas.map((area, rIdx) => (
                        <tr key={area} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-left font-sans font-medium text-slate-800">
                            {area}
                          </td>
                          {demandMatrix.items.map((item, cIdx) => {
                            const val = demandMatrix.grid[rIdx][cIdx];
                            const intensity = val > 0 ? Math.min(1, val / demandMatrix.maxCell) : 0;
                            const bgStyle =
                              val === 0
                                ? 'bg-white text-slate-400'
                                : intensity > 0.6
                                ? 'bg-teal-600 text-white font-bold'
                                : intensity > 0.3
                                ? 'bg-teal-200 text-teal-900 font-semibold'
                                : 'bg-teal-50 text-teal-800';

                            return (
                              <td key={item} className={`py-2.5 px-3 ${bgStyle}`}>
                                {val}
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-3 font-bold text-slate-900 bg-slate-50">
                            {demandMatrix.rowTotals[rIdx]}
                          </td>
                        </tr>
                      ))}
                      {/* Column Totals */}
                      <tr className="border-t-2 border-slate-200 bg-slate-100 font-bold text-slate-900">
                        <td className="py-2.5 px-3 text-left font-sans">Item Demand Total</td>
                        {demandMatrix.colTotals.map((tot, idx) => (
                          <td key={idx} className="py-2.5 px-3">
                            {tot}
                          </td>
                        ))}
                        <td className="py-2.5 px-3 text-teal-700 font-black">
                          {demandMatrix.rowTotals.reduce((a, b) => a + b, 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VOLUNTEERS ROSTER */}
          {activeTab === 'volunteers' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Volunteer Courier Roster</h2>
                  <Tooltip content="Circular Queue Rotation: Drivers are assigned round-robin prioritizing on-call status and sector matching for equitable transit distribution." />
                </div>
                <span className="text-xs text-slate-500">{volunteers.length} Active Drivers</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {volunteers.map((vol, idx) => (
                  <div key={vol.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{vol.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{vol.email}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          vol.is_available
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {vol.is_available ? 'Available' : 'Offline'}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Sector:</span>
                        <span className="font-semibold text-slate-800">{vol.area}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Vehicle:</span>
                        <span className="font-semibold text-slate-800">{vol.vehicle}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Completed Trips:</span>
                        <span className="font-bold text-teal-700">{vol.total_deliveries}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DELIVERIES & EXPORT CSV */}
          {activeTab === 'deliveries' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Completed & In-Flight Deliveries</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Track drop-off history and download delivery reports</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Deliveries (CSV)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Request ID</th>
                      <th className="py-2.5 px-3">Recipient Address</th>
                      <th className="py-2.5 px-3">Assigned Courier</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Dispatched Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests
                      .filter((r) => r.status !== 'Submitted')
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.id}</td>
                          <td className="py-2.5 px-3 text-slate-700">{r.address}</td>
                          <td className="py-2.5 px-3 font-medium text-teal-700">
                            {r.assignment?.volunteer_name || 'Assigned Courier'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold ${
                                r.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">
                            {r.assignment?.allocated_at
                              ? new Date(r.assignment.allocated_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recent'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: FULL ACTIVITY AUDIT TRAIL */}
          {activeTab === 'activity' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Incident Audit Activity Log</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Immutable event log powered by Doubly Linked List navigation
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {activityLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{log.action_type}</div>
                      <div className="text-xs text-slate-600 mt-0.5 font-mono">
                        {JSON.stringify(log.details)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Initiated by {log.user_name || 'System'}</div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ADMIN ALLOCATION SIDE DRAWER (NOT A NEW PAGE!) */}
      {allocatingRequest && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-elevated flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Allocate Relief Dispatch</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Target: {allocatingRequest.id}</p>
              </div>
              <button
                onClick={() => setAllocatingRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Incident Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="font-semibold text-slate-900 text-sm">{allocatingRequest.requester_name}</div>
                <div className="text-slate-600">
                  Sector: <strong>{allocatingRequest.area}</strong> • {allocatingRequest.people_affected} People Affected
                </div>
                <div className="text-slate-500">{allocatingRequest.address}</div>
              </div>

              {/* Items Needed vs Stock Available (Auto-Check) */}
              <div>
                <div className="font-bold text-slate-800 mb-2">Inventory Sufficiency Check</div>
                <div className="space-y-2">
                  {(allocatingRequest.items || []).map((it) => {
                    const st = stock.find(
                      (s) => s.item_name.toLowerCase() === it.item_name.toLowerCase()
                    );
                    const available = st?.quantity_available || 0;
                    const isSufficient = available >= it.quantity;

                    return (
                      <div
                        key={it.item_name}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isSufficient ? 'border-slate-200 bg-white' : 'border-rose-200 bg-rose-50/50'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{it.item_name}</div>
                          <div className="text-[11px] text-slate-500">
                            Requested: <strong>{it.quantity}</strong> | Available in Hub: {available}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSufficient ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isSufficient ? 'In Stock' : 'Deficit'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Driver (From Circular Queue) + Override Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-bold text-slate-800">Assign Courier Driver</div>
                  {suggestedDriverInfo?.matchedByArea && (
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                      Sector Matched Rotation
                    </span>
                  )}
                </div>

                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.area} • {v.vehicle}) {v.is_available ? '• Available' : '• Busy'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Circular queue prioritizes available couriers stationed in {allocatingRequest.area}.
                </p>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setAllocatingRequest(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAllocation}
                onClick={handleConfirmAllocation}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs disabled:opacity-70"
              >
                {submittingAllocation ? 'Dispatching...' : 'Confirm Allocation (ACID Commit)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
