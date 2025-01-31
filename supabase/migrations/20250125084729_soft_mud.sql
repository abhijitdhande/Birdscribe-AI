/*
  # Create uploads table and storage

  1. New Tables
    - `uploads`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `image_url` (text)
      - `file_name` (text)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `uploads` table
    - Add policies for authenticated users to manage their uploads
*/

-- Create uploads table
CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  image_url text NOT NULL,
  file_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own uploads"
  ON uploads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
  ON uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name)
VALUES ('images', 'images')
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');