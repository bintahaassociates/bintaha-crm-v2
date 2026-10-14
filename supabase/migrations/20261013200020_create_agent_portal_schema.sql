/*
# Agent Portal & Silent Watchdog Schema for Bin Taha Associates CRM

## Overview
Creates the complete database schema for the Agent Portal and Silent Watchdog Activity Tracker.
Supports staff login via access codes, property inventory management, client lead tracking,
deal/booking logging, and silent background activity tracking visible on the Owner Master Dashboard.

## New Tables
1. staff_members - agents/staff with access_code + pin_hash login (SHA-256 hashed PINs)
2. properties - real estate plots/inventory with status (available/reserved/sold)
3. client_leads - potential clients managed by agents
4. deals - bookings/sales transactions
5. staff_activities - Silent Watchdog tracking table (staff_id, action_type, target_entity, metadata, created_at)

## Security
- All tables have RLS enabled with TO anon, authenticated (single-tenant CRM using access-code auth)
*/

CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Sales Agent',
  access_code text UNIQUE NOT NULL,
  pin_hash text NOT NULL,
  phone text,
  email text,
  monthly_target numeric NOT NULL DEFAULT 5000000,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_staff" ON staff_members;
CREATE POLICY "anon_select_staff" ON staff_members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_staff" ON staff_members;
CREATE POLICY "anon_insert_staff" ON staff_members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_staff" ON staff_members;
CREATE POLICY "anon_update_staff" ON staff_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_staff" ON staff_members;
CREATE POLICY "anon_delete_staff" ON staff_members FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  plot_number text NOT NULL,
  block text,
  size text,
  price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  assigned_agent_id uuid REFERENCES staff_members(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_properties" ON properties;
CREATE POLICY "anon_select_properties" ON properties FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_properties" ON properties;
CREATE POLICY "anon_insert_properties" ON properties FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_properties" ON properties;
CREATE POLICY "anon_update_properties" ON properties FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_properties" ON properties;
CREATE POLICY "anon_delete_properties" ON properties FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS client_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES staff_members(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  budget_min numeric,
  budget_max numeric,
  interested_project text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'negotiating', 'won', 'lost')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE client_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_leads" ON client_leads;
CREATE POLICY "anon_select_leads" ON client_leads FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_leads" ON client_leads;
CREATE POLICY "anon_insert_leads" ON client_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_leads" ON client_leads;
CREATE POLICY "anon_update_leads" ON client_leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_leads" ON client_leads;
CREATE POLICY "anon_delete_leads" ON client_leads FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES staff_members(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_phone text,
  deal_type text NOT NULL DEFAULT 'booking' CHECK (deal_type IN ('booking', 'sale')),
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_deals" ON deals;
CREATE POLICY "anon_select_deals" ON deals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_deals" ON deals;
CREATE POLICY "anon_insert_deals" ON deals FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_deals" ON deals;
CREATE POLICY "anon_update_deals" ON deals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_deals" ON deals;
CREATE POLICY "anon_delete_deals" ON deals FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS staff_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff_members(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_entity text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE staff_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_activities" ON staff_activities;
CREATE POLICY "anon_select_activities" ON staff_activities FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_activities" ON staff_activities;
CREATE POLICY "anon_insert_activities" ON staff_activities FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_activities" ON staff_activities;
CREATE POLICY "anon_update_activities" ON staff_activities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_activities" ON staff_activities;
CREATE POLICY "anon_delete_activities" ON staff_activities FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_project ON properties(project_name);
CREATE INDEX IF NOT EXISTS idx_leads_agent ON client_leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_deals_agent ON deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_activities_staff ON staff_activities(staff_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON staff_activities(created_at DESC);

-- Seed staff with correct SHA-256 PIN hashes
-- BT-FATIMA-101 / pin: 1234
-- BT-ALI-104 / pin: 5678
-- BT-BILAL-107 / pin: 4321
INSERT INTO staff_members (name, role, access_code, pin_hash, phone, email, monthly_target, active) VALUES
  ('Fatima Khan', 'Senior Sales Agent', 'BT-FATIMA-101', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '+923001234567', 'fatima@bintaha.pk', 8000000, true),
  ('Ali Ahmed', 'Sales Executive', 'BT-ALI-104', 'f8638b979b2f4f793ddb6dbd197e0ee25a7a6ea32b0ae22f5e3c5d119d839e75', '+923009876543', 'ali@bintaha.pk', 5000000, true),
  ('Bilal Hasan', 'Field Agent', 'BT-BILAL-107', 'fe2592b42a727e977f055947385b709cc82b16b9a87f88c6abf3900d65d0cdc3', '+923334567890', 'bilal@bintaha.pk', 4000000, true)
ON CONFLICT (access_code) DO NOTHING;

INSERT INTO properties (project_name, plot_number, block, size, price, status) VALUES
  ('LDA Avenue 1', 'A-101', 'Block A', '5 Marla', 3500000, 'available'),
  ('LDA Avenue 1', 'A-102', 'Block A', '5 Marla', 3550000, 'available'),
  ('LDA Avenue 1', 'B-201', 'Block B', '10 Marla', 6500000, 'reserved'),
  ('LDA Avenue 1', 'B-202', 'Block B', '10 Marla', 6600000, 'available'),
  ('LDA Avenue 1', 'C-301', 'Block C', '1 Kanal', 12000000, 'sold'),
  ('Jubilee Town', 'J-15', 'Block D', '5 Marla', 3200000, 'available'),
  ('Jubilee Town', 'J-16', 'Block D', '5 Marla', 3250000, 'available'),
  ('Jubilee Town', 'J-25', 'Block E', '10 Marla', 6200000, 'reserved'),
  ('Johar Town', 'JT-401', 'Block F', '5 Marla', 3800000, 'available'),
  ('Johar Town', 'JT-402', 'Block F', '5 Marla', 3850000, 'sold'),
  ('Johar Town', 'JT-403', 'Block G', '10 Marla', 7200000, 'available'),
  ('Johar Town', 'JT-501', 'Block H', '1 Kanal', 15000000, 'available')
ON CONFLICT DO NOTHING;

INSERT INTO client_leads (agent_id, name, phone, email, budget_min, budget_max, interested_project, status, notes)
SELECT id, 'Ahmed Raza', '+923211234567', 'ahmed@email.com', 3000000, 5000000, 'LDA Avenue 1', 'interested', 'Looking for 5 Marla in Block A'
FROM staff_members WHERE access_code = 'BT-FATIMA-101'
ON CONFLICT DO NOTHING;

INSERT INTO client_leads (agent_id, name, phone, email, budget_min, budget_max, interested_project, status, notes)
SELECT id, 'Sana Malik', '+923459876543', 'sana@email.com', 6000000, 8000000, 'Johar Town', 'negotiating', 'Wants 10 Marla, negotiating price'
FROM staff_members WHERE access_code = 'BT-FATIMA-101'
ON CONFLICT DO NOTHING;

INSERT INTO client_leads (agent_id, name, phone, email, budget_min, budget_max, interested_project, status, notes)
SELECT id, 'Kamran Sheikh', '+923338889990', 'kamran@email.com', 3000000, 4000000, 'Jubilee Town', 'new', 'Walk-in inquiry'
FROM staff_members WHERE access_code = 'BT-ALI-104'
ON CONFLICT DO NOTHING;

INSERT INTO client_leads (agent_id, name, phone, email, budget_min, budget_max, interested_project, status, notes)
SELECT id, 'Nadia Aslam', '+923015556677', 'nadia@email.com', 12000000, 15000000, 'Johar Town', 'contacted', 'Interested in 1 Kanal'
FROM staff_members WHERE access_code = 'BT-ALI-104'
ON CONFLICT DO NOTHING;

INSERT INTO deals (property_id, agent_id, client_name, client_phone, deal_type, amount, status)
SELECT p.id, s.id, 'Tariq Mehmood', '+923001122334', 'booking', 6500000, 'confirmed'
FROM staff_members s, properties p
WHERE s.access_code = 'BT-FATIMA-101' AND p.project_name = 'LDA Avenue 1' AND p.plot_number = 'B-201'
ON CONFLICT DO NOTHING;
