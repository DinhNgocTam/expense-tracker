-- Create the expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy allowing all operations for anonymous users (DEV ONLY)
CREATE POLICY "Allow anon read/write for dev" 
ON expenses 
FOR ALL 
TO anon
USING (true) 
WITH CHECK (true);