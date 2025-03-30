import { Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FeatureNotAvailableProps {
  title?: string;
  message?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export function FeatureNotAvailable({
                                      title = 'Coming Soon',
                                      message = 'This feature is not yet available. We\'re working on making your travel experience even better!',
                                      buttonText = 'Go Back',
                                      onButtonClick = () => window.history.back(),
                                    }: FeatureNotAvailableProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md overflow-hidden border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
            <Plane className="h-10 w-10 text-accent-foreground" />
          </div>

          <h2 className="mb-2 text-2xl font-bold tracking-tight text-card-foreground">{title}</h2>

          <p className="mb-6 text-muted-foreground">{message}</p>

          <div className="mt-2 flex w-full justify-center">
            <Button onClick={onButtonClick} className="bg-primary text-primary-foreground hover:bg-primary/80">
              {buttonText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
