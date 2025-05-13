import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TripsApiClient } from '@/lib/api/trips';
import { authenticationProviderInstance } from '@/lib/authentication-provider';
import { cn } from '@/lib/utils';

import type * as React from 'react';
import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Car,
  Check,
  Info,
  MapPin,
  Mountain,
  Palmtree,
  Plane,
  ShieldCheck,
  Ship,
  Tent,
  Train,
  UserPlus,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const tripIcons = [
  { icon: Plane, name: 'Plane' },
  { icon: Palmtree, name: 'Beach' },
  { icon: Mountain, name: 'Mountain' },
  { icon: Building2, name: 'City' },
  { icon: Tent, name: 'Camping' },
  { icon: Ship, name: 'Cruise' },
  { icon: Train, name: 'Train' },
  { icon: Car, name: 'Road Trip' },
];

const iconColors = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Teal', value: 'bg-teal-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
];

const tripTags = [
  { value: 'family', label: 'Family Trip' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'relaxation', label: 'Relaxation' },
  { value: 'business', label: 'Business' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'solo', label: 'Solo Travel' },
  { value: 'friends', label: 'Friends Getaway' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'nature', label: 'Nature' },
  { value: 'beach', label: 'Beach' },
  { value: 'city', label: 'City Break' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'winter', label: 'Winter' },
  { value: 'summer', label: 'Summer' },
];

interface CreateTripFormProps {
  tripType: 'private' | 'public';
}

