import { AddStageElement } from '@/components/trip/add-stage-element.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import { StageElement, StagesApiClient } from '@/lib/api/stages.ts';
import { TripsApiClient } from '@/lib/api/trips.ts';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';

import { useEffect, useState } from 'react';

import { Edit } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { EditStageElementModal } from './edit-stage-element-modal.tsx';
import { ItemDetailsModal } from './item-details-modal.tsx';

export default function StageDetails() {
  const { tripId, stageId } = useParams();
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

  useEffect(() => {
    const fetchStageElements = async () => {
      try {
        const apiClient = new StagesApiClient(authenticationProviderInstance);
        const fetchedElements = await apiClient.getStageElements(
          Number(stageId),
        );

        setElements(fetchedElements);
        setUnreactionedElements(
          fetchedElements.filter((element) => !element.userReaction),
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
        } else {
          setStageName('Stage not found');
        }
        setError(null);
      } catch {
        setError('Error fetching stage details. Please try again.');
        setStageName('Error loading stage');
      }
    };

    fetchStageDetails();
  }, [tripId, stageId]);

  const handleReaction = async (id: number, reaction: 'like' | 'dislike') => {
    try {
      const apiClient = new StagesApiClient(authenticationProviderInstance);
      const response = await apiClient.reactToStageElement(id, reaction);

      setElements((prevElements) =>
        prevElements.map((element) =>
          element.id === id
            ? {
                ...element,
                averageReaction: response.averageReaction,
                userReaction:
                  element.userReaction === reaction ? null : reaction,
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

      setElements((prevElements) => [
        ...prevElements,
        {
          ...createdElement,
          likes: 0,
          dislikes: 0,
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
            <div className="text-muted-foreground text-sm">Brak zdjęcia</div>
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
            Pozostało do oceny: {remaining}
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                variant={
                  currentElement.userReaction === value ? 'default' : 'outline'
                }
                onClick={() => handleReaction(currentElement.id, value)}
                className="w-10 h-10 p-0 rounded-full"
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

      <Button className="mb-4" onClick={() => setIsAddModalOpen(true)}>
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
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      variant={
                        element.userReaction === value ? 'default' : 'outline'
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(element.id, value);
                      }}
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
        item={selectedItem}
      />

      <AddStageElement
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddStageElement}
        stageName={stageName}
      />

      {isEditModalOpen && (
        <EditStageElementModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onEdit={handleEditStageElement}
          element={selectedItem}
        />
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-500 rounded-md">{error}</div>
      )}
    </div>
  );
}
