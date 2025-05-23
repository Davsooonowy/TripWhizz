import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { useState } from 'react';

import { ArrowRight } from 'lucide-react';
import PropTypes from 'prop-types';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

function WelcomeDialog({ isOpen, onClose }: WelcomeDialogProps) {
  const [step, setStep] = useState(1);

  const stepContent = [
    {
      title: 'Welcome to TripWhizz',
      description:
        'Plan your trips effortlessly with friends and explore the world together.',
    },
    {
      title: 'Seamless Collaboration',
      description:
        'Coordinate itineraries, share expenses, and make group decisions with ease.',
    },
    {
      title: 'Smart Recommendations',
      description:
        'Discover must-visit spots and hidden gems curated just for your trip.',
    },
    {
      title: 'Ready to Embark?',
      description:
        'Start planning your adventure now and make unforgettable memories!',
    },
  ];
  const totalSteps = stepContent.length;

  const handleContinue = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onClose(open);
        if (open) setStep(1);
      }}
    >
      <DialogContent className="gap-0 p-0 [&>button:last-child]:text-white">
        <div className="p-2">
          <img
            className="w-full rounded-lg"
            src="https://originui.com/dialog-content.png"
            width={382}
            height={216}
            alt="dialog"
          />
        </div>
        <div className="space-y-6 px-6 pb-6 pt-3">
          <DialogHeader>
            <DialogTitle>{stepContent[step - 1].title}</DialogTitle>
            <DialogDescription>
              {stepContent[step - 1].description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex justify-center space-x-1.5 max-sm:order-1">
              {[...Array(totalSteps)].map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full bg-primary',
                    index + 1 === step ? 'bg-primary' : 'opacity-20',
                  )}
                />
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Skip
                </Button>
              </DialogClose>
              {step < totalSteps ? (
                <Button
                  className="group"
                  type="button"
                  onClick={handleContinue}
                >
                  Next
                  <ArrowRight
                    className="-me-1 ms-2 opacity-60 transition-transform group-hover:translate-x-0.5"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button type="button">Okay</Button>
                </DialogClose>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

WelcomeDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default WelcomeDialog;
