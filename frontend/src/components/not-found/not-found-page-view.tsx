import { Button } from '@/components/ui/button';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Link } from 'react-router-dom';

export default function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 py-8 bg-gradient-to-b from-sky-100 to-blue-200 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-2xl aspect-[16/9] relative mb-8">
        <DotLottieReact
          src="https://lottie.host/0057e9bb-7eb8-40f0-a1c1-dd458ce27639/Uzf09UtJhr.lottie"
          loop
          autoplay
          className="w-full h-full"
        />
      </div>

      <div className="text-center mb-6">
        <p className="text-xl font-medium text-slate-700 dark:text-slate-300">
          Shiver me timbers! Ye've sailed off the map!
        </p>
      </div>

      <div className="flex gap-4">
        <Button
          asChild
          size="lg"
          className="font-bold px-8 bg-yellow-500 hover:bg-yellow-600 text-slate-900"
        >
          <Link to="/">Back to Safe Harbor</Link>
        </Button>
      </div>

      <p className="mt-6 text-sm text-slate-600 dark:text-slate-400 max-w-md text-center">
        Don't let the sharks get ye down! Even the best pirates lose their way
        sometimes.
      </p>
    </div>
  );
}
