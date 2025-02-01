import { Bird } from 'lucide-react';
import { ScreenshotCapture } from './components/ImageUpload';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bird className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Birdscribe AI</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Take and analyze screenshots of birds with our advanced AI technology
          </p>
        </div>

        <ScreenshotCapture />
      </div>
    </div>
  );
}