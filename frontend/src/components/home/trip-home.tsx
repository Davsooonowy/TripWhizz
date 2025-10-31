import { EmptyContent } from '@/components/not-available/empty-content';
import { ParticipantsList } from '@/components/trip/participants-list';
import StageAddForm, {
  type StageFormData,
} from '@/components/trip/stage-add-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useTripContext } from '@/components/util/trip-context';
import { StagesApiClient } from '@/lib/api/stages.ts';
import { type TripData, type TripStage, TripsApiClient } from '@/lib/api/trips';
import { UsersApiClient } from '@/lib/api/users.ts';
import { authenticationProviderInstance } from '@/lib/authentication-provider';
import { cn } from '@/lib/utils';

import type React from 'react';
import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  Calendar,
  Car,
  Clock,
  Edit2,
  Map,
  Mountain,
  Palmtree,
  Plane,
  Plus,
  RefreshCw,
  Ship,
  Tent,
  Train,
  Trash2,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const iconMap: Record<string, React.ElementType> = {
  plane: Plane,
  beach: Palmtree,
  mountain: Mountain,
  city: Building2,
  camping: Tent,
  cruise: Ship,
  train: Train,
  'road trip': Car,
};

export default function TripHome() {
  const { selectedTrip, isLoading, error, refreshTrips } = useTripContext();
  const { toast } = useToast();
  const [tripDetails, set_TripDetails] = useState<TripData | null>(null);
  const [stages, setStages] = useState<TripStage[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [companionsDialogOpen, setCompanionsDialogOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [addingStage, setAddingStage] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState<Date | null>(null);
  const [editEndDate, setEditEndDate] = useState<Date | null>(null);
  const tripsApiClient = new TripsApiClient(authenticationProviderInstance);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!selectedTrip?.id) return;

      setIsLoadingDetails(true);
      setDetailsError(null);

      try {
        const details = await tripsApiClient.getTripDetails(selectedTrip.id);
        set_TripDetails(details);
        setStages(details.stages || []);
        try {
          const user = await new UsersApiClient(
            authenticationProviderInstance,
          ).getActiveUser();
          setIsOwner(!!details.owner && details.owner.id === user.id);
        } catch {
          setIsOwner(false);
        }
      } catch {
        setDetailsError('Failed to load trip details. Please try again.');
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchTripDetails();
  }, [selectedTrip]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTrips();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const calculateDaysUntilTrip = () => {
    if (!tripDetails?.start_date) return null;

    const startDate = new Date(tripDetails.start_date);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const getTripIcon = () => {
    if (!tripDetails?.icon) return Plane;
    return iconMap[tripDetails.icon.toLowerCase()] || Plane;
  };

  const TripIcon = getTripIcon();

  const openEdit = () => {
    if (!tripDetails) return;
    setEditName(tripDetails.name || '');
    setEditDestination(tripDetails.destination || '');
    setEditDescription(tripDetails.description || '');
    setEditStartDate(
      tripDetails.start_date ? new Date(tripDetails.start_date) : null,
    );
    setEditEndDate(
      tripDetails.end_date ? new Date(tripDetails.end_date) : null,
    );
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedTrip?.id) return;
    try {
      await tripsApiClient.updateTrip(selectedTrip.id, {
        name: editName,
        destination: editDestination,
        description: editDescription,
        start_date: editStartDate
          ? editStartDate.toISOString().split('T')[0]
          : undefined,
        end_date: editEndDate
          ? editEndDate.toISOString().split('T')[0]
          : undefined,
      });
      toast({ title: 'Trip updated' });
      setEditOpen(false);
      await refreshTrips();
    } catch (e) {
      toast({
        title: 'Failed to update trip',
        description: 'Try again later.',
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedTrip?.id) return;
    try {
      await tripsApiClient.deleteTrip(selectedTrip.id);
      toast({ title: 'Trip deleted' });
      setDeleteOpen(false);
      await refreshTrips();
      navigate('/');
    } catch (e) {
      toast({
        title: 'Failed to delete trip',
        description: 'Try again later.',
      });
    }
  };

  if (isLoading || isLoadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground animate-pulse">
            {isLoading ? 'Changing your trip...' : 'Loading trip details...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Alert variant="destructive" title="Error" description={error} />
      </div>
    );
  }

  if (!selectedTrip) {
    return (
      <EmptyContent
        title="No Trips Yet"
        message="You haven't created any trips yet. Start planning your next adventure!"
        buttonText="Create Trip"
        onButtonClick={() => navigate('/trip/new')}
      />
    );
  }

  const daysUntilTrip = calculateDaysUntilTrip();
  const participants = tripDetails?.participants || [];

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-20 md:pb-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTrip.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="trip-transition"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Trip Dashboard</h1>
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setAddStageOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Stage
                  </Button>
                  <Button variant="outline" size="sm" onClick={openEdit}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing}`} />
                Refresh
              </Button>
            </div>
          </div>

          {detailsError && (
            <Alert
              variant="destructive"
              title="Error"
              description={detailsError}
              className="mb-6"
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="mb-6 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'p-3 rounded-lg',
                      tripDetails?.icon_color || 'bg-primary',
                    )}
                  >
                    <TripIcon className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-xl">
                      {tripDetails?.name || selectedTrip.name}
                    </CardTitle>
                    <CardDescription>
                      {tripDetails?.destination || selectedTrip.destination}
                      {tripDetails?.start_date && tripDetails?.end_date && (
                        <span>
                          {' '}
                          •{' '}
                          {formatTripDateRange(
                            tripDetails.start_date,
                            tripDetails.end_date,
                          )}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tripDetails?.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {tripDetails.description}
                  </p>
                )}

                <motion.div
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <StatCard
                    icon={<Calendar className="h-5 w-5 text-blue-500" />}
                    label="Trip Dates"
                    value={
                      tripDetails?.start_date && tripDetails?.end_date
                        ? formatTripDateRange(
                            tripDetails.start_date,
                            tripDetails.end_date,
                          )
                        : 'Not set'
                    }
                  />
                  <StatCard
                    icon={<Clock className="h-5 w-5 text-amber-500" />}
                    label="Days Until Trip"
                    value={
                      daysUntilTrip !== null
                        ? daysUntilTrip <= 0
                          ? daysUntilTrip === 0
                            ? 'Today!'
                            : 'In progress'
                          : `${daysUntilTrip} days`
                        : 'Not set'
                    }
                  />
                  <StatCard
                    icon={<Users className="h-5 w-5 text-purple-500" />}
                    label="Companions"
                    value={participants.length.toString()}
                    onClick={() => setCompanionsDialogOpen(true)}
                    clickable
                  />
                  <StatCard
                    icon={<Map className="h-5 w-5 text-green-500" />}
                    label="Stages"
                    value={stages.length.toString()}
                  />
                </motion.div>

                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <h3 className="text-lg font-medium mb-3">Trip Stages</h3>
                  {stages.length > 0 ? (
                    <div className="space-y-3">
                      {stages.slice(0, 5).map((stage, index) => (
                        <motion.div
                          key={stage.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 * index }}
                        >
                          <StageItem stage={stage} />
                        </motion.div>
                      ))}
                      {stages.length > 5 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                        >
                          <Button
                            variant="outline"
                            className="w-full mt-2"
                            asChild
                          >
                            <Link to="/trip/stages">
                              View All {stages.length} Stages
                            </Link>
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      className="text-center py-6 border border-dashed rounded-lg"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Map className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground mb-2">
                        No stages added yet
                      </p>
                      <Button size="sm" asChild>
                        <Link to="/trip/new/stages">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Stages
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </motion.div>

                {tripDetails?.tags && tripDetails.tags.length > 0 && (
                  <motion.div
                    className="flex flex-wrap gap-2 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    {tripDetails.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <ParticipantsList
        open={companionsDialogOpen}
        onOpenChange={setCompanionsDialogOpen}
        participants={participants}
        tripId={selectedTrip?.id}
        onParticipantsUpdate={refreshTrips}
        tripOwner={selectedTrip?.owner}
      />

      <Dialog
        open={editOpen}
        onOpenChange={(open) => (!open ? setEditOpen(false) : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Trip name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              placeholder="Destination"
              value={editDestination}
              onChange={(e) => setEditDestination(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                date={editStartDate ?? undefined}
                setDate={(d) => setEditStartDate(d ?? null)}
                className="w-full"
              />
              <DatePicker
                date={editEndDate ?? undefined}
                setDate={(d) => setEditEndDate(d ?? null)}
                className="w-full"
              />
            </div>
            <Textarea
              placeholder="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="flex flex-col md:flex-row gap-2 md:gap-2">
            <Button
              className="w-full md:w-auto"
              variant="secondary"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button className="w-full md:w-auto" onClick={saveEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => (!open ? setDeleteOpen(false) : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete trip</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            This action is irreversible. Do you really want to delete this trip?
          </div>
          <DialogFooter className="flex flex-col md:flex-row gap-2 md:gap-2">
            <Button
              className="w-full md:w-auto"
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full md:w-auto"
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addStageOpen}
        onOpenChange={(open) => (!open ? setAddStageOpen(false) : null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Stage</DialogTitle>
          </DialogHeader>
          <StageAddForm
            submitting={addingStage}
            onSubmit={async (data: StageFormData) => {
              if (!selectedTrip?.id) return;
              try {
                setAddingStage(true);
                const stagesData = [
                  {
                    name: data.name,
                    category: data.category,
                    description: data.description || '',
                    order: stages ? stages.length : 0,
                    is_custom_category: data.category.startsWith('custom-'),
                    custom_category_color: null,
                    start_date: data.dateRange?.from
                      ? data.dateRange.from.toISOString()
                      : null,
                    end_date: data.dateRange?.to
                      ? data.dateRange.to.toISOString()
                      : null,
                  },
                ];
                await tripsApiClient.createStages(
                  selectedTrip.id,
                  stagesData as any,
                );
                toast({ title: 'Stage added' });
                setAddStageOpen(false);
                await refreshTrips();
              } catch (e) {
                toast({
                  title: 'Failed to add stage',
                  description: 'Try again later.',
                });
              } finally {
                setAddingStage(false);
              }
            }}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddStageOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
  clickable?: boolean;
}

function StatCard({ icon, label, value, onClick, clickable }: StatCardProps) {
  return (
    <motion.div
      className={cn(
        'bg-muted/50 rounded-lg p-3 flex flex-col items-center text-center',
        clickable && 'cursor-pointer hover:bg-muted',
      )}
      whileHover={clickable ? { scale: 1.05 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      <div className="mb-1">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </motion.div>
  );
}

interface StageItemProps {
  stage: TripStage;
}

function StageItem({ stage }: StageItemProps) {
  const { selectedTrip } = useTripContext();
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [unreactionedCount, setUnreactionedCount] = useState<number>(0);

  useEffect(() => {
    const fetchUnreactionedElements = async () => {
      try {
        const apiClient = new StagesApiClient(authenticationProviderInstance);
        const elements = await apiClient.getStageElements(Number(stage.id));
        const unreacted = (elements as Array<any>).filter(
          (el: any) => !el.userReaction,
        );
        setUnreactionedCount(unreacted.length);
        setDetailsError(null);
      } catch (error) {
        setDetailsError('Failed to load stage elements. Please try again.');
      }
    };

    fetchUnreactionedElements();
  }, [stage.id]);

  // Get category color based on category name or custom color
  const getCategoryColor = () => {
    if (stage.is_custom_category && stage.custom_category_color) {
      return stage.custom_category_color;
    }

    // Default colors based on category
    const categoryColors: Record<string, string> = {
      accommodation: 'bg-blue-500',
      transport: 'bg-green-500',
      flight: 'bg-purple-500',
      dining: 'bg-amber-500',
      activity: 'bg-pink-500',
      attraction: 'bg-teal-500',
      event: 'bg-red-500',
      cruise: 'bg-indigo-500',
      train: 'bg-cyan-500',
      relaxation: 'bg-orange-500',
    };

    return categoryColors[stage.category] || 'bg-gray-500';
  };

  return (
    <Link to={`/trip/${selectedTrip?.id}/stages/${stage.id}`}>
      <motion.div
        className="relative flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        whileHover={{ x: 5, backgroundColor: 'hsl(var(--muted)/50)' }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={cn('w-2 h-10 rounded-full mr-3', getCategoryColor())}
        ></div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{stage.name}</p>
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="truncate capitalize">{stage.category}</span>
            {stage.start_date && stage.end_date && (
              <span className="ml-2">
                {new Date(stage.start_date).toLocaleDateString()} -{' '}
                {new Date(stage.end_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {unreactionedCount > 0 && (
          <Badge className="bg-red-500 absolute top-2 right-2 text-xs px-2 py-0.5">
            {unreactionedCount} elements to rate
          </Badge>
        )}
        {detailsError && (
          <Alert
            variant="destructive"
            title="Error"
            description={detailsError}
            className="mb-6"
          />
        )}
      </motion.div>
    </Link>
  );
}

interface AlertProps {
  variant: 'default' | 'destructive';
  title: string;
  description: string;
  className?: string;
}

function Alert({ variant, title, description, className }: AlertProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        variant === 'destructive'
          ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
        className,
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="mt-1 text-sm">{description}</div>
        </div>
      </div>
    </div>
  );
}

// Add helper function near top of file (inside component)
function formatTripDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (start.getFullYear() === end.getFullYear()) {
    // Same year, show only month and day
    options.year = undefined;
  }

  return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
}

