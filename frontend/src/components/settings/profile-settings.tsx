import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/components/ui/use-toast';
import { getInitials } from '@/components/util/avatar-utils';
import { ImageCropper } from '@/components/util/image-cropper';
import { type User, UsersApiClient } from '@/lib/api/users';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Camera,
  Check,
  Loader2,
  Lock,
  Mail,
  UserIcon,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const passwordResetSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(
    null,
  );
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageSource, setImageSource] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    avatar: null as File | null,
  });

  const {
    register: registerPasswordReset,
    handleSubmit: handlePasswordResetSubmit,
    formState: { errors: passwordErrors },
    watch,
    reset: resetPasswordForm,
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  const newPassword = watch('newPassword', '');

  const passwordRequirements = [
    { text: 'At least 8 characters', met: newPassword.length >= 8 },
    { text: 'At least one uppercase letter', met: /[A-Z]/.test(newPassword) },
    { text: 'At least one lowercase letter', met: /[a-z]/.test(newPassword) },
    { text: 'At least one number', met: /[0-9]/.test(newPassword) },
    {
      text: 'At least one special character',
      met: /[^A-Za-z0-9]/.test(newPassword),
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const apiClient = new UsersApiClient(authenticationProviderInstance);
        const userData = await apiClient.getActiveUser();
        setUser(userData);
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          username: userData.username || '',
          avatar: null,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load profile',
          description:
            "We couldn't load your profile information. Please try again.",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
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
        const file = new File([blob], 'avatar.jpg', {
          type: 'image/jpeg',
        });
        setFormData((prev) => ({ ...prev, avatar: file }));
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const apiClient = new UsersApiClient(authenticationProviderInstance);
      const updatedUser = await apiClient.updateUser(formData);

      setUser(updatedUser);

      toast({
        title: 'Profile updated',
        description: 'Your profile information has been successfully updated.',
        action: <Check className="h-4 w-4 text-green-500" />,
      });

      setTimeout(() => navigate('/settings'), 1500);
    } catch (error) {
      console.error('Error updating user data:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: "We couldn't update your profile. Please try again.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    } finally {
      setIsSaving(false);
    }
  };

  //TODO for mati
  const handlePasswordReset = async () => {
    setPasswordResetError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Password updated',
        description: 'Your password has been successfully changed.',
        action: <Check className="h-4 w-4 text-green-500" />,
      });

      resetPasswordForm();
      setIsResetDialogOpen(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      setPasswordResetError(
        'Failed to reset password. Please check your current password and try again.',
      );
    }
  };
  const handleCancel = () => {
    navigate('/settings');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userInitials = getInitials(
    formData.first_name && formData.last_name
      ? `${formData.first_name} ${formData.last_name}`
      : user?.email || user?.username || '',
  );

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-20 md:pb-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <Button variant="ghost" onClick={() => navigate('/settings')}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="general">General Information</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                    <CardDescription>
                      This will be displayed on your profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div
                      className="relative group cursor-pointer"
                      onClick={handleAvatarClick}
                    >
                      <Avatar className="h-32 w-32 border-4 border-background shadow-lg group-hover:border-primary transition-all duration-300 rounded-lg">
                        <AvatarImage
                          src={avatarPreview || user?.avatar_url || undefined}
                          alt={user?.first_name || user?.username || 'User'}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-4xl rounded-lg">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>

                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      Click to upload a new profile picture
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          placeholder="Your first name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder="Your last name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder="Your username"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="pl-10 bg-muted/50"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed. Contact support for assistance.
                      </p>
                    </div>

                    <div className="pt-2">
                      <Dialog
                        open={isResetDialogOpen}
                        onOpenChange={setIsResetDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            type="button"
                            className="w-full"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                              Update your password to keep your account secure
                            </DialogDescription>
                          </DialogHeader>

                          {passwordResetError && (
                            <Alert variant="destructive" className="mb-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                {passwordResetError}
                              </AlertDescription>
                            </Alert>
                          )}

                          <form
                            onSubmit={handlePasswordResetSubmit(
                              handlePasswordReset,
                            )}
                            className="space-y-4 py-2"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword">
                                Current Password
                              </Label>
                              <Input
                                id="currentPassword"
                                type="password"
                                {...registerPasswordReset('currentPassword')}
                                className={
                                  passwordErrors.currentPassword
                                    ? 'border-red-500'
                                    : ''
                                }
                              />
                              {passwordErrors.currentPassword && (
                                <p className="text-sm text-red-500 mt-1">
                                  {passwordErrors.currentPassword.message}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="newPassword">New Password</Label>
                              <Input
                                id="newPassword"
                                type="password"
                                {...registerPasswordReset('newPassword')}
                                className={
                                  passwordErrors.newPassword
                                    ? 'border-red-500'
                                    : ''
                                }
                              />
                              {passwordErrors.newPassword && (
                                <p className="text-sm text-red-500 mt-1">
                                  {passwordErrors.newPassword.message}
                                </p>
                              )}

                              <div className="mt-3 text-xs space-y-1.5">
                                <p className="font-medium text-sm mb-1">
                                  Password requirements:
                                </p>
                                {passwordRequirements.map((req, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center"
                                  >
                                    {req.met ? (
                                      <Check className="h-3.5 w-3.5 text-green-500 mr-2" />
                                    ) : (
                                      <div className="h-3.5 w-3.5 border border-gray-300 rounded-full mr-2" />
                                    )}
                                    <span
                                      className={
                                        req.met
                                          ? 'text-green-700 dark:text-green-400'
                                          : 'text-muted-foreground'
                                      }
                                    >
                                      {req.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">
                                Confirm New Password
                              </Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                {...registerPasswordReset('confirmPassword')}
                                className={
                                  passwordErrors.confirmPassword
                                    ? 'border-red-500'
                                    : ''
                                }
                              />
                              {passwordErrors.confirmPassword && (
                                <p className="text-sm text-red-500 mt-1">
                                  {passwordErrors.confirmPassword.message}
                                </p>
                              )}
                            </div>

                            <DialogFooter className="pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsResetDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit">Update Password</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </CardFooter>
                  {imageSource && (
                    <ImageCropper
                      image={imageSource}
                      open={cropperOpen}
                      onClose={() => setCropperOpen(false)}
                      onCropComplete={handleCropComplete}
                      aspectRatio={1}
                    />
                  )}
                </Card>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-center py-8">
                  Preferences settings will be available in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
