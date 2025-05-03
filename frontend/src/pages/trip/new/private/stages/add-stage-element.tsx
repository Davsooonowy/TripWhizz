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
import { Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { ImageCropper } from '@/components/util/image-cropper';

interface AddStageElementProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newElement: {
    name: string;
    description: string;
    url: string;
    image: string;
  }) => void;
  stageName: string;
}

export function AddStageElement({
  isOpen,
  onClose,
  onAdd,
  stageName,
}: AddStageElementProps) {
  const [newElement, setNewElement] = useState({
    name: '',
    description: '',
    url: '',
    image: '',
  });

  const [imageSource, setImageSource] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageSource(e.target.result as string);
          setCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setNewElement({ ...newElement, image: croppedImageUrl });
    setCropperOpen(false);
  };

  const handleAdd = () => {
    if (newElement.name.trim()) {
      onAdd(newElement);
      setNewElement({ name: '', description: '', url: '', image: '' });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col max-w-xs sm:max-w-sm md:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Add New {stageName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="stage-name">Name</Label>
            <Input
              id="stage-name"
              placeholder="Plaza Hotel"
              value={newElement.name}
              onChange={(e) =>
                setNewElement({ ...newElement, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="stage-description">Description (Optional)</Label>
            <Textarea
              id="stage-description"
              placeholder="Make America Great Again"
              value={newElement.description}
              onChange={(e) =>
                setNewElement({ ...newElement, description: e.target.value })
              }
              className="resize-none"
            />
          </div>
          <div>
            <Label htmlFor="stage-url">Link (Optional)</Label>
            <Input
              id="stage-url"
              placeholder="https://example.com"
              value={newElement.url}
              onChange={(e) =>
                setNewElement({ ...newElement, url: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="stage-image">Image (Optional)</Label>
            <div
              className="border-2 border-dashed border-muted rounded-lg p-4 text-center cursor-pointer hover:bg-muted/10 transition"
              onClick={() => document.getElementById('stage-image')?.click()}
            >
              {newElement.image ? (
                <img
                  src={newElement.image}
                  alt="Uploaded preview"
                  className="max-w-full max-h-32 object-contain mx-auto"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
            <Input
              id="stage-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </DialogContent>

      {imageSource && (
        <ImageCropper
          image={imageSource}
          open={cropperOpen}
          onClose={() => setCropperOpen(false)}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </Dialog>
  );
}
