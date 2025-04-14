import type * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  GripVertical,
  Bed,
  Car,
  Plane,
  Utensils,
  MapPin,
  Camera,
  Ticket,
  Ship,
  Train,
  Palmtree,
  Trash2,
  Edit,
  Save,
  Info,
  CheckCircle,
  Check,
  AlertCircle,
  X,
  BookmarkIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

import { TripsApiClient } from '@/lib/api/trips';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

const stageCategories = [
  {
    id: 'accommodation',
    name: 'Accommodation',
    icon: Bed,
    color: 'bg-blue-500',
  },
  { id: 'transport', name: 'Transport', icon: Car, color: 'bg-green-500' },
  { id: 'flight', name: 'Flight', icon: Plane, color: 'bg-purple-500' },
  { id: 'dining', name: 'Dining', icon: Utensils, color: 'bg-amber-500' },
  { id: 'activity', name: 'Activity', icon: Camera, color: 'bg-pink-500' },
  { id: 'attraction', name: 'Attraction', icon: MapPin, color: 'bg-teal-500' },
  { id: 'event', name: 'Event', icon: Ticket, color: 'bg-red-500' },
  { id: 'cruise', name: 'Cruise', icon: Ship, color: 'bg-indigo-500' },
  { id: 'train', name: 'Train', icon: Train, color: 'bg-cyan-500' },
  {
    id: 'relaxation',
    name: 'Relaxation',
    icon: Palmtree,
    color: 'bg-orange-500',
  },
];

const initialCustomCategories: Array<{
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}> = [];

const iconColors = [
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Teal', value: 'bg-teal-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
];

// Add storage key for saving progress
const STORAGE_KEY = 'trip_stages_builder_data';

interface TripStage {
  id: string;
  name: string;
  category: string;
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  description?: string;
  order: number;
}

interface TripStagesBuilderProps {
  tripType: 'private' | 'public';
}

