import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { useState } from 'react';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, PlaneTakeoff, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Start() {
  const [hoverCreate, setHoverCreate] = useState(false);
  const [hoverJoin, setHoverJoin] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="container px-4 py-8 mx-auto md:py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="font-heading font-bold tracking-tight">
              Start Your <span className="text-primary">Adventure</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl max-w-md mx-auto">
              Plan amazing trips with friends and create unforgettable memories
              together
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative w-full max-w-md h-64 mb-10"
          >
            <DotLottieReact
              src="https://lottie.host/3297b2c2-65db-4c20-a822-e3e84c862e69/LoxCjdIyEm.lottie"
              loop
              autoplay
              className="absolute inset-0 w-full h-full"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid w-full max-w-lg gap-4 md:grid-cols-2"
          >
            <motion.div
              whileHover={{ y: -5 }}
              onMouseEnter={() => setHoverCreate(true)}
              onMouseLeave={() => setHoverCreate(false)}
            >
              <Card elevation="lg" className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <PlaneTakeoff className="w-6 h-6 text-primary" />
                    </div>
                    <motion.div
                      animate={{ x: hoverCreate ? 5 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="w-5 h-5 text-primary" />
                    </motion.div>
                  </div>
                  <h2 className="text-xl font-semibold font-heading">
                    Create a Trip
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Start planning your next adventure from scratch
                  </p>
                  <Link to="/trip/new">
                    <Button className="w-full mt-4" size="lg">
                      Create Trip
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              onMouseEnter={() => setHoverJoin(true)}
              onMouseLeave={() => setHoverJoin(false)}
            >
              <Card elevation="lg" className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-full bg-secondary">
                      <Users className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <motion.div
                      animate={{ x: hoverJoin ? 5 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="w-5 h-5 text-secondary" />
                    </motion.div>
                  </div>
                  <h2 className="text-xl font-semibold font-heading">
                    Join a Trip
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Join friends on an already planned adventure
                  </p>
                  <Button className="w-full mt-4" variant="outline" size="lg">
                    Join Trip
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-center justify-center mt-12 text-sm text-muted-foreground"
          >
            <MapPin className="w-4 h-4 mr-1" />
            <span>Your next adventure is just a tap away</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
