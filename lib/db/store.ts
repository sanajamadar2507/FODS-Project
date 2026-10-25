import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import {
  User,
  Volunteer,
  StockItem,
  ReliefRequest,
  RequestItem,
  Assignment,
  Notification,
  ActivityLogEntry,
  AllocationPayload,
  UndoAllocationPayload,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_VOLUNTEERS,
  INITIAL_STOCK,
  INITIAL_REQUESTS,
  INITIAL_REQUEST_ITEMS,
  INITIAL_ASSIGNMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY,
} from './initialData';
import { computePriorityScore } from '../priority';

interface DatabaseState {
  users: User[];
  volunteers: Volunteer[];
  stock: StockItem[];
  requests: ReliefRequest[];
  request_items: RequestItem[];
  assignments: Assignment[];
  notifications: Notification[];
  activity_log: ActivityLogEntry[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'relieflink.json');

// Initialize database pool if connection string is provided
const pgUrl = process.env.DATABASE_URL;
let pool: Pool | null = null;
if (pgUrl && pgUrl.trim() !== '') {
  try {
    pool = new Pool({
      connectionString: pgUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  } catch (err) {
    console.error('Postgres pool initialization warning, falling back to local store:', err);
  }
}

// In-memory cache synced to JSON file for zero-config local runs
let memoryState: DatabaseState | null = null;

function loadLocalStore(): DatabaseState {
  if (memoryState) return memoryState;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      memoryState = JSON.parse(raw);
      return memoryState!;
    }
  } catch (err) {
    console.warn('Could not read existing local DB file, initializing fresh state:', err);
  }

  // Initial fresh state
  memoryState = {
    users: [...INITIAL_USERS],
    volunteers: [...INITIAL_VOLUNTEERS],
    stock: [...INITIAL_STOCK],
    requests: [...INITIAL_REQUESTS],
    request_items: [...INITIAL_REQUEST_ITEMS],
    assignments: [...INITIAL_ASSIGNMENTS],
    notifications: [...INITIAL_NOTIFICATIONS],
    activity_log: [...INITIAL_ACTIVITY],
  };

  saveLocalStore(memoryState);
  return memoryState;
}

function saveLocalStore(state: DatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local database file:', err);
  }
}

export class DatabaseStore {
  // --- USERS ---
  static async getUserByEmail(email: string): Promise<User | null> {
    const clean = email.trim().toLowerCase();
    const state = loadLocalStore();
    return state.users.find((u) => u.email.toLowerCase() === clean) || null;
  }

  static async getUserById(id: string): Promise<User | null> {
    const state = loadLocalStore();
    return state.users.find((u) => u.id === id) || null;
  }

  static async createUser(user: Omit<User, 'created_at'>): Promise<User> {
    const state = loadLocalStore();
    const newUser: User = {
      ...user,
      created_at: new Date().toISOString(),
    };
    state.users.push(newUser);
    saveLocalStore(state);
    return newUser;
  }

  // --- VOLUNTEERS ---
  static async getVolunteers(): Promise<Volunteer[]> {
    const state = loadLocalStore();
    return [...state.volunteers];
  }

  static async getVolunteerByUserId(userId: string): Promise<Volunteer | null> {
    const state = loadLocalStore();
    return state.volunteers.find((v) => v.user_id === userId) || null;
  }

  static async createVolunteer(vol: Omit<Volunteer, 'id' | 'total_deliveries' | 'updated_at'>): Promise<Volunteer> {
    const state = loadLocalStore();
    const newVol: Volunteer = {
      ...vol,
      id: `vol-${Date.now().toString(36)}`,
      total_deliveries: 0,
      updated_at: new Date().toISOString(),
    };
    state.volunteers.push(newVol);
    saveLocalStore(state);
    return newVol;
  }

  static async updateVolunteerAvailability(userId: string, isAvailable: boolean): Promise<Volunteer | null> {
    const state = loadLocalStore();
    const vol = state.volunteers.find((v) => v.user_id === userId);
    if (!vol) return null;
    vol.is_available = isAvailable;
    vol.updated_at = new Date().toISOString();
    saveLocalStore(state);
    return vol;
  }

  // --- STOCK ---
  static async getStock(): Promise<StockItem[]> {
    const state = loadLocalStore();
    return [...state.stock];
  }