export default function TripStagesBuilder({
  tripType,
}: TripStagesBuilderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const tripData = location.state?.tripData || {};
  const { toast } = useToast();

  const [stages, setStages] = useState<TripStage[]>([]);
  const [newStage, setNewStage] = useState<Partial<TripStage>>({
    name: '',
    category: '',
    dateRange: {
      from: undefined,
      to: undefined,
    },
    description: '',
  });
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [draggedStage, setDraggedStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [dateWarnings, setDateWarnings] = useState<
    { stageId: string; message: string }[]
  >([]);

  const [customCategories, setCustomCategories] = useState(
    initialCustomCategories,
  );
  const [showCustomCategoryDialog, setShowCustomCategoryDialog] =
    useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState({
    name: '',
    color: 'bg-blue-500',
  });

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const { stages: savedStages } = JSON.parse(savedData);
        if (savedStages && savedStages.length > 0) {
          setHasSavedData(true);
        }
      } catch (e) {
        console.error('Error parsing saved trip data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('hasSeenStagesHelp');
    if (!hasSeenHelp) {
      setTimeout(() => {
        setShowHelpDialog(true);
        localStorage.setItem('hasSeenStagesHelp', 'true');
      }, 500);
    }
  }, []);

  const handleNewStageChange = (field: keyof TripStage, value: any) => {
    setNewStage((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleEditStageChange = (
    id: string,
    field: keyof TripStage,
    value: any,
  ) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === id ? { ...stage, [field]: value } : stage,
      ),
    );

    if (field === 'dateRange') {
      const updatedStages = stages.map((stage) =>
        stage.id === id ? { ...stage, [field]: value } : stage,
      );
      setDateWarnings(validateDates(updatedStages));
    }
  };

  const addCustomCategory = () => {
    if (!newCustomCategory.name) return;

    const newCategory = {
      id: `custom-${Date.now()}`,
      name: newCustomCategory.name,
      icon: MapPin,
      color: newCustomCategory.color,
    };

    setCustomCategories([...customCategories, newCategory]);
    setShowCustomCategoryDialog(false);

    handleNewStageChange('category', newCategory.id);

    setNewCustomCategory({
      name: '',
      color: 'bg-blue-500',
    });
  };

  const saveProgress = () => {
    setIsSaving(true);
    try {
      const dataToSave = {
        stages,
        tripData,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

      toast({
        title: 'Progress saved',
        description: 'You can return to this trip later',
        duration: 3000,
      });

      setHasSavedData(true);
    } catch (e) {
      toast({
        title: 'Error saving progress',
        description: 'Please try again',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadSavedProgress = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const { stages: savedStages, customCategories: savedCategories } =
          JSON.parse(savedData);
        setStages(savedStages || []);
        if (savedCategories) {
          setCustomCategories(savedCategories);
        }

        toast({
          title: 'Progress restored',
          description: 'Continuing from where you left off',
          duration: 3000,
        });
      }
    } catch (e) {
      toast({
        title: 'Error loading saved progress',
        description: 'Could not restore your previous work',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  // Date validation function
  const validateDates = (stages: TripStage[]) => {
    const orderedStages = [...stages].sort((a, b) => a.order - b.order);
    const warnings: { stageId: string; message: string }[] = [];

    for (let i = 0; i < orderedStages.length - 1; i++) {
      const currentStage = orderedStages[i];
      const nextStage = orderedStages[i + 1];

      if (currentStage.dateRange?.to && nextStage.dateRange?.from) {
        if (currentStage.dateRange.to > nextStage.dateRange.from) {
          warnings.push({
            stageId: currentStage.id,
            message: `This period ends after the next period "${nextStage.name}" begins`,
          });
        }
      }
    }

    return warnings;
  };

  const addStage = () => {
    if (!newStage.name || !newStage.category) {
      setError('Please provide both a name and category for the stage');
      return;
    }

    const newId = `stage-${Date.now()}`;
    const stageToAdd: TripStage = {
      id: newId,
      name: newStage.name || '',
      category: newStage.category || '',
      dateRange: newStage.dateRange,
      description: newStage.description,
      order: stages.length,
    };

    const updatedStages = [...stages, stageToAdd];
    setStages(updatedStages);
    setNewStage({
      name: '',
      category: '',
      dateRange: {
        from: undefined,
        to: undefined,
      },
      description: '',
    });
    setError(null);

    // Validate dates after adding
    setDateWarnings(validateDates(updatedStages));
  };

  const removeStage = (id: string) => {
    setStages((prev) => {
      const filtered = prev.filter((stage) => stage.id !== id);
      // Reorder remaining stages
      return filtered.map((stage, index) => ({ ...stage, order: index }));
    });
  };

  const startEditing = (id: string) => {
    setEditingStage(id);
  };

  const saveEditing = () => {
    setEditingStage(null);

    // Validate dates after editing
    setDateWarnings(validateDates(stages));
  };

  // Enhanced drag and drop for desktop
  const handleDragStart = (e: React.DragEvent, id: string, index: number) => {
    dragItem.current = index;
    setDraggedStage(id);

    const stage = stages.find((s) => s.id === id);
    if (!stage) return;

    const category = getCategoryDetails(stage.category);

    // Create a more visible and styled ghost drag image
    const ghostElement = document.createElement('div');
    ghostElement.style.width = '300px';
    ghostElement.style.padding = '12px';
    ghostElement.style.borderRadius = '8px';
    ghostElement.style.backgroundColor = 'white';
    ghostElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    ghostElement.style.border = '2px solid #3b82f6';
    ghostElement.style.position = 'absolute';
    ghostElement.style.zIndex = '9999';
    ghostElement.style.pointerEvents = 'none';

    // Add content to the ghost element
    ghostElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 32px; height: 32px; border-radius: 6px; background-color: ${category.color.replace('bg-', '')}; display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div>
          <div style="font-weight: 600; color: #111827;">${stage.name}</div>
          <div style="font-size: 12px; color: #6b7280;">${category.name}</div>
        </div>
      </div>
    `;

    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 20, 20);

    // Clean up ghost element
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;

    // Add visual feedback for drag target
    const elements = document.querySelectorAll('.stage-item');
    elements.forEach((el, i) => {
      if (i === index) {
        el.classList.add('bg-primary/10', 'border-primary');
      } else {
        el.classList.remove('bg-primary/10', 'border-primary');
      }
    });
  };

  const handleDragEnd = () => {
    // Remove visual feedback from all elements
    document.querySelectorAll('.stage-item').forEach((el) => {
      el.classList.remove('bg-primary/10', 'border-primary');
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (dragItem.current === null || dragOverItem.current === null) return;

    // Reorder stages
    const newStages = [...stages];
    const draggedItemContent = newStages[dragItem.current];
    newStages.splice(dragItem.current, 1);
    newStages.splice(dragOverItem.current, 0, draggedItemContent);

    // Update order property
    const reorderedStages = newStages.map((stage, index) => ({
      ...stage,
      order: index,
    }));

    setStages(reorderedStages);
    setDraggedStage(null);
    dragItem.current = null;
    dragOverItem.current = null;

    // Remove visual feedback
    handleDragEnd();

    // Validate dates after reordering
    setDateWarnings(validateDates(reorderedStages));
  };

  // Add touch event handlers for mobile drag and drop
  const handleTouchStart = (e: React.TouchEvent, id: string, index: number) => {
    dragItem.current = index;
    setDraggedStage(id);
    touchStartY.current = e.touches[0].clientY;

    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleTouchMove = (e: React.TouchEvent, index: number) => {
    if (draggedStage === null || touchStartY.current === null) return;

    const touchY = e.touches[0].clientY;

    // Find the element being dragged over
    const elements = Array.from(document.querySelectorAll('.stage-item'));
    const elementPositions = elements.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        index: Number.parseInt(el.getAttribute('data-index') || '0'),
      };
    });

    const currentPosition = touchY;
    const targetIndex = elementPositions.findIndex(
      (pos) => currentPosition >= pos.top && currentPosition <= pos.bottom,
    );

    if (targetIndex !== -1 && targetIndex !== index) {
      dragOverItem.current = targetIndex;

      // Visual feedback for the drag target
      elements.forEach((el, i) => {
        if (i === targetIndex) {
          el.classList.add('bg-primary/10', 'border-primary');
        } else {
          el.classList.remove('bg-primary/10', 'border-primary');
        }
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (
      draggedStage === null ||
      dragItem.current === null ||
      dragOverItem.current === null
    ) {
      setDraggedStage(null);
      touchStartY.current = null;
      return;
    }

    // Reorder stages
    const newStages = [...stages];
    const draggedItemContent = newStages[dragItem.current];
    newStages.splice(dragItem.current, 1);
    newStages.splice(dragOverItem.current, 0, draggedItemContent);

    // Update order property
    const reorderedStages = newStages.map((stage, index) => ({
      ...stage,
      order: index,
    }));

    setStages(reorderedStages);
    setDraggedStage(null);
    dragItem.current = null;
    dragOverItem.current = null;
    touchStartY.current = null;

    // Remove visual feedback from all elements
    document.querySelectorAll('.stage-item').forEach((el) => {
      el.classList.remove('bg-primary/10', 'border-primary');
    });

    // Validate dates after reordering
    setDateWarnings(validateDates(reorderedStages));

    // Add haptic feedback for completion
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
  };

  // Update the handleSubmit function:
  const handleSubmit = () => {
    if (stages.length === 0) {
      setError('Please add at least one stage to your trip');
      return;
    }

    // Validate dates before submitting
    const warnings = validateDates(stages);
    setDateWarnings(warnings);

    if (warnings.length > 0) {
      setError('Please fix date conflicts before submitting');
      return;
    }

    setIsSubmitting(true);

    const tripsApiClient = new TripsApiClient(authenticationProviderInstance);
    const tripId = location.state?.tripId;

    if (!tripId) {
      setError('Trip ID not found. Please try again.');
      setIsSubmitting(false);
      return;
    }

    // Format stages for the API
    const stagesData = stages.map((stage) => ({
      name: stage.name,
      category: stage.category,
      description: stage.description || '',
      order: stage.order,
      is_custom_category: stage.category.startsWith('custom-'),
      custom_category_color: stage.category.startsWith('custom-')
        ? getCategoryDetails(stage.category).color
        : null,
      start_date: stage.dateRange?.from
        ? stage.dateRange.from.toISOString()
        : null,
      end_date: stage.dateRange?.to ? stage.dateRange.to.toISOString() : null,
    }));

    tripsApiClient
      .createStages(tripId, stagesData)
      .then(() => {
        setIsSubmitting(false);
        // Clear saved data on successful submission
        localStorage.removeItem(STORAGE_KEY);
        setShowSuccessDialog(true);
      })
      .catch((error) => {
        console.error('Error creating stages:', error);
        setIsSubmitting(false);
        setError('Failed to save trip stages. Please try again.');
      });
  };

  const handleBack = () => {
    navigate(`/trip/new/${tripType}`);
  };

  const finishAndGoHome = () => {
    navigate('/trip');
  };

  const getCategoryDetails = (categoryId: string) => {
    // Check if it's a custom category
    if (categoryId.startsWith('custom-')) {
      const customCategory = customCategories.find(
        (cat) => cat.id === categoryId,
      );
      return (
        customCategory || {
          name: 'Unknown',
          icon: MapPin,
          color: 'bg-gray-500',
        }
      );
    }

    return (
      stageCategories.find((cat) => cat.id === categoryId) || {
        name: 'Unknown',
        icon: MapPin,
        color: 'bg-gray-500',
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Plan Your Trip Timeline
            </h1>
            <p className="text-muted-foreground">
              Create time periods for different parts of your trip to{' '}
              {tripData.destination || 'your destination'}
            </p>
          </div>

          {/* Save & Exit Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={saveProgress}
              disabled={isSaving || stages.length === 0}
              className="flex items-center gap-1"
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-1"
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
                  Saving...
                </>
              ) : (
                <>
                  <BookmarkIcon className="h-4 w-4 mr-1" />
                  Save
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitDialog(true)}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>

        {/* Show saved data alert */}
        {hasSavedData && (
          <Alert className="mb-6 bg-primary/5 border-primary/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <BookmarkIcon className="h-4 w-4 mr-2 text-primary" />
                <AlertDescription>
                  You have a saved trip in progress.
                </AlertDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSavedProgress}
                className="ml-2"
              >
                Resume
              </Button>
            </div>
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="shadow-md mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Trip Time Periods</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowHelpDialog(true)}
                    >
                      <Info className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Learn how to create trip periods</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stage-name">Period Name</Label>
                  <Input
                    id="stage-name"
                    placeholder="e.g., Paris Exploration"
                    value={newStage.name || ''}
                    onChange={(e) =>
                      handleNewStageChange('name', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage-category">Category</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newStage.category || ''}
                      onValueChange={(value) =>
                        handleNewStageChange('category', value)
                      }
                      className="flex-1"
                    >
                      <SelectTrigger id="stage-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {stageCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center">
                              <category.icon className="h-4 w-4 mr-2 text-primary" />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}

                        {customCategories.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                              Custom Categories
                            </div>
                            {customCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center">
                                  <div
                                    className={cn(
                                      'w-4 h-4 rounded-full mr-2',
                                      category.color,
                                    )}
                                  ></div>
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowCustomCategoryDialog(true)}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stage-date">Date Range (Optional)</Label>
                  <DatePickerWithRange
                    date={newStage.dateRange}
                    setDate={(dateRange) =>
                      handleNewStageChange('dateRange', dateRange)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage-description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="stage-description"
                    placeholder="Add details about this stage..."
                    value={newStage.description || ''}
                    onChange={(e) =>
                      handleNewStageChange('description', e.target.value)
                    }
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <Button
                onClick={addStage}
                className="w-full group hover:bg-primary/90 transition-all"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Add Stage
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Trip Stages</CardTitle>
            </CardHeader>
            <CardContent>
              {stages.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">
                      No time periods added yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add your first trip period using the form above
                    </p>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {stages
                      .sort((a, b) => a.order - b.order)
                      .map((stage, index) => {
                        const category = getCategoryDetails(stage.category);
                        const CategoryIcon = category.icon;
                        const warning = dateWarnings.find(
                          (w) => w.stageId === stage.id,
                        );

                        return (
                          <motion.div
                            key={stage.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2 }}
                            draggable
                            onDragStart={(e) =>
                              handleDragStart(e, stage.id, index)
                            }
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onDrop={handleDrop}
                            onTouchStart={(e) =>
                              handleTouchStart(e, stage.id, index)
                            }
                            onTouchMove={(e) => handleTouchMove(e, index)}
                            onTouchEnd={handleTouchEnd}
                            data-index={index}
                            className={cn(
                              'flex flex-col border rounded-lg p-3 transition-all stage-item',
                              draggedStage === stage.id
                                ? 'opacity-80 border-dashed border-primary bg-primary/5 shadow-md'
                                : 'opacity-100',
                              editingStage === stage.id
                                ? 'ring-2 ring-primary'
                                : '',
                              warning ? 'border-amber-500' : '',
                            )}
                          >
                            <div className="flex items-center">
                              <div className="flex items-center cursor-grab">
                                <GripVertical className="h-5 w-5 text-muted-foreground mr-2" />
                              </div>

                              <div
                                className={cn(
                                  'p-2 rounded-md mr-3',
                                  category.color,
                                )}
                              >
                                <CategoryIcon className="h-5 w-5 text-white" />
                              </div>

                              <div className="flex-1 min-w-0">
                                {editingStage === stage.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={stage.name}
                                      onChange={(e) =>
                                        handleEditStageChange(
                                          stage.id,
                                          'name',
                                          e.target.value,
                                        )
                                      }
                                      className="font-medium"
                                    />

                                    <div className="flex gap-2">
                                      <Select
                                        value={stage.category}
                                        onValueChange={(value) =>
                                          handleEditStageChange(
                                            stage.id,
                                            'category',
                                            value,
                                          )
                                        }
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {stageCategories.map((cat) => (
                                            <SelectItem
                                              key={cat.id}
                                              value={cat.id}
                                            >
                                              <div className="flex items-center">
                                                <cat.icon className="h-4 w-4 mr-2" />
                                                {cat.name}
                                              </div>
                                            </SelectItem>
                                          ))}

                                          {customCategories.length > 0 && (
                                            <>
                                              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                                Custom Categories
                                              </div>
                                              {customCategories.map((cat) => (
                                                <SelectItem
                                                  key={cat.id}
                                                  value={cat.id}
                                                >
                                                  <div className="flex items-center">
                                                    <div
                                                      className={cn(
                                                        'w-4 h-4 rounded-full mr-2',
                                                        cat.color,
                                                      )}
                                                    ></div>
                                                    {cat.name}
                                                  </div>
                                                </SelectItem>
                                              ))}
                                            </>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <DatePickerWithRange
                                      date={stage.dateRange}
                                      setDate={(dateRange) =>
                                        handleEditStageChange(
                                          stage.id,
                                          'dateRange',
                                          dateRange,
                                        )
                                      }
                                    />

                                    <Textarea
                                      value={stage.description || ''}
                                      onChange={(e) =>
                                        handleEditStageChange(
                                          stage.id,
                                          'description',
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Description..."
                                      className="h-20"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <div className="font-medium truncate">
                                      {stage.name}
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <span className="truncate">
                                        {category.name}
                                      </span>
                                      {stage.dateRange?.from &&
                                      stage.dateRange?.to ? (
                                        <>
                                          {new Date(
                                            stage.dateRange.from,
                                          ).toLocaleDateString()}{' '}
                                          -{' '}
                                          {new Date(
                                            stage.dateRange.to,
                                          ).toLocaleDateString()}
                                        </>
                                      ) : (
                                        'No date range'
                                      )}
                                    </div>
                                    {stage.description && (
                                      <p className="text-xs text-muted-foreground mt-1 truncate">
                                        {stage.description}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>

                              <div className="flex items-center ml-2">
                                {editingStage === stage.id ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={saveEditing}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing(stage.id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeStage(stage.id)}
                                  className="hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {warning && (
                              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-300 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span>{warning.message}</span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                </div>
              )}

              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Drag and drop time periods to reorder them. Your trip will
                  follow this sequence.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={stages.length === 0 || isSubmitting}
              >
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
                    Saving...
                  </>
                ) : (
                  <>
                    {stages.length === 0
                      ? 'Add stages to continue'
                      : 'Save Trip Plan'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Create all the important stages of your trip to build a
            comprehensive travel plan.
          </p>
        </div>
      </div>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How to Create Trip Time Periods</DialogTitle>
            <DialogDescription>
              Time periods help you organize your journey into logical segments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Add Time Periods</h4>
                <p className="text-sm text-muted-foreground">
                  Create periods for different parts of your trip
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <GripVertical className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Drag to Reorder</h4>
                <p className="text-sm text-muted-foreground">
                  Arrange periods in the order you plan to experience them
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Edit className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Edit Anytime</h4>
                <p className="text-sm text-muted-foreground">
                  Modify period details as your plans evolve
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHelpDialog(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trip Timeline Created Successfully!</DialogTitle>
            <DialogDescription>
              Your trip to {tripData.destination || 'your destination'} has been
              saved with all time periods
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={finishAndGoHome} className="w-full">
              Go to My Trips
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Category Dialog */}
      <Dialog
        open={showCustomCategoryDialog}
        onOpenChange={setShowCustomCategoryDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Category</DialogTitle>
            <DialogDescription>
              Add a new category type for your trip periods
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-category-name">Category Name</Label>
              <Input
                id="custom-category-name"
                value={newCustomCategory.name}
                onChange={(e) =>
                  setNewCustomCategory((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="e.g., Sightseeing, Shopping, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Category Color</Label>
              <div className="flex flex-wrap gap-2">
                {iconColors.map((color) => (
                  <div
                    key={color.value}
                    onClick={() =>
                      setNewCustomCategory((prev) => ({
                        ...prev,
                        color: color.value,
                      }))
                    }
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-all',
                      color.value,
                      newCustomCategory.color === color.value
                        ? 'ring-2 ring-offset-2 ring-primary'
                        : '',
                    )}
                  >
                    {newCustomCategory.color === color.value && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomCategoryDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={addCustomCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exit Trip Planning?</DialogTitle>
            <DialogDescription>
              {stages.length > 0
                ? "Your progress will be lost if you haven't saved it. Would you like to save before exiting?"
                : "Are you sure you want to exit? You haven't created any stages yet."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Cancel
            </Button>

            <div className="flex gap-2">
              {stages.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    saveProgress();
                    navigate('/trip');
                  }}
                >
                  Save & Exit
                </Button>
              )}

              <Button variant="destructive" onClick={() => navigate('/trip')}>
                Exit Without Saving
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
