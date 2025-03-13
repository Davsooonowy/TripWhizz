import { AuthForm } from '@/components/auth/auth-form.tsx';
import { useSpring, animated } from '@react-spring/web';
import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';

import { quotes } from '@/components/util/quotes.ts';

export default function LoginPage() {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);

  const props = useSpring({
    opacity: show ? 0.8 : 0,
    config: { duration: 2000 },
    onRest: () => {
      if (!show) {
        setIndex((prev) => (prev + 1) % quotes.length);
        setShow(true);
      }
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setShow(false);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.15fr_1fr]">
      <motion.div
        className="flex flex-col gap-4 p-6 md:p-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <AuthForm />
          </div>
        </div>
      </motion.div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/src/assets/login_image.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        <div className="absolute bottom-4 right-4 text-white p-4">
          <animated.p
            style={props}
            className="text-lg font-semibold italic fancy-font"
          >
            {quotes[index]}
          </animated.p>
        </div>
      </div>
    </div>
  );
}