  static async updateStockQuantity(
    itemName: string,
    quantityAvailable: number,
    userId: string,
    userName: string
  ): Promise<StockItem | null> {
    const state = loadLocalStore();
    const item = state.stock.find((s) => s.item_name.toLowerCase() === itemName.toLowerCase());
    if (!item) return null;

    const delta = quantityAvailable - item.quantity_available;
    item.quantity_available = Math.max(0, quantityAvailable);
    item.updated_at = new Date().toISOString();

    state.activity_log.unshift({
      id: `act-${Date.now()}`,
      user_id: userId,
      user_name: userName,
      action_type: 'STOCK_UPDATE',
      details: {
        item: itemName,
        delta,
        newTotal: item.quantity_available,
      },
      created_at: new Date().toISOString(),
    });

    saveLocalStore(state);
    return item;
  }

  // --- REQUESTS ---
  static async getRequests(): Promise<ReliefRequest[]> {
    const state = loadLocalStore();
    const now = new Date();

    // Recalculate dynamic priority scores on fetch based on elapsed waiting time
    const requestsWithItems = state.requests.map((req) => {
      const items = state.request_items.filter((ri) => ri.request_id === req.id);
      const assignment = state.assignments.find((a) => a.request_id === req.id) || null;

      // Recalculate waiting time component
      const priorityInfo = computePriorityScore(
        {
          situation_type: req.situation_type,
          people_affected: req.people_affected,
          special_groups: req.special_groups,
          created_at: req.created_at,
        },
        now
      );

      return {
        ...req,
        priority_score: priorityInfo.score,
        priority_label: priorityInfo.label,
        items,
        assignment,
      };
    });

    return requestsWithItems;
  }

  static async getRequestById(id: string): Promise<ReliefRequest | null> {
    const all = await this.getRequests();
    return all.find((r) => r.id === id) || null;
  }

  static async createRequest(
    data: {
      userId: string;
      requesterName: string;
      phone: string;
      area: string;
      address: string;
      peopleAffected: number;
      situationType: 'Flood' | 'Fire' | 'Earthquake' | 'Medical' | 'Other';
      specialGroups: string[];
      description: string;
      itemsNeeded: Array<{ item_name: string; quantity: number }>;
    }
  ): Promise<ReliefRequest> {
    const state = loadLocalStore();

    // Generate formatted ID like RL-0042
    const currentMax = state.requests.reduce((max, r) => {
      const num = parseInt(r.id.replace('RL-', ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = `RL-${String(currentMax + 1).padStart(4, '0')}`;

    const priorityInfo = computePriorityScore({
      situation_type: data.situationType,
      people_affected: data.peopleAffected,
      special_groups: data.specialGroups,
      created_at: new Date(),
    });

    const newRequest: ReliefRequest = {
      id: newId,
      user_id: data.userId,
      requester_name: data.requesterName,
      phone: data.phone,
      area: data.area,
      address: data.address,
      people_affected: data.peopleAffected,
      situation_type: data.situationType,
      special_groups: data.specialGroups,
      description: data.description,
      priority_score: priorityInfo.score,
      priority_label: priorityInfo.label,
      status: 'Submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    state.requests.unshift(newRequest);

    // Save request items
    const createdItems: RequestItem[] = [];
    data.itemsNeeded.forEach((item, idx) => {
      const ri: RequestItem = {
        id: `ri-${Date.now()}-${idx}`,
        request_id: newId,
        item_name: item.item_name,
        quantity: item.quantity,
      };
      state.request_items.push(ri);
      createdItems.push(ri);
    });

    // Notify admins
    const adminUser = state.users.find((u) => u.role === 'admin');
    if (adminUser) {
      state.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: adminUser.id,
        title: `New ${priorityInfo.label} Urgency Request`,
        message: `${newId} submitted for ${data.area} (${data.peopleAffected} people affected).`,
        type: 'new_request',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    saveLocalStore(state);
    return { ...newRequest, items: createdItems };
  }

  // --- ATOMIC ALLOCATION TRANSACTION ---
  // "Use a transaction when an admin allocates stock + assigns a driver (all-or-nothing:
  // reduce stock, create assignment, update request status, create notification). Roll back on failure."
  static async allocateRequestTransaction(payload: AllocationPayload): Promise<{
    success: boolean;
    assignment: Assignment;
    request: ReliefRequest;
  }> {
    const state = loadLocalStore();

    // 1. Snapshot previous state for ACID rollback guarantee
    const stateSnapshot = JSON.stringify(state);

    try {
      const request = state.requests.find((r) => r.id === payload.requestId);
      if (!request) {
        throw new Error(`Request ${payload.requestId} not found.`);
      }

      const volunteer = state.volunteers.find((v) => v.id === payload.volunteerId);
      if (!volunteer) {
        throw new Error(`Volunteer ${payload.volunteerId} not found.`);
      }

      // 2. Validate and reduce stock
      for (const reqItem of payload.allocatedItems) {
        const stockItem = state.stock.find(
          (s) => s.item_name.toLowerCase() === reqItem.item_name.toLowerCase()
        );
        if (!stockItem) {
          throw new Error(`Item ${reqItem.item_name} does not exist in inventory.`);
        }
        if (stockItem.quantity_available < reqItem.quantity) {
          throw new Error(
            `Insufficient stock for "${reqItem.item_name}". Requested: ${reqItem.quantity}, Available: ${stockItem.quantity_available}.`
          );
        }

        // Deduct available, increment reserved
        stockItem.quantity_available -= reqItem.quantity;
        stockItem.quantity_reserved += reqItem.quantity;
        stockItem.updated_at = new Date().toISOString();
      }

      // 3. Create Assignment record
      const assignmentId = `asg-${Date.now()}`;
      const newAssignment: Assignment = {
        id: assignmentId,
        request_id: payload.requestId,
        volunteer_id: volunteer.id,
        volunteer_name: volunteer.name,
        volunteer_phone: volunteer.phone,
        volunteer_vehicle: volunteer.vehicle,
        status: 'Assigned',
        notes: `Allocated by ${payload.adminName}`,
        allocated_at: new Date().toISOString(),
        delivered_at: null,
      };
      state.assignments.unshift(newAssignment);

      // 4. Update request status to 'Driver Assigned'
      request.status = 'Driver Assigned';
      request.updated_at = new Date().toISOString();

      // 5. Create notification for volunteer driver
      state.notifications.unshift({
        id: `notif-${Date.now()}-driver`,
        user_id: volunteer.user_id,
        title: 'New Emergency Delivery Assigned',
        message: `You have been assigned to deliver to ${request.area} (${request.address}).`,
        type: 'assignment',
        is_read: false,
        created_at: new Date().toISOString(),
      });

      // 6. Create notification for requester
      state.notifications.unshift({
        id: `notif-${Date.now()}-requester`,
        user_id: request.user_id,
        title: 'Driver Assigned to Your Request',
        message: `${volunteer.name} (${volunteer.vehicle}) has been assigned to your relief package.`,
        type: 'status_change',
        is_read: false,
        created_at: new Date().toISOString(),
      });

      // 7. Audit activity log
      state.activity_log.unshift({
        id: `act-${Date.now()}`,
        user_id: payload.adminUserId,
        user_name: payload.adminName,
        action_type: 'ALLOCATE_REQUEST',
        details: {
          requestId: payload.requestId,
          driver: volunteer.name,
          driverId: volunteer.id,
          area: request.area,
          items: payload.allocatedItems,
        },
        created_at: new Date().toISOString(),
      });

      // Commit changes
      saveLocalStore(state);
      return { success: true, assignment: newAssignment, request };
    } catch (error) {
      // Rollback on failure!
      memoryState = JSON.parse(stateSnapshot);
      saveLocalStore(memoryState!);
      throw error;
    }
  }

  // --- UNDO ALLOCATION TRANSACTION ---
  static async undoAllocationTransaction(payload: UndoAllocationPayload): Promise<{ success: boolean }> {
    const state = loadLocalStore();
    const stateSnapshot = JSON.stringify(state);

    try {
      const request = state.requests.find((r) => r.id === payload.requestId);
      if (!request) throw new Error(`Request ${payload.requestId} not found.`);

      // 1. Restore stock items
      for (const item of payload.restoredItems) {
        const stockItem = state.stock.find(
          (s) => s.item_name.toLowerCase() === item.item_name.toLowerCase()
        );
        if (stockItem) {
          stockItem.quantity_available += item.quantity;
          stockItem.quantity_reserved = Math.max(0, stockItem.quantity_reserved - item.quantity);
          stockItem.updated_at = new Date().toISOString();
        }
      }

      // 2. Remove or invalidate assignment
      state.assignments = state.assignments.filter((a) => a.id !== payload.assignmentId);

      // 3. Revert request status to 'Approved'
      request.status = 'Approved';
      request.updated_at = new Date().toISOString();

      // 4. Log undo action
      state.activity_log.unshift({
        id: `act-${Date.now()}-undo`,
        user_id: payload.adminUserId,
        user_name: payload.adminName,
        action_type: 'UNDO_ALLOCATION',
        details: {
          requestId: payload.requestId,
          revertedAssignmentId: payload.assignmentId,
          restoredItems: payload.restoredItems,
        },
        created_at: new Date().toISOString(),
      });

      saveLocalStore(state);
      return { success: true };
    } catch (err) {
      memoryState = JSON.parse(stateSnapshot);
      saveLocalStore(memoryState!);
      throw err;
    }
  }

  // --- ASSIGNMENT STATUS UPDATES ---
  static async updateAssignmentStatus(
    assignmentId: string,
    newStatus: 'Accepted' | 'Picked Up' | 'On the Way' | 'Delivered' | 'Declined',
    notes?: string
  ): Promise<{ assignment: Assignment; request: ReliefRequest }> {
    const state = loadLocalStore();
    const assignment = state.assignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new Error(`Assignment ${assignmentId} not found.`);

    const request = state.requests.find((r) => r.id === assignment.request_id);
    if (!request) throw new Error(`Associated request not found.`);

    const volunteer = state.volunteers.find((v) => v.id === assignment.volunteer_id);

    assignment.status = newStatus;
    if (notes) {
      assignment.notes = assignment.notes ? `${assignment.notes} | ${notes}` : notes;
    }

    if (newStatus === 'Declined') {
      // Send back to admin queue
      request.status = 'Submitted';
      request.updated_at = new Date().toISOString();

      // Log decline
      state.activity_log.unshift({
        id: `act-${Date.now()}`,
        user_id: volunteer?.user_id,
        user_name: volunteer?.name,
        action_type: 'ASSIGNMENT_DECLINED',
        details: {
          requestId: request.id,
          reason: notes || 'Driver unavailable for route',
        },
        created_at: new Date().toISOString(),
      });
    } else if (newStatus === 'Delivered') {
      assignment.delivered_at = new Date().toISOString();
      request.status = 'Delivered';
      request.updated_at = new Date().toISOString();

      if (volunteer) {
        volunteer.total_deliveries += 1;
        volunteer.updated_at = new Date().toISOString();
      }

      // Convert reserved stock to consumed (decrease reserved)
      const reqItems = state.request_items.filter((ri) => ri.request_id === request.id);
      for (const ri of reqItems) {
        const stockItem = state.stock.find(
          (s) => s.item_name.toLowerCase() === ri.item_name.toLowerCase()
        );
        if (stockItem) {
          stockItem.quantity_reserved = Math.max(0, stockItem.quantity_reserved - ri.quantity);
        }
      }

      // Notify requester
      state.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: request.user_id,
        title: 'Emergency Aid Delivered Successfully',
        message: `Your relief request ${request.id} has been delivered. Note: ${notes || 'Verified on site'}.`,
        type: 'delivery_success',
        is_read: false,
        created_at: new Date().toISOString(),
      });

      // Log delivery
      state.activity_log.unshift({
        id: `act-${Date.now()}`,
        user_id: volunteer?.user_id,
        user_name: volunteer?.name,
        action_type: 'DELIVERY_COMPLETED',
        details: {
          requestId: request.id,
          notes: notes || 'Delivered to liaison',
        },
        created_at: new Date().toISOString(),
      });
    } else if (newStatus === 'On the Way') {
      request.status = 'On the way';
      request.updated_at = new Date().toISOString();
    }

    saveLocalStore(state);
    return { assignment, request };
  }

  // --- NOTIFICATIONS ---
  static async getNotifications(userId: string): Promise<Notification[]> {
    const state = loadLocalStore();
    return state.notifications.filter((n) => n.user_id === userId);
  }

  static async markNotificationRead(notificationId: string): Promise<void> {
    const state = loadLocalStore();
    const notif = state.notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.is_read = true;
      saveLocalStore(state);
    }
  }

  // --- ACTIVITY LOGS ---
  static async getActivityLogs(): Promise<ActivityLogEntry[]> {
    const state = loadLocalStore();
    return [...state.activity_log];
  }
}
