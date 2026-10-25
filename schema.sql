-- ReliefLink: Clean 3NF Normalized Database Schema for PostgreSQL / Supabase
-- Designed for reliable, acid-compliant disaster relief request handling and delivery.

-- Drop existing tables if needed (in reverse order of dependencies)
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS request_items CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS volunteers CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('requester', 'admin', 'volunteer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. VOLUNTEERS TABLE (1-to-1 extension of users for volunteer drivers)
CREATE TABLE volunteers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    area VARCHAR(100) NOT NULL,
    vehicle VARCHAR(50) NOT NULL CHECK (vehicle IN ('Motorcycle', 'Van', 'Truck', 'Pickup', 'Sedan')),
    is_available BOOLEAN NOT NULL DEFAULT true,
    total_deliveries INTEGER NOT NULL DEFAULT 0 CHECK (total_deliveries >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. STOCK TABLE (Central emergency relief inventory)
CREATE TABLE stock (
    id VARCHAR(36) PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    quantity_available INTEGER NOT NULL CHECK (quantity_available >= 0),
    quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    unit VARCHAR(30) NOT NULL,
    min_threshold INTEGER NOT NULL DEFAULT 20 CHECK (min_threshold >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. REQUESTS TABLE (Disaster relief requests)
CREATE TABLE requests (
    id VARCHAR(20) PRIMARY KEY, -- e.g. RL-0042
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requester_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    area VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    people_affected INTEGER NOT NULL CHECK (people_affected > 0),
    situation_type VARCHAR(50) NOT NULL CHECK (situation_type IN ('Flood', 'Fire', 'Earthquake', 'Medical', 'Other')),
    special_groups JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['Children', 'Elderly', 'Pregnant', 'Disabled']
    description TEXT,
    priority_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (priority_score >= 0 AND priority_score <= 100),
    priority_label VARCHAR(20) NOT NULL CHECK (priority_label IN ('Critical', 'High', 'Medium', 'Low')),
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Approved', 'Driver Assigned', 'On the way', 'Delivered', 'Declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. REQUEST_ITEMS TABLE (Many-to-one with requests, normalized line items)
CREATE TABLE request_items (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL REFERENCES stock(item_name) ON UPDATE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- 6. ASSIGNMENTS TABLE (Dispatches connecting requests to volunteer drivers)
CREATE TABLE assignments (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    volunteer_id VARCHAR(36) NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'Accepted', 'Picked Up', 'On the Way', 'Delivered', 'Declined')),
    notes TEXT,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMPTZ
);

-- 7. NOTIFICATIONS TABLE (In-app notifications for drivers, requesters, admins)
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. ACTIVITY_LOG TABLE (Audit trail of administrative actions and dispatches)
CREATE TABLE activity_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for fast lookup, priority queue sorting, and status filtering
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_priority ON requests(priority_score DESC);
CREATE INDEX idx_requests_area ON requests(area);
CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_volunteers_available_area ON volunteers(is_available, area);
CREATE INDEX idx_assignments_volunteer ON assignments(volunteer_id, status);
CREATE INDEX idx_assignments_request ON assignments(request_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
