-- =============================================
-- HabitFlow - Supabase Database Schema
-- =============================================
-- Run this SQL in your Supabase SQL Editor
-- =============================================

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS habit_entries CASCADE;
DROP TABLE IF EXISTS habits CASCADE;

-- Create habits table
CREATE TABLE habits (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('boolean', 'counter', 'duration', 'time')),
    category TEXT NOT NULL CHECK (category IN ('health', 'fitness', 'productivity', 'learning', 'lifestyle')),
    target_value TEXT,
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create habit_entries table
CREATE TABLE habit_entries (
    id BIGSERIAL PRIMARY KEY,
    habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(habit_id, entry_date)
);

-- Create indexes for better performance
CREATE INDEX idx_habits_created_at ON habits(created_at);
CREATE INDEX idx_habit_entries_habit_id ON habit_entries(habit_id);
CREATE INDEX idx_habit_entries_date ON habit_entries(entry_date);
CREATE INDEX idx_habit_entries_habit_date ON habit_entries(habit_id, entry_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_habits_updated_at 
    BEFORE UPDATE ON habits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;

-- Create policies (allows all operations for now - customize based on your auth needs)
CREATE POLICY "Enable all access for habits" ON habits
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for habit_entries" ON habit_entries
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Optional: Insert sample data for testing
-- =============================================

-- Sample habits
INSERT INTO habits (name, type, category, target_value, unit) VALUES
('Morning Meditation', 'boolean', 'health', NULL, NULL),
('Daily Steps', 'counter', 'fitness', '10000', 'steps'),
('Study Time', 'duration', 'learning', '60', 'minutes'),
('Wake Up Time', 'time', 'lifestyle', NULL, NULL),
('Drink Water', 'counter', 'health', '8', 'glasses');

-- Sample entries (last 7 days)
INSERT INTO habit_entries (habit_id, entry_date, value) VALUES
(1, CURRENT_DATE, '1'),
(1, CURRENT_DATE - 1, '1'),
(1, CURRENT_DATE - 2, '0'),
(2, CURRENT_DATE, '8500'),
(2, CURRENT_DATE - 1, '12000'),
(3, CURRENT_DATE, '45'),
(4, CURRENT_DATE, '06:30'),
(5, CURRENT_DATE, '6');

-- =============================================
-- Verification Queries
-- =============================================

-- Check tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('habits', 'habit_entries');

-- Check sample data
SELECT * FROM habits;
SELECT * FROM habit_entries;

-- =============================================
-- Schema Documentation
-- =============================================

/*
HABITS TABLE STRUCTURE:
- id: Auto-incrementing primary key
- name: Display name of the habit
- type: One of: 'boolean' (yes/no), 'counter' (numerical), 'duration' (minutes), 'time' (HH:MM)
- category: One of: 'health', 'fitness', 'productivity', 'learning', 'lifestyle'
- target_value: Goal value for counter/duration types (stored as text for flexibility)
- unit: Unit label for counter types (e.g., 'steps', 'glasses', 'pages')
- created_at: Timestamp when habit was created
- updated_at: Timestamp when habit was last modified

HABIT_ENTRIES TABLE STRUCTURE:
- id: Auto-incrementing primary key
- habit_id: Reference to habits table
- entry_date: Date of the entry (YYYY-MM-DD)
- value: Entry value - interpretation depends on habit type:
    * boolean: '0' or '1'
    * counter: numerical string (e.g., '10000')
    * duration: minutes as string (e.g., '60')
    * time: HH:MM format (e.g., '06:30')
- created_at: Timestamp when entry was created

UNIQUE CONSTRAINT:
- One entry per habit per day (habit_id, entry_date)

CASCADING DELETES:
- When a habit is deleted, all its entries are automatically deleted
*/
