-- 1. Create the 'submissions' table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number BIGSERIAL,
    team_name TEXT NOT NULL,
    team_number TEXT NOT NULL,
    leader_name TEXT NOT NULL,
    ppt_url TEXT NOT NULL,
    other_files_urls JSONB DEFAULT '[]',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive policies for the table
DROP POLICY IF EXISTS "Allow public insert" ON submissions;
CREATE POLICY "Allow public insert" ON submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read" ON submissions;
CREATE POLICY "Allow public read" ON submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin update" ON submissions;
CREATE POLICY "Allow admin update" ON submissions FOR UPDATE USING (true);

-- 4. Storage Bucket Setup Instructions:
-- IMPORTANT: Go to Supabase Storage, create a bucket named 'submissions', and set it to PUBLIC.
-- Then run the following policies for the bucket:

-- Allow public access to the storage objects
-- DROP POLICY IF EXISTS "Public Access" ON storage.objects;
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'submissions' );

-- DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
-- CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'submissions' );
