import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyContentProps {
  title?: string;
  message?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  showButton?: boolean;
}

export function EmptyContent({
                               title = 'No Trips Yet',
                               message = 'You haven\'t created any trips yet. Start planning your next adventure!',
                               buttonText = 'Create Trip',
                               onButtonClick = () => {
                               },
                               showButton = true,
                             }: EmptyContentProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border border-border bg-card p-6 shadow-md">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <MapPin className="h-10 w-10 text-secondary-foreground" />
          </div>

          <h3 className="mb-2 text-xl font-medium text-card-foreground">{title}</h3>

          <p className="mb-6 text-muted-foreground">{message}</p>

          {showButton && (
            <Button onClick={onButtonClick} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <Plus className="mr-2 h-4 w-4" />
              {buttonText}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
