import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';


interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    name: string;
    description?: string;
    url?: string;
    image?: string;
  } | null;
}

export function ItemDetailsModal({
  isOpen,
  onClose,
  item,
}: ItemDetailsModalProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col items-center text-center max-w-xs sm:max-w-sm md:max-w-md rounded-lg">
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            className="max-w-full max-h-64 object-contain rounded-lg mb-4"
          />
        )}
        <DialogHeader>
          <DialogTitle className="text-center">{item.name}</DialogTitle>
          <DialogDescription>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-sm text-blue-400 break-words block"
              >
                {item.url}
              </a>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="break-words">{item.description}</p>
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
