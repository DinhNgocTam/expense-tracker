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

-- Create the x_media_items table for X Media Archive
CREATE TABLE IF NOT EXISTS x_media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  post_id TEXT NOT NULL,
  author_username TEXT,
  source_post_url TEXT NOT NULL,
  caption TEXT,

  media_type TEXT NOT NULL DEFAULT 'image',
  media_index INTEGER NOT NULL DEFAULT 0,

  original_media_url TEXT,
  cloudinary_public_id TEXT NOT NULL,
  cloudinary_secure_url TEXT NOT NULL,

  bytes BIGINT,
  width INTEGER,
  height INTEGER,
  format TEXT,

  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, post_id, media_index)
);

-- Enable RLS for x_media_items
ALTER TABLE x_media_items ENABLE ROW LEVEL SECURITY;

-- Create indexes for x_media_items
CREATE INDEX IF NOT EXISTS idx_x_media_items_user_id ON x_media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_x_media_items_post_id ON x_media_items(post_id);
CREATE INDEX IF NOT EXISTS idx_x_media_items_created_at ON x_media_items(created_at DESC);

-- RLS policies for x_media_items
-- Allow users to read only their own records
CREATE POLICY "Users can read own media items"
ON x_media_items
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert only their own records
CREATE POLICY "Users can insert own media items"
ON x_media_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own records
CREATE POLICY "Users can delete own media items"
ON x_media_items
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create extension_tokens table for Chrome extension authentication
CREATE TABLE IF NOT EXISTS extension_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

-- Enable RLS for extension_tokens
ALTER TABLE extension_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own tokens
CREATE POLICY "Users can manage own extension tokens"
ON extension_tokens
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for extension_tokens
CREATE INDEX IF NOT EXISTS idx_extension_tokens_user_id ON extension_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_token_hash ON extension_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_expires_at ON extension_tokens(expires_at) WHERE revoked_at IS NULL;
