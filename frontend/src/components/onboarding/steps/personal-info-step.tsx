import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ImageCropper } from '@/components/util/image-cropper';
import personalInfoImage from '@/assets/undraw_personal-information.svg';

import type React from 'react';
import { useState } from 'react';

import { ArrowRight, Camera, User } from 'lucide-react';
import { z } from 'zod';

interface PersonalInfoStepProps {
  formData: {
    firstName: string;
    lastName: string;
    username: string;
    avatar: File | null;
  };
  updateFormData: (data: Partial<PersonalInfoStepProps['formData']>) => void;
  onNext: () => void;
}

const personalInfoSchema = z.object({
  firstName: z.string().nonempty('First name is required'),
  lastName: z.string().nonempty('Last name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  avatar: z.instanceof(File).nullable(),
});

export function PersonalInfoStep({
  formData,
  updateFormData,
  onNext,
}: PersonalInfoStepProps) {
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    username: '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageSource, setImageSource] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
    setAvatarPreview(croppedImageUrl);

    fetch(croppedImageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'cropped-avatar.jpg', {
          type: 'image/jpeg',
        });
        updateFormData({ avatar: file });
      });
  };

  const validateForm = () => {
    const result = personalInfoSchema.safeParse(formData);
    if (!result.success) {
      const newErrors = result.error.flatten().fieldErrors;
      setErrors({
        firstName: newErrors.firstName?.[0] || '',
        lastName: newErrors.lastName?.[0] || '',
        username: newErrors.username?.[0] || '',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="hidden md:flex flex-col justify-center">
        <div className="relative h-96 w-full rounded-xl overflow-hidden">
          <img
            src={personalInfoImage}
            alt="Travel adventure"
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-white text-2xl font-bold">
              Your Adventure Awaits
            </h2>
            <p className="text-white/90">First, tell us who is traveling</p>
          </div>
        </div>
      </div>

      <div>
        <Card className="p-6 shadow-lg border-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Traveler Details</h3>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 mb-2 border-4 border-background shadow-lg group-hover:border-primary transition-all duration-300 rounded-lg">
                    <AvatarImage src={avatarPreview || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl rounded-lg">
                      {formData.firstName && formData.lastName
                        ? `${formData.firstName[0]}${formData.lastName[0]}`
                        : '?'}
                    </AvatarFallback>
                  </Avatar>

                  <label
                    htmlFor="avatar"
                    className="absolute bottom-2 right-0 cursor-pointer bg-primary text-white rounded-full p-1.5 shadow-md hover:bg-primary/90 transition-all"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>

                {/* Display name under avatar */}
                <div className="text-center mt-2">
                  <p className="font-medium">
                    {formData.firstName && formData.lastName
                      ? `${formData.firstName} ${formData.lastName}`
                      : 'Your Name'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.username ? `@${formData.username}` : '@username'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      First Name
                    </label>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Last Name
                    </label>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Traveler"
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      @
                    </span>
                    <Input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="traveler"
                      className={`pl-7 ${errors.username ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg relative overflow-hidden group"
            >
              <span className="relative z-10">Continue to Next Step</span>
              <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-primary/80 w-0 group-hover:w-full transition-all duration-300"></div>
            </Button>
            {imageSource && (
              <ImageCropper
                image={imageSource}
                open={cropperOpen}
                onClose={() => setCropperOpen(false)}
                onCropComplete={handleCropComplete}
                aspectRatio={1}
              />
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
