import { supabase } from './supabase';

export interface Upload {
  id: string;
  created_at: string;
  image_url: string;
  file_name: string;
}

export async function getAllImages(): Promise<Upload[]> {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching images: ${error.message}`);
  }

  return data || [];
}

export async function getImageById(id: string): Promise<Upload | null> {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Error fetching image: ${error.message}`);
  }

  return data;
}