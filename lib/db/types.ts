export type UserRole = 'requester' | 'admin' | 'volunteer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
}

export interface Volunteer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  vehicle: 'Motorcycle' | 'Van' | 'Truck' | 'Pickup' | 'Sedan';
  is_available: boolean;
  total_deliveries: number;
  updated_at: string;
}

export interface StockItem {
  id: string;
  item_name: string;
  category: string;
  quantity_available: number;
  quantity_reserved: number;
  unit: string;
  min_threshold: number;
  updated_at: string;
}

export type RequestStatus =
  | 'Submitted'
  | 'Approved'
  | 'Driver Assigned'
  | 'On the way'
  | 'Delivered'
  | 'Declined';

export type PriorityLabel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ReliefRequest {
  id: string; // RL-0042
  user_id: string;
  requester_name: string;
  phone: string;
  area: string;
  address: string;
  people_affected: number;
  situation_type: 'Flood' | 'Fire' | 'Earthquake' | 'Medical' | 'Other';
  special_groups: string[];
  description: string;
  priority_score: number;
  priority_label: PriorityLabel;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  items?: RequestItem[];
  assignment?: Assignment | null;
}

export interface RequestItem {
  id: string;
  request_id: string;
  item_name: string;
  quantity: number;
}

export type AssignmentStatus =
  | 'Assigned'
  | 'Accepted'
  | 'Picked Up'
  | 'On the Way'
  | 'Delivered'
  | 'Declined';

export interface Assignment {
  id: string;
  request_id: string;
  volunteer_id: string;
  volunteer_name?: string;
  volunteer_phone?: string;
  volunteer_vehicle?: string;
  status: AssignmentStatus;
  notes?: string;
  allocated_at: string;
  delivered_at?: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id?: string;
  user_name?: string;
  action_type: string;
  details: Record<string, any>;
  created_at: string;
}

export interface AllocationPayload {
  requestId: string;
  volunteerId: string;
  allocatedItems: Array<{ item_name: string; quantity: number }>;
  adminUserId: string;
  adminName: string;
}

export interface UndoAllocationPayload {
  requestId: string;
  assignmentId: string;
  restoredItems: Array<{ item_name: string; quantity: number }>;
  adminUserId: string;
  adminName: string;
}
