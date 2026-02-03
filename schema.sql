
-- 1. Create the donors table
CREATE TABLE IF NOT EXISTS donors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  blood_type TEXT NOT NULL,
  last_donation_date DATE DEFAULT CURRENT_DATE,
  contact TEXT NOT NULL,
  location TEXT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  last_notified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the emergencies table
CREATE TABLE IF NOT EXISTS emergencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blood_type TEXT NOT NULL,
  hospital TEXT NOT NULL,
  units_needed INTEGER NOT NULL,
  urgency TEXT DEFAULT 'high',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Realtime for both tables
-- This allows the app to listen for changes (INSERT/UPDATE/DELETE) instantly.
-- Note: If the publication already exists, you might need to check your settings in Database -> Publications.
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE donors, emergencies;
COMMIT;

-- 4. Set up Row Level Security (RLS)
-- This makes the tables accessible to your web app.
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergencies ENABLE ROW LEVEL SECURITY;

-- Creating simple policies for demo purposes (Allowing all access)
CREATE POLICY "Allow public access for donors" ON donors FOR ALL USING (true);
CREATE POLICY "Allow public access for emergencies" ON emergencies FOR ALL USING (true);

-- 5. Add initial mock data to populate your dashboard
INSERT INTO donors (name, blood_type, last_donation_date, contact, location, is_available)
VALUES 
('Marcus Aurelius', 'O-', '2024-05-10', '+1 555-0101', 'Downtown Medical Center', true),
('Elena Gilbert', 'A+', '2023-12-15', '+1 555-0102', 'Northside Clinic', true),
('Peter Parker', 'B+', '2024-01-20', '+1 555-0103', 'Queens General', true),
('Bruce Wayne', 'AB-', '2024-03-05', '+1 555-0104', 'Gotham Memorial', false),
('Natasha Romanoff', 'O+', '2024-04-12', '+1 555-0105', 'East Side Hub', true);

-- 6. Add a sample emergency to test the broadcast system
INSERT INTO emergencies (blood_type, hospital, units_needed, urgency)
VALUES ('O-', 'City General Trauma Center', 4, 'critical');
