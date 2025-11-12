import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import technicalPreferencesImage from '@/assets/undraw_true-friends.svg';

import type React from 'react';

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Lock,
  Moon,
  Sun,
  Unlock,
} from 'lucide-react';

interface TechnicalPreferencesStepProps {
  formData: {
    notifications: {
      tripInvitations: boolean;
      expenseUpdates: boolean;
      packingListReminders: boolean;
      votingPolls: boolean;
    };
    notificationType: string;
    profileVisibility: string;
    defaultTheme: string;
    defaultMapView: string;
    tripReminderFrequency: string;
  };
  updateFormData: (
    data: Partial<TechnicalPreferencesStepProps['formData']>,
  ) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TechnicalPreferencesStep({
  formData,
  updateFormData,
  onNext,
  onBack,
}: TechnicalPreferencesStepProps) {
  const handleNotificationChange = (
    key: keyof typeof formData.notifications,
  ) => {
    updateFormData({
      notifications: {
        ...formData.notifications,
        [key]: !formData.notifications[key],
      },
    });
  };

  const handleChange = (key: string, value: string | boolean) => {
    updateFormData({ [key]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="hidden md:flex flex-col justify-center">
        <div className="relative h-96 w-full rounded-xl overflow-hidden">
          <img
            src={technicalPreferencesImage}
            alt="Travel adventure"
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-white text-2xl font-bold">
              Customize Your Experience
            </h2>
            <p className="text-white/90">
              Set up your preferences for a personalized journey
            </p>
          </div>
        </div>
      </div>

      <div>
        <Card className="p-6 shadow-lg border-0 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">
                  Notification Preferences
                </h3>
              </div>

              <div className="space-y-4">
                {Object.entries(formData.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label
                      htmlFor={key}
                      className="flex items-center space-x-2"
                    >
                      <span>
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    </Label>
                    <Switch
                      id={key}
                      checked={value}
                      onCheckedChange={() =>
                        handleNotificationChange(
                          key as keyof typeof formData.notifications,
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Notification Type</h3>
              <RadioGroup
                value={formData.notificationType}
                onValueChange={(value) =>
                  handleChange('notificationType', value)
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="push" id="push" />
                  <Label htmlFor="push">Push</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email">Email</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Profile Visibility</h3>
              <RadioGroup
                value={formData.profileVisibility}
                onValueChange={(value) =>
                  handleChange('profileVisibility', value)
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label
                    htmlFor="public"
                    className="flex items-center space-x-1"
                  >
                    <Unlock className="h-4 w-4" />
                    <span>Public</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label
                    htmlFor="private"
                    className="flex items-center space-x-1"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Private</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Default Theme</h3>
              <RadioGroup
                value={formData.defaultTheme}
                onValueChange={(value) => handleChange('defaultTheme', value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label
                    htmlFor="light"
                    className="flex items-center space-x-1"
                  >
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center space-x-1">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Default Map View</h3>
              <RadioGroup
                value={formData.defaultMapView}
                onValueChange={(value) => handleChange('defaultMapView', value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label
                    htmlFor="standard"
                    className="flex items-center space-x-1"
                  >
                    <span>Standard</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="satellite" id="satellite" />
                  <Label
                    htmlFor="satellite"
                    className="flex items-center space-x-1"
                  >
                    <span>Satellite</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">
                Trip Reminder Frequency
              </h3>
              <Select
                value={formData.tripReminderFrequency}
                onValueChange={(value) =>
                  handleChange('tripReminderFrequency', value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1 hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 relative overflow-hidden group"
              >
                <span className="relative z-10">Complete</span>
                <ArrowRight className="ml-2 h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-primary/80 w-0 group-hover:w-full transition-all duration-300"></div>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
