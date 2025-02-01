import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';

type BirdDescription = {
  id: number;
  description: string;
  bird_name: string;
  created_at: string;
}

export function ScreenshotCapture() {
  const [preview, setPreview] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [birdDescription, setBirdDescription] = useState<BirdDescription | null>(null);

  // Function to fetch a random bird description
  const fetchRandomBirdDescription = async () => {
    const { data, error } = await supabase
      .from('bird_descriptions')
      .select('*')
      .order('RANDOM()')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching bird description:', error);
      return;
    }

    setBirdDescription(data);
  };

  // Seed bird descriptions if they don't exist
  const seedBirdDescriptions = async () => {
    const { data: existingData } = await supabase
      .from('bird_descriptions')
      .select('count');

    if (!existingData || existingData.length === 0) {
      const descriptions = [
        {
          bird_name: "Northern Cardinal",
          description: "The Northern Cardinal is a stunning songbird known for its bright red plumage in males and reddish-brown feathers in females. With its distinctive crest and black face mask, this bird is a favorite at backyard feeders across North America. Their beautiful whistling songs can be heard throughout the year."
        },
        {
          bird_name: "Blue Jay",
          description: "The Blue Jay is a vibrant and intelligent bird with bright blue, white, and black feathers. Known for their loud, distinctive calls and remarkable problem-solving abilities, these birds are excellent mimics and can even imitate the calls of hawks. They're common in eastern North American forests and suburban areas."
        },
        {
          bird_name: "American Robin",
          description: "The American Robin is one of the most familiar songbirds in North America. With their warm orange breast and dark head, these birds are often seen hopping across lawns hunting for earthworms. Their clear, cheerful songs are often among the first heard on spring mornings."
        },
        {
          bird_name: "Barn Owl",
          description: "The Barn Owl is a magnificent nocturnal hunter with a distinctive heart-shaped face and golden-buff coloring. Their exceptional hearing allows them to locate prey in complete darkness. Silent flight and keen night vision make them incredibly efficient predators."
        },
        {
          bird_name: "Hummingbird",
          description: "The Ruby-throated Hummingbird is a tiny marvel of nature, capable of hovering and flying backwards. Their iridescent green backs and ruby-red throats flash brilliantly in sunlight. These remarkable birds can beat their wings up to 53 times per second and are crucial pollinators in ecosystems."
        }
      ];

      const { error } = await supabase
        .from('bird_descriptions')
        .insert(descriptions.map(d => ({
          ...d,
          created_at: new Date().toISOString()
        })));

      if (error) {
        console.error('Error seeding bird descriptions:', error);
      }
    }
  };

  useEffect(() => {
    seedBirdDescriptions();
  }, []);

  const captureScreen = async () => {
    try {
      setCapturing(true);
      
      // Hide the capture button during screenshot
      const captureButton = document.querySelector('button');
      if (captureButton) captureButton.style.display = 'none';
      
      // Capture the screenshot using html2canvas
      const canvas = await html2canvas(document.body);
      const screenshot = canvas.toDataURL('image/png');
      
      // Show the capture button again
      if (captureButton) captureButton.style.display = 'flex';
      
      setPreview(screenshot);

      // Fetch a random bird description when screenshot is taken
      await fetchRandomBirdDescription();

      // Convert base64 to blob for Supabase upload
      const res = await fetch(screenshot);
      const blob = await res.blob();
      const file = new File([blob], 'screenshot.png', { type: 'image/png' });

      // Upload to Supabase Storage
      const fileName = `screenshot-${Date.now()}.png`;
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
      
      // Trigger download for user
      const link = document.createElement('a');
      link.href = screenshot;
      link.download = fileName;
      link.click();

      console.log('Screenshot captured and stored successfully!');
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      alert('Error capturing screenshot. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <button
        onClick={captureScreen}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-8 flex flex-col items-center justify-center transition-colors"
        disabled={capturing}
      >
        <Camera className="h-12 w-12" />
        <p className="mt-2 text-sm">
          {capturing ? 'Capturing screenshot...' : 'Click to take a screenshot'}
        </p>
      </button>

      {preview && (
        <div className="mt-8 space-y-8">
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Screenshot Preview
            </h3>
            <img
              src={preview}
              alt="Screenshot Preview"
              className="w-full h-auto rounded-lg"
            />
          </div>

          {birdDescription && (
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {birdDescription.bird_name}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {birdDescription.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}