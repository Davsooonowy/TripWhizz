import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StageElement } from '@/lib/api/stages';

interface EditStageElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (updatedElement: Partial<StageElement>) => void;
  element: StageElement;
}

export function EditStageElementModal({
  isOpen,
  onClose,
  onEdit,
  element,
}: EditStageElementModalProps) {
  const [updatedElement, setUpdatedElement] = useState<Partial<StageElement>>({
    name: element.name,
    description: element.description,
    url: element.url,
  });

  const handleSave = () => {
    onEdit(updatedElement);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col max-w-xs sm:max-w-sm md:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Edit {element.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={updatedElement.name}
              onChange={(e) =>
                setUpdatedElement({ ...updatedElement, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={updatedElement.description}
              onChange={(e) =>
                setUpdatedElement({
                  ...updatedElement,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="edit-url">URL</Label>
            <Input
              id="edit-url"
              value={updatedElement.url}
              onChange={(e) =>
                setUpdatedElement({ ...updatedElement, url: e.target.value })
              }
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
