import { AddStageElement } from '@/components/trip/add-stage-element.tsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import { useToast } from '@/components/ui/use-toast';
import {
  ItineraryApiClient,
  type ItineraryEventDto,
} from '@/lib/api/itinerary';
import { StageElement, StagesApiClient } from '@/lib/api/stages.ts';
import { TripsApiClient } from '@/lib/api/trips.ts';
import { UsersApiClient } from '@/lib/api/users.ts';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';

import { useEffect, useState } from 'react';

import { Edit } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { EditStageElementModal } from './edit-stage-element-modal.tsx';
import { ItemDetailsModal } from './item-details-modal.tsx';

export default function StageDetails() {
  const { tripId, stageId } = useParams();
  const { toast } = useToast();
  const [stageName, setStageName] = useState<string>('Stage');
  const [selectedItem, setSelectedItem] = useState<StageElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [elements, setElements] = useState<StageElement[]>([]);
  const [unreactionedElements, setUnreactionedElements] = useState<
    StageElement[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [stageEndDate, setStageEndDate] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [winner, setWinner] = useState<StageElement | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('11:00');

  useEffect(() => {
    const fetchStageElements = async () => {
      try {
        const apiClient = new StagesApiClient(authenticationProviderInstance);
        const fetchedElements = await apiClient.getStageElements(
          Number(stageId),
        );

        setElements(fetchedElements);
        setUnreactionedElements(
          fetchedElements.filter((element: StageElement) => !element.userReaction),
        );
      } catch {
        setError('Error loading stage elements. Please try again.');
      }
    };

    fetchStageElements();
  }, [stageId]);

  const openAddModal = (item: StageElement) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeAddModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const openEditModal = (item: StageElement) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedItem(null);
    setIsEditModalOpen(false);
  };

  useEffect(() => {
    const fetchStageDetails = async () => {
      if (!tripId || !stageId) return;

      try {
        const tripsApiClient = new TripsApiClient(
          authenticationProviderInstance,
        );
        const tripDetails = await tripsApiClient.getTripDetails(Number(tripId));
        const stage = tripDetails.stages.find(
          (s: { id: number }) => s.id === Number(stageId),
        );

        if (stage) {
          setStageName(stage.name);
          // capture stage end date if present
          // supports either end_date or dateRange
          if (stage.end_date) setStageEndDate(stage.end_date);
        } else {
          setStageName('Stage not found');
        }
        setError(null);

        // determine owner
        const usersApiClient = new UsersApiClient(
          authenticationProviderInstance,
        );
        try {
          const me = await usersApiClient.getActiveUser();
          setIsOwner(!!tripDetails.owner && tripDetails.owner.id === me.id);
        } catch {
          setIsOwner(false);
        }
      } catch {
        setError('Error fetching stage details. Please try again.');
        setStageName('Error loading stage');
      }
    };

    fetchStageDetails();
  }, [tripId, stageId]);

  // pick winning element by highest averageReaction
  useEffect(() => {
    if (!elements || elements.length === 0) {
      setWinner(null);
      return;
    }
    const withScore = elements.filter(
      (e) => typeof e.averageReaction === 'number',
    );
    if (withScore.length === 0) {
      setWinner(null);
      return;
    }
    const best = withScore.reduce(
      (acc, cur) =>
        (cur.averageReaction ?? 0) > (acc.averageReaction ?? 0) ? cur : acc,
      withScore[0],
    );
    setWinner(best);
  }, [elements]);

  const hasDeadlinePassed = stageEndDate
    ? new Date(stageEndDate) < new Date()
    : false;

  const openWinnerDialog = () => {
    if (!winner) return;
    setEventTitle(winner.name);
    setEventDescription(winner.description || '');
    // default date to stage end or today
    const d = stageEndDate ? new Date(stageEndDate) : new Date();
    d.setHours(0, 0, 0, 0);
    setEventDate(d);
    setStartTime('10:00');
    setEndTime('11:00');
    setShowWinnerModal(true);
  };

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map((x) => parseInt(x, 10));
    return h * 60 + m;
  };

  const createEventFromWinner = async () => {
    if (!tripId || !winner || !eventDate) return;
    try {
      const api = new ItineraryApiClient(authenticationProviderInstance);
      const isoDate = new Date(eventDate);
      isoDate.setHours(0, 0, 0, 0);
      const payload: ItineraryEventDto = {
        date: isoDate.toISOString().slice(0, 10),
        title: eventTitle || winner.name,
        description: eventDescription,
        start_minutes: Math.min(toMinutes(startTime), toMinutes(endTime) - 1),
        end_minutes: Math.max(toMinutes(endTime), toMinutes(startTime) + 15),
        color: '#10b981',
      };
      await api.createEvent(Number(tripId), payload);
      toast({
        title: 'Event added',
        description: 'Winning option added to Day Plans.',
      });
      setShowWinnerModal(false);
    } catch (e) {
      toast({
        title: 'Failed to add event',
        description: 'Please try again later.',
      });
    }
  };

  const handleReaction = async (id: number, reaction: number) => {
    try {
      const apiClient = new StagesApiClient(authenticationProviderInstance);
      const response = await apiClient.reactToStageElement(id, reaction);

      setElements((prevElements) =>
        prevElements.map((element) =>
          element.id === id
            ? {
                ...element,
                averageReaction: response.averageReaction,
                userReaction: element.userReaction === reaction ? null : reaction,
              }
            : element,
        ),
      );

      setUnreactionedElements((prev) =>
        prev.filter((element) => element.id !== id),
      );
      setError(null);
    } catch {
      setError('Failed to add reaction. Please try again.');
    }
  };

  const handleAddStageElement = async (newStageElement: {
    name: string;
    description: string;
    url: string;
    // image: string;
  }) => {
    try {
      const apiClient = new StagesApiClient(authenticationProviderInstance);
      const createdElement = await apiClient.addStageElement({
        ...newStageElement,
        stage: Number(stageId),
      });

      setElements((prevElements: StageElement[]) => [
        ...prevElements,
        {
          ...createdElement,
          userReaction: null,
        },
      ]);
      setIsAddModalOpen(false);
      setError(null);
    } catch {
      setError('Failed to add stage element. Please try again.');
    }
  };

  const handleEditStageElement = async (
    updatedElement: Partial<StageElement>,
  ) => {
    try {
      const apiClient = new StagesApiClient(authenticationProviderInstance);
      const response = await apiClient.updateStageElement(
        selectedItem!.id!,
        updatedElement,
      );

      setElements((prevElements) =>
        prevElements.map((element) =>
          element.id === selectedItem!.id
            ? { ...element, ...response }
            : element,
        ),
      );
      closeEditModal();
      setError(null);
    } catch {
      setError('Failed to edit stage element. Please try again.');
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  if (unreactionedElements.length > 0) {
    const currentElement = unreactionedElements[0];
    const remaining = unreactionedElements.length;

    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="h-64 w-full bg-muted flex items-center justify-center">
            {currentElement.image ? (
              <img
                src={currentElement.image}
                alt={currentElement.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="text-muted-foreground text-sm">No photo</div>
            )}
          </div>
          <div className="p-6 space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentElement.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentElement.description}
            </p>
            {currentElement.url && (
              <a
                href={currentElement.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                {currentElement.url}
              </a>
            )}
          </div>
          <div className="px-6 pb-6 pt-2">
            <p className="text-center text-xs text-muted-foreground mb-2">
              Left to be graded: {remaining}
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value: number) => (
                <Button
                  key={value}
                  variant={
                    currentElement.userReaction === value
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => currentElement.id && handleReaction(currentElement.id, value)}
                  className="w-10 h-10 p-0 rounded-full"
                  disabled={hasDeadlinePassed}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
        </div>
        {error && (
          <div className="p-4 bg-red-100 text-red-500 rounded-md mt-4">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{stageName} Details</h1>

      {isOwner && hasDeadlinePassed && winner && (
        <div className="mb-6 border rounded-xl p-4 bg-muted">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="font-semibold">Voting concluded</div>
              <div className="text-sm text-muted-foreground">
                Winner: {winner.name}. Add it to your Day Plans?
              </div>
            </div>
            <Button onClick={openWinnerDialog}>Add to Day Plans</Button>
          </div>
        </div>
      )}

      {hasDeadlinePassed && (
        <Alert className="mb-4">
          <AlertDescription>
            Voting for this stage has concluded. Adding new elements is disabled.
          </AlertDescription>
        </Alert>
      )}

      <Button
        className="mb-4"
        onClick={() => setIsAddModalOpen(true)}
        disabled={hasDeadlinePassed}
      >
        Add New Element
      </Button>

      <div className="space-y-4">
        {elements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">
              No elements added yet.
            </p>
          </div>
        ) : (
          elements.map((element: StageElement) => (
            <Card
              key={element.id}
              className="hover:shadow-md transition-all duration-300 cursor-pointer relative"
              onClick={() => openAddModal(element)}
            >
              <CardHeader>
                <CardTitle>
                  <h2 className="text-lg font-bold">{element.name}</h2>
                  {element.url && (
                    <a
                      href={element.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 break-words"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ({element.url})
                    </a>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {element.description}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
                <div className="flex gap-2 justify-center sm:justify-start">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge
                          variant="secondary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Average Rating:{' '}
                          {element.averageReaction
                            ? element.averageReaction.toFixed(1)
                            : 'N/A'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <ul className="text-sm">
                          {element.reactions && element.reactions.length > 0 ? (
                            element.reactions.map((reaction) => (
                              <li key={reaction.userId}>
                                {reaction.userName}: {reaction.reaction}
                              </li>
                            ))
                          ) : (
                            <li>No reactions yet.</li>
                          )}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  {[1, 2, 3, 4, 5].map((value: number) => (
                    <Button
                      key={value}
                      variant={
                        element.userReaction === value ? 'default' : 'outline'
                      }
                      onClick={(e) => {
                        e.stopPropagation();

                        if (element.id) {
                          handleReaction(element.id, value);
                        }
                      }}
                      disabled={hasDeadlinePassed}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </CardFooter>
              <Button
                variant="outline"
                className="absolute top-6 right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(element);
                }}
              >
                <Edit className="w-4 h-4" /> Edit
              </Button>
            </Card>
          ))
        )}
      </div>

      <ItemDetailsModal
        isOpen={isModalOpen}
        onClose={closeAddModal}
        item={selectedItem ? {
          name: selectedItem.name,
          description: selectedItem.description || '',
          url: selectedItem.url,
          image: selectedItem.image,
          likes: 0,
          dislikes: 0,
        } : null}
      />

      <AddStageElement
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddStageElement}
        stageName={stageName}
      />

      {isEditModalOpen && selectedItem && (
        <EditStageElementModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onEdit={handleEditStageElement}
          element={selectedItem as StageElement}
        />
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-500 rounded-md">{error}</div>
      )}

      <Dialog
        open={showWinnerModal}
        onOpenChange={(open) => (!open ? setShowWinnerModal(false) : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add winning option to Day Plans</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Event title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="time"
                value={startTime}
                min="00:00"
                max="23:59"
                step={15 * 60}
                className="bg-background focus:bg-muted"
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                type="time"
                value={endTime}
                min="00:00"
                max="23:59"
                step={15 * 60}
                className="bg-background focus:bg-muted"
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <DatePicker
              date={eventDate ?? undefined}
              setDate={(d) => {
                if (!d) return;
                d.setHours(0, 0, 0, 0);
                setEventDate(d);
              }}
              className="w-full"
            />
            <Textarea
              placeholder="Description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="flex flex-col md:flex-row gap-2 md:gap-2">
            <Button
              className="w-full md:w-auto"
              variant="secondary"
              onClick={() => setShowWinnerModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full md:w-auto"
              onClick={createEventFromWinner}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
