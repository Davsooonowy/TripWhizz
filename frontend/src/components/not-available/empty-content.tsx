import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { motion } from 'framer-motion';
import { MapPin, Plus } from 'lucide-react';

interface EmptyContentProps {
  title?: string;
  message?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  showButton?: boolean;
  type?: 'default' | 'beach' | 'mountain' | 'city';
}

export function EmptyContent({
  title = 'No Trips Yet',
  message = "You haven't created any trips yet. Start planning your next adventure!",
  buttonText = 'Create Trip',
  onButtonClick = () => {},
  showButton = true,
  type = 'default',
}: EmptyContentProps) {
  const typeClass = type !== 'default' ? `trip-${type}` : '';

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          elevation="md"
          hover={true}
          className={`w-full max-w-md p-6 ${typeClass} animate-fade-in`}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20">
              <MapPin className="h-10 w-10 text-secondary" />
            </div>

            <h3 className="mb-2 text-xl font-medium font-heading">{title}</h3>

            <p className="mb-6 text-muted-foreground">{message}</p>

            {showButton && (
              <Button
                onClick={onButtonClick}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 animate-slide-up"
              >
                <Plus className="mr-2 h-4 w-4" />
                {buttonText}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
