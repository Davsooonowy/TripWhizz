import { useEffect, useState } from "react";
import { CheckCircle, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

interface CompletionStepProps {
  onComplete: () => void;
}

export function CompletionStep({ onComplete }: CompletionStepProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mt-12 max-w-2xl mx-auto">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={500}
          gravity={0.5}
          initialVelocityY={-20}
          recycle={false}
        />
      )}
      <Card className="p-8 shadow-lg border-0 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/5 rounded-full"></div>

        <div className="mb-8 relative">
          <CheckCircle className="h-40 w-40 text-primary mx-auto" />
        </div>

        <h2 className="text-3xl font-bold mb-4">Congratulations!</h2>

        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Your travel profile is set up. You're ready to start planning amazing trips with TripWhizz!
        </p>

        <Button onClick={onComplete} className="px-8 py-6 text-lg relative overflow-hidden group" size="lg">
          <span className="relative z-10">Take Off with TripWhizz!</span>
          <Plane className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-primary/80 w-0 group-hover:w-full transition-all duration-300"></div>
        </Button>
      </Card>
    </div>
  );
}