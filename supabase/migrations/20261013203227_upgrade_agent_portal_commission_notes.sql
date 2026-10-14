/*
# Agent Portal Upgrade: Commission, Call Notes, Follow-ups

## Overview
Adds commission tracking, call note logging, and follow-up date support to the existing
Agent Portal schema. These power the new Commission & Wallet Widget, Today's Action Center,
and Quick Call Note Logger features.

## Changes

### 1. staff_members table — new columns
- `commission_rate` (numeric, default 1.0) — percentage of deal amount earned as commission
- `tier` (text, default 'Bronze') — reward tier: Bronze, Silver, or Gold Eagle

### 2. deals table — new columns
- `commission_earned` (numeric, default 0) — commission amount for this deal
- `commission_paid` (boolean, default false) — whether commission has been disbursed

### 3. client_leads table — new columns
- `follow_up_date` (date, nullable) — scheduled follow-up date for the lead
- `pipeline_stage` (text, default 'new') — kanban stage: new, call_made, site_visit, token_received, deal_closed

### 4. New table: call_notes
- Records quick call notes logged by agents, silently tracked to Watchdog
- Fields: id, staff_id, lead_id, note_text, call_duration_sec, created_at

## Security
- call_notes table has RLS enabled with TO anon, authenticated (single-tenant CRM)
- All existing tables retain their current policies
*/

-- Add commission columns to staff_members
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_members' AND column_name = 'commission_rate') THEN
    ALTER TABLE staff_members ADD COLUMN commission_rate numeric NOT NULL DEFAULT 1.0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_members' AND column_name = 'tier') THEN
    ALTER TABLE staff_members ADD COLUMN tier text NOT NULL DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold Eagle'));
  END IF;
END $$;

-- Add commission columns to deals
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'commission_earned') THEN
    ALTER TABLE deals ADD COLUMN commission_earned numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'commission_paid') THEN
    ALTER TABLE deals ADD COLUMN commission_paid boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add follow_up_date and pipeline_stage to client_leads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'follow_up_date') THEN
    ALTER TABLE client_leads ADD COLUMN follow_up_date date;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_leads' AND column_name = 'pipeline_stage') THEN
    ALTER TABLE client_leads ADD COLUMN pipeline_stage text NOT NULL DEFAULT 'new' CHECK (pipeline_stage IN ('new', 'call_made', 'site_visit', 'token_received', 'deal_closed'));
  END IF;
END $$;

-- Create call_notes table
CREATE TABLE IF NOT EXISTS call_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff_members(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES client_leads(id) ON DELETE CASCADE,
  note_text text NOT NULL,
  call_duration_sec integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE call_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_call_notes" ON call_notes;
CREATE POLICY "anon_select_call_notes" ON call_notes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_call_notes" ON call_notes;
CREATE POLICY "anon_insert_call_notes" ON call_notes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_call_notes" ON call_notes;
CREATE POLICY "anon_update_call_notes" ON call_notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_call_notes" ON call_notes;
CREATE POLICY "anon_delete_call_notes" ON call_notes FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_call_notes_staff ON call_notes(staff_id);
CREATE INDEX IF NOT EXISTS idx_call_notes_lead ON call_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON client_leads(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline ON client_leads(pipeline_stage);

-- Update existing seed staff with tiers and commission rates
UPDATE staff_members SET tier = 'Gold Eagle', commission_rate = 1.5 WHERE access_code = 'BT-FATIMA-101';
UPDATE staff_members SET tier = 'Silver', commission_rate = 1.0 WHERE access_code = 'BT-ALI-104';
UPDATE staff_members SET tier = 'Bronze', commission_rate = 0.8 WHERE access_code = 'BT-BILAL-107';

-- Set commission_earned on existing confirmed deal
UPDATE deals SET commission_earned = amount * 0.01 WHERE status = 'confirmed' AND commission_earned = 0;

-- Set pipeline_stage from status for existing leads
UPDATE client_leads SET pipeline_stage = 'new' WHERE status = 'new';
UPDATE client_leads SET pipeline_stage = 'call_made' WHERE status = 'contacted';
UPDATE client_leads SET pipeline_stage = 'site_visit' WHERE status = 'interested';
UPDATE client_leads SET pipeline_stage = 'token_received' WHERE status = 'negotiating';
UPDATE client_leads SET pipeline_stage = 'deal_closed' WHERE status = 'won';

-- Set a follow-up date on one lead for demo
UPDATE client_leads SET follow_up_date = CURRENT_DATE WHERE name = 'Kamran Sheikh';
