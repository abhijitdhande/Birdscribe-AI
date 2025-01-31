/*
  # Fix RLS policies for public access

  1. Changes
    - Update RLS policies to allow public access temporarily
    - Add policies for unauthenticated access to uploads table
    - Modify storage policies for public access
  
  Note: In production, you should implement proper authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can insert their own uploads" ON uploads;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

-- Create new policies for uploads table
CREATE POLICY "Enable read access for all users"
  ON uploads
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON uploads
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Update storage policies
CREATE POLICY "Public read access for images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

CREATE POLICY "Public insert access for images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'images');

-- Update uploads table to make user_id optional
ALTER TABLE uploads ALTER COLUMN user_id DROP NOT NULL;