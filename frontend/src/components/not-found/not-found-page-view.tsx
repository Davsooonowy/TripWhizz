import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import sealTravelGif from '@/assets/seal-travel.gif';

export function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen md:flex-row">
      <div className="w-72 h-72 rounded-full flex items-center justify-center mb-4 md:mb-0 md:ml-10 border border-background">
        <img src={sealTravelGif} alt="Traveling Seal" className="w-full h-full object-cover rounded-full" />
      </div>
      <div className="max-w-md space-y-4 text-center md:text-left">
        <h1 className="text-6xl font-extrabold text-gray-900">Off Course!</h1>
        <p className="text-lg text-gray-700">
          Your plane is circling the Earth, but it’s drifted off course
        </p>
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-accent transition">
          <ArrowLeft size={16} /> Bring me back Home
        </Link>
      </div>
    </div>
  );
}