export default function CreateTripForm({ tripType }: CreateTripFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    description: '',
    dateRange: {
      from: undefined as Date | undefined,
      to: undefined as Date | undefined,
    },
    selectedIcon: 0,
    selectedColor: 0,
    privacyType: 'invite-only',
    invitePermission: 'admin-only',
    selectedTags: [] as string[],
    tripType,
  });

  const [errors, setErrors] = useState({
    name: '',
    destination: '',
  });

  const [openTagsPopover, setOpenTagsPopover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    setFormData((prev) => ({ ...prev, dateRange }));
  };

  const handleIconSelect = (index: number) => {
    setFormData((prev) => ({ ...prev, selectedIcon: index }));
  };

  const handleColorSelect = (index: number) => {
    setFormData((prev) => ({ ...prev, selectedColor: index }));
  };

  const handleInvitePermissionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, invitePermission: value }));
  };

  const handleTagSelect = (value: string) => {
    setFormData((prev) => {
      const currentTags = [...prev.selectedTags];

      if (currentTags.includes(value)) {
        return {
          ...prev,
          selectedTags: currentTags.filter((tag) => tag !== value),
        };
      } else {
        return { ...prev, selectedTags: [...currentTags, value] };
      }
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', destination: '' };

    if (!formData.name.trim()) {
      newErrors.name = 'Trip name is required';
      isValid = false;
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);

      const tripsApiClient = new TripsApiClient(authenticationProviderInstance);

      const tripData = {
        name: formData.name,
        destination: formData.destination,
        description: formData.description || '',
        trip_type: formData.tripType,
        icon: tripIcons[formData.selectedIcon].name.toLowerCase(),
        icon_color: iconColors[formData.selectedColor].value,
        tags: formData.selectedTags,
        invite_permission: formData.invitePermission,
      };

      tripsApiClient
        .createTrip(tripData)
        .then((response) => {
          setIsSubmitting(false);
          navigate(`/trip/new/${tripType}/stages`, {
            state: {
              tripData: formData,
              tripId: response.id,
            },
          });
        })
        .catch((error) => {
          console.error('Error creating trip:', error);
          setIsSubmitting(false);
          setError('Failed to create trip. Please try again.');
        });
    }
  };

  const handleBack = () => {
    navigate('/trip/new');
  };

  const SelectedIcon = tripIcons[formData.selectedIcon].icon;
  const selectedColor = iconColors[formData.selectedColor].value;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-20">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Create Your {tripType === 'private' ? 'Private' : 'Public'} Trip
          </h1>
          <p className="text-muted-foreground">
            Let's start with the basic information about your adventure
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <form onSubmit={handleSubmit}>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Trip Details</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="name" className="text-base">
                        Trip Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Summer Adventure 2024"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm">{errors.name}</p>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label htmlFor="destination" className="text-base">
                        Destination
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="destination"
                          name="destination"
                          value={formData.destination}
                          onChange={handleInputChange}
                          placeholder="Paris, France"
                          className={cn(
                            'pl-10',
                            errors.destination ? 'border-red-500' : '',
                          )}
                        />
                      </div>
                      {errors.destination && (
                        <p className="text-red-500 text-sm">
                          {errors.destination}
                        </p>
                      )}
                    </div>
                  </div>

                  {tripType === 'public' && (
                    <div className="space-y-2">
                      <Label className="text-base">Trip Dates</Label>
                      <DatePickerWithRange
                        date={formData.dateRange}
                        setDate={handleDateChange}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Trip Categories</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] text-xs">
                              Categories help organize your trip and make it
                              easier to find later
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Popover
                      open={openTagsPopover}
                      onOpenChange={setOpenTagsPopover}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openTagsPopover}
                          className="w-full justify-between"
                        >
                          {formData.selectedTags.length > 0
                            ? `${formData.selectedTags.length} categories selected`
                            : 'Select categories...'}
                          <ArrowRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search categories..." />
                          <CommandList>
                            <CommandEmpty>No category found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {tripTags.map((tag) => (
                                <CommandItem
                                  key={tag.value}
                                  value={tag.value}
                                  onSelect={() => handleTagSelect(tag.value)}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      formData.selectedTags.includes(tag.value)
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {tag.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {formData.selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.selectedTags.map((tagValue) => {
                          const tag = tripTags.find(
                            (t) => t.value === tagValue,
                          );
                          return (
                            <Badge
                              key={tagValue}
                              variant="secondary"
                              className="px-3 py-1"
                            >
                              {tag?.label}
                              <X
                                className="ml-1 h-3 w-3 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTagSelect(tagValue);
                                }}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base">Trip Icon</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {tripIcons.map((iconObj, index) => {
                        const IconComponent = iconObj.icon;
                        return (
                          <div
                            key={iconObj.name}
                            onClick={() => handleIconSelect(index)}
                            className={cn(
                              'flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-all',
                              formData.selectedIcon === index
                                ? 'bg-primary/10 ring-2 ring-primary/50'
                                : 'hover:bg-muted',
                            )}
                          >
                            <div
                              className={cn(
                                'p-2 rounded-full',
                                formData.selectedIcon === index
                                  ? selectedColor
                                  : 'bg-muted',
                              )}
                            >
                              <IconComponent
                                className={cn(
                                  'h-6 w-6',
                                  formData.selectedIcon === index
                                    ? 'text-white'
                                    : 'text-muted-foreground',
                                )}
                              />
                            </div>
                            <span className="text-xs mt-1">{iconObj.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base">Icon Color</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {iconColors.map((color, index) => (
                        <div
                          key={color.name}
                          onClick={() => handleColorSelect(index)}
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all',
                            color.value,
                            formData.selectedColor === index
                              ? 'ring-2 ring-offset-2 ring-primary'
                              : '',
                          )}
                          title={color.name}
                        >
                          {formData.selectedColor === index && (
                            <Check className="h-5 w-5 text-white" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Invite Permissions</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-[200px] text-xs">
                                Control who can invite others to your trip
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <RadioGroup
                        value={formData.invitePermission}
                        onValueChange={handleInvitePermissionChange}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="admin-only" id="admin-only" />
                          <Label
                            htmlFor="admin-only"
                            className="flex items-center cursor-pointer"
                          >
                            <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                            <div>
                              <span className="font-medium">Admin Only</span>
                              <p className="text-xs text-muted-foreground">
                                Only you (the trip admin) can invite people
                              </p>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem
                            value="members-can-invite"
                            id="members-can-invite"
                          />
                          <Label
                            htmlFor="members-can-invite"
                            className="flex items-center cursor-pointer"
                          >
                            <UserPlus className="h-4 w-4 mr-2 text-primary" />
                            <div>
                              <span className="font-medium">
                                Members Can Invite
                              </span>
                              <p className="text-xs text-muted-foreground">
                                All trip members can invite other people
                              </p>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base">
                      Trip Description (Optional)
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell us a bit about this trip..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-3 rounded-full', selectedColor)}>
                        <SelectedIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {formData.name || 'Your Trip'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formData.destination || 'Destination'} •
                          {tripType === 'public' &&
                          formData.dateRange.from &&
                          formData.dateRange.to
                            ? ` ${formData.dateRange.from.toLocaleDateString()} - ${formData.dateRange.to.toLocaleDateString()}`
                            : ' Private Trip'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        Continue to Trip Stages
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
              {error && (
                <div className="p-4 bg-red-100 text-red-500 rounded-md">
                  {error}
                </div>
              )}
            </Card>
          </form>
        </motion.div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            After this step, you'll be able to create your trip stages and plan
            your itinerary.
          </p>
        </div>
      </div>
    </div>
  );
}
