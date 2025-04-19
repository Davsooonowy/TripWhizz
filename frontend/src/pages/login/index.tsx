import { AuthForm } from '@/components/auth/auth-form.tsx';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { quotes } from '@/components/util/quotes.ts';
import { MapPin } from 'lucide-react';

export default function LoginPage() {
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prevQuote) => {
        const currentIndex = quotes.indexOf(prevQuote);
        const nextIndex = (currentIndex + 1) % quotes.length;
        return quotes[nextIndex];
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <motion.div
        className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </motion.div>

      <motion.div
        className="w-full md:w-1/2 bg-gradient-to-br from-primary/80 to-secondary/80 relative overflow-hidden hidden md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/src/assets/login_image.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />

        <div className="absolute bottom-0 left-0 right-0 p-10 z-20">
          <motion.div
            key={currentQuote}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1 }}
            className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-white/10"
          >
            <p className="text-white text-xl font-light italic mb-4">
              {currentQuote}
            </p>
            <div className="flex items-center">
              <MapPin className="text-primary mr-2" />
              <p className="text-white/80 text-sm">
                Discover your next adventure
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
