-- ReliefLink: Production Seed Data
-- 1 Admin, 3 Volunteers, 3 Requesters, 6 Stock items, 12 Requests across diverse areas, Initial Assignments & Logs.

-- Password for all seed users is: password123
-- Bcrypt hash generated with 10 salt rounds: $2a$10$w09Z9mGqVwYc6n.3YqQ1zOFgEceB88v4oO7x8N1n.9V/PqKjG1o8q

-- 1. USERS
INSERT INTO users (id, name, email, phone, password_hash, role, created_at) VALUES
('usr-admin-01', 'Elena Vance', 'admin@relieflink.org', '+1-555-0100', '$2a$10$w09Z9mGqVwYc6n.3YqQ1zOFgEceB88v4oO7x8N1n.9V/PqKjG1o8q', 'admin', NOW() - INTERVAL '30 days'),
('usr-vol-01', 'Marcus Bennett', 'marcus.driver@relieflink.org', '+1-555-0201', '$2a$10$w09Z9mGqVwYc6n.3YqQ1zOFgEceB88v4oO7x8N1n.9V/PqKjG1o8q', 'volunteer', NOW() - INTERVAL '25 days'),
('usr-vol-02', 'Aisha Patel', 'aisha.driver@relieflink.org', '+1-555-0202', '$2a$10$w09Z9mGqVwYc6n.3YqQ1zOFgEceB88v4oO7x8N1n.9V/PqKjG1o8q', 'volunteer', NOW() - INTERVAL '20 days'),
('usr-vol-03', 'Carlos Mendez', 'carlos.driver@relieflink.org', '+1-555-0203', '$2a$10$w09Z9mGqVwYc6n.3YqQ1zOFgEceB88v4oO7x8N1n.9V/PqKjG1o8q', 'volunteer', NOW() - INTERVAL '15 days'),
('usr-req-01', 'Sarah Jenkins', 'sarah.jenkins@example.com', '+1-555-0301', '$2a$10$w09Z9mGqVwYc6n.3YqQ1zOFgEceB88v4oO7x8N1n.9V/PqKjG1o8q', 'requester', NOW() - INTERVAL '10 days'),
('usr-req-02', 'David Kim', 'david.kim@example.com', '+1-555-0302', '$2a$10$w09Z9mGqVwYc6n.3YqQ1zOFgEceB88v4oO7x8N1n.9V/PqKjG1o8q', 'requester', NOW() - INTERVAL '8 days'),
('usr-req-03', 'Priya Sharma', 'priya.sharma@example.com', '+1-555-0303', '$2a$10$w09Z9mGqVwYc6n.3YqQ1zOFgEceB88v4oO7x8N1n.9V/PqKjG1o8q', 'requester', NOW() - INTERVAL '5 days');

-- 2. VOLUNTEERS
INSERT INTO volunteers (id, user_id, area, vehicle, is_available, total_deliveries, updated_at) VALUES
('vol-01', 'usr-vol-01', 'North Sector', 'Van', true, 18, NOW()),
('vol-02', 'usr-vol-02', 'River Valley', 'Pickup', true, 14, NOW()),
('vol-03', 'usr-vol-03', 'Coastal Belt', 'Motorcycle', true, 9, NOW());

-- 3. STOCK
INSERT INTO stock (id, item_name, category, quantity_available, quantity_reserved, unit, min_threshold, updated_at) VALUES
('stk-01', 'Food packets', 'Food', 650, 45, 'boxes', 100, NOW()),
('stk-02', 'Drinking water', 'Water', 820, 60, 'packs (24L)', 150, NOW()),
('stk-03', 'Medicine kits', 'Medical', 140, 20, 'trauma kits', 40, NOW()),
('stk-04', 'Blankets', 'Shelter', 410, 35, 'warm blankets', 80, NOW()),
('stk-05', 'Tents', 'Shelter', 85, 12, 'family tents', 25, NOW()),
('stk-06', 'Clothes', 'Apparel', 320, 25, 'bundles', 60, NOW());

