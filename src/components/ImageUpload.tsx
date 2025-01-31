import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      setUploading(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('birdscribe_ai')  // Updated bucket name
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('birdscribe_ai')  // Updated bucket name
        .getPublicUrl(fileName);

      // Store reference in database without user_id
      const { error: dbError } = await supabase
        .from('uploads')
        .insert([{ 
          image_url: publicUrl,
          file_name: file.name
        }]);

      if (dbError) {
        throw dbError;
      }

      console.log('Upload successful!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive ? 'Drop the image here' : 'Drag & drop an image here, or click to select'}
        </p>
      </div>

      {preview && (
        <div className="mt-8 p-4 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Preview
          </h3>
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto rounded-lg"
          />
        </div>
      )}

      {uploading && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Uploading image...
        </div>
      )}
    </div>
  );
}