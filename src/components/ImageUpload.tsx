import React, { useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

type BirdDescription = {
  id: number;
  description: string;
  bird_name: string;
  created_at: string;
}

type Response = {
  id: number;
  response: string;
  created_at: string;
}

export function ImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [birdDescription, setBirdDescription] = useState<BirdDescription | null>(null);
  const [aiResponse, setAiResponse] = useState<Response | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Set hardcoded responses for now
      setAiResponse({
        id: 1,
        response: "Based on the image analysis, this appears to be a beautiful specimen of a songbird. The distinctive features and coloring suggest it might be from the Passeriformes order. The bird's posture and environment indicate it was captured in its natural habitat, which adds significant value to this observation for bird watching enthusiasts and researchers alike.",
        created_at: new Date().toISOString()
      });

      setBirdDescription({
        id: 1,
        bird_name: "Northern Cardinal",
        description: "The Northern Cardinal is a stunning songbird known for its bright red plumage in males and reddish-brown feathers in females. With its distinctive crest and black face mask, this bird is a favorite at backyard feeders across North America. Their beautiful whistling songs can be heard throughout the year.",
        created_at: new Date().toISOString()
      });

      // Upload to Supabase Storage
      const fileName = `upload-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('birdscribe_ai')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('birdscribe_ai')
        .getPublicUrl(fileName);

      // Store reference in database
      const { error: dbError } = await supabase
        .from('uploads')
        .insert([{ 
          image_url: publicUrl,
          file_name: fileName,
          created_at: new Date().toISOString()
        }]);

      if (dbError) {
        throw dbError;
      }

      console.log('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await handleFileUpload(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center transition-colors cursor-pointer"
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="w-full flex flex-col items-center cursor-pointer"
        >
          <Upload className="h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {uploading ? 'Uploading...' : 'Click to upload or drag and drop an image'}
          </p>
        </label>
      </div>

      {preview && (
        <div className="mt-8 space-y-8">
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Image Preview
            </h3>
            <img
              src={preview}
              alt="Upload Preview"
              className="w-full h-auto rounded-lg"
            />
          </div>

          {aiResponse && (
            <div className="p-6 bg-white rounded-lg shadow-md border border-blue-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI Analysis
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {aiResponse.response}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Analysis ID: {aiResponse.id}
              </p>
            </div>
          )}

          {birdDescription && (
            <div className="p-6 bg-white rounded-lg shadow-md border border-green-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {birdDescription.bird_name}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {birdDescription.description}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Description ID: {birdDescription.id}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Debug information */}
      <div className="mt-4 text-xs text-gray-500">
        <p>Preview available: {preview ? 'Yes' : 'No'}</p>
        <p>AI Response available: {aiResponse ? 'Yes' : 'No'}</p>
        <p>Bird Description available: {birdDescription ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}