-- 4. REQUESTS (12 items across areas)
INSERT INTO requests (id, user_id, requester_name, phone, area, address, people_affected, situation_type, special_groups, description, priority_score, priority_label, status, created_at, updated_at) VALUES
('RL-0001', 'usr-req-01', 'Sarah Jenkins', '+1-555-0301', 'River Valley', '442 Riverside Ave, Sector 4', 28, 'Flood', '["Children", "Elderly", "Disabled"]'::jsonb, 'Rapid flash flood entered lower ground floors. Urgent need for clean drinking water and pediatric kits.', 94.50, 'Critical', 'Submitted', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
('RL-0002', 'usr-req-02', 'David Kim', '+1-555-0302', 'North Sector', '128 Highland Loop, Block B', 42, 'Earthquake', '["Children", "Elderly", "Pregnant"]'::jsonb, 'Structural damage to community hall serving displaced families. Requires blankets, water, and rations.', 91.20, 'Critical', 'Submitted', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
('RL-0003', 'usr-req-03', 'Priya Sharma', '+1-555-0303', 'Coastal Belt', '89 Lighthouse Point, Jetty 3', 15, 'Flood', '["Elderly"]'::jsonb, 'Waterlogged access road. Elderly nursing care group cut off from fresh food delivery.', 76.80, 'Critical', 'Approved', NOW() - INTERVAL '7 hours', NOW() - INTERVAL '2 hours'),
('RL-0004', 'usr-req-01', 'Marcus Vance (via Sarah)', '+1-555-0301', 'East Metro', '710 Industrial Way, Warehouse 9', 19, 'Fire', '["Children"]'::jsonb, 'Evacuees from warehouse fire sheltered in gymnasium. Clothes and food rations needed.', 68.40, 'High', 'Submitted', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
('RL-0005', 'usr-req-02', 'Community Shelter 3', '+1-555-0302', 'River Valley', '302 Elmwood Drive', 35, 'Flood', '["Children", "Elderly"]'::jsonb, 'Flood water subsiding but municipal water grid remains contaminated. Need water packs and food.', 72.10, 'High', 'Driver Assigned', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '1 hour'),
('RL-0006', 'usr-req-03', 'Priya Sharma', '+1-555-0303', 'North Sector', '55 Pine Hill Road', 8, 'Medical', '["Elderly", "Disabled"]'::jsonb, 'Diabetic and chronic condition care patients isolated due to debris blockage.', 64.30, 'High', 'Submitted', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('RL-0007', 'usr-req-01', 'Sarah Jenkins', '+1-555-0301', 'Highland Ridge', '904 Timberline Pass', 12, 'Other', '["Children"]'::jsonb, 'Power grid failure following severe storm. Non-perishable food and blankets needed.', 48.50, 'Medium', 'Submitted', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
('RL-0008', 'usr-req-02', 'David Kim', '+1-555-0302', 'East Metro', '215 Commerce Blvd, Suite 10', 14, 'Fire', '[]'::jsonb, 'Displaced families awaiting structural inspection. Dry food packets required.', 42.00, 'Medium', 'Approved', NOW() - INTERVAL '9 hours', NOW() - INTERVAL '3 hours'),
('RL-0009', 'usr-req-03', 'Coastal Relief Center', '+1-555-0303', 'Coastal Belt', '14 Marina Pier Road', 22, 'Flood', '["Elderly"]'::jsonb, 'Staging hub serving shoreline fishing village. Blankets and dry rations requested.', 58.70, 'High', 'On the way', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '30 minutes'),
('RL-0010', 'usr-req-01', 'Sarah Jenkins', '+1-555-0301', 'Industrial Zone', '88 Foundry Lane', 6, 'Other', '[]'::jsonb, 'Workforce temporary bivouac during transit stoppage. Water and meal rations.', 28.40, 'Low', 'Submitted', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours'),
('RL-0011', 'usr-req-02', 'David Kim', '+1-555-0302', 'North Sector', '614 Summit Crest', 10, 'Flood', '[]'::jsonb, 'Basement inundation cleared; requested replenishment of basic emergency kits.', 33.10, 'Low', 'Delivered', NOW() - INTERVAL '24 hours', NOW() - INTERVAL '6 hours'),
('RL-0012', 'usr-req-03', 'Priya Sharma', '+1-555-0303', 'River Valley', '17 Riverbank Crescent', 25, 'Flood', '["Children"]'::jsonb, 'Delivered safe drinking water and meal rations to community kitchen.', 62.00, 'High', 'Delivered', NOW() - INTERVAL '30 hours', NOW() - INTERVAL '14 hours');

-- 5. REQUEST_ITEMS
INSERT INTO request_items (id, request_id, item_name, quantity) VALUES
('ri-01-1', 'RL-0001', 'Drinking water', 30),
('ri-01-2', 'RL-0001', 'Medicine kits', 8),
('ri-01-3', 'RL-0001', 'Food packets', 25),
('ri-02-1', 'RL-0002', 'Food packets', 40),
('ri-02-2', 'RL-0002', 'Drinking water', 45),
('ri-02-3', 'RL-0002', 'Blankets', 30),
('ri-02-4', 'RL-0002', 'Tents', 4),
('ri-03-1', 'RL-0003', 'Food packets', 15),
('ri-03-2', 'RL-0003', 'Drinking water', 20),
('ri-03-3', 'RL-0003', 'Medicine kits', 5),
('ri-04-1', 'RL-0004', 'Clothes', 20),
('ri-04-2', 'RL-0004', 'Food packets', 20),
('ri-04-3', 'RL-0004', 'Blankets', 15),
('ri-05-1', 'RL-0005', 'Drinking water', 35),
('ri-05-2', 'RL-0005', 'Food packets', 30),
('ri-06-1', 'RL-0006', 'Medicine kits', 8),
('ri-06-2', 'RL-0006', 'Drinking water', 10),
('ri-07-1', 'RL-0007', 'Food packets', 12),
('ri-07-2', 'RL-0007', 'Blankets', 12),
('ri-08-1', 'RL-0008', 'Food packets', 15),
('ri-08-2', 'RL-0008', 'Drinking water', 15),
('ri-09-1', 'RL-0009', 'Blankets', 20),
('ri-09-2', 'RL-0009', 'Drinking water', 25),
('ri-10-1', 'RL-0010', 'Drinking water', 10),
('ri-10-2', 'RL-0010', 'Food packets', 8),
('ri-11-1', 'RL-0011', 'Medicine kits', 5),
('ri-11-2', 'RL-0011', 'Drinking water', 12),
('ri-12-1', 'RL-0012', 'Food packets', 25),
('ri-12-2', 'RL-0012', 'Drinking water', 25);

-- 6. ASSIGNMENTS
INSERT INTO assignments (id, request_id, volunteer_id, status, notes, allocated_at, delivered_at) VALUES
('asg-01', 'RL-0005', 'vol-02', 'Assigned', 'Urgent dispatch for flood relief shelter in River Valley.', NOW() - INTERVAL '1 hour', NULL),
('asg-02', 'RL-0009', 'vol-03', 'On the Way', 'Navigating coastal feeder road with motorcycle supply crates.', NOW() - INTERVAL '3 hours', NULL),
('asg-03', 'RL-0011', 'vol-01', 'Delivered', 'Delivered to resident liaison on site. Recipient signed confirmation.', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '6 hours'),
('asg-04', 'RL-0012', 'vol-02', 'Delivered', 'Received safely by community kitchen supervisor.', NOW() - INTERVAL '28 hours', NOW() - INTERVAL '14 hours');

-- 7. NOTIFICATIONS
INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES
('notif-01', 'usr-vol-02', 'New Delivery Dispatched', 'You have been assigned request RL-0005 at 302 Elmwood Drive, River Valley.', 'assignment', false, NOW() - INTERVAL '1 hour'),
('notif-02', 'usr-vol-03', 'Dispatch In Progress', 'Request RL-0009 accepted. Safe transit to 14 Marina Pier Road, Coastal Belt.', 'assignment', true, NOW() - INTERVAL '3 hours'),
('notif-03', 'usr-req-02', 'Driver En Route', 'A volunteer driver has been assigned to your request RL-0005.', 'status_change', false, NOW() - INTERVAL '1 hour'),
('notif-04', 'usr-admin-01', 'High Priority Request Logged', 'Critical flood relief request RL-0001 submitted from River Valley.', 'alert', false, NOW() - INTERVAL '3 hours');

-- 8. ACTIVITY LOG
INSERT INTO activity_log (id, user_id, action_type, details, created_at) VALUES
('act-01', 'usr-admin-01', 'ALLOCATE_REQUEST', '{"requestId": "RL-0005", "driver": "Aisha Patel", "area": "River Valley", "items": [{"name": "Drinking water", "qty": 35}, {"name": "Food packets", "qty": 30}]}'::jsonb, NOW() - INTERVAL '1 hour'),
('act-02', 'usr-vol-03', 'STATUS_UPDATE', '{"requestId": "RL-0009", "previousStatus": "Driver Assigned", "newStatus": "On the way"}'::jsonb, NOW() - INTERVAL '30 minutes'),
('act-03', 'usr-vol-01', 'DELIVERY_COMPLETED', '{"requestId": "RL-0011", "notes": "Delivered to resident liaison on site."}'::jsonb, NOW() - INTERVAL '6 hours'),
('act-04', 'usr-vol-02', 'DELIVERY_COMPLETED', '{"requestId": "RL-0012", "notes": "Received safely by community kitchen supervisor."}'::jsonb, NOW() - INTERVAL '14 hours'),
('act-05', 'usr-admin-01', 'STOCK_UPDATE', '{"item": "Drinking water", "delta": 200, "newTotal": 820}'::jsonb, NOW() - INTERVAL '18 hours');
