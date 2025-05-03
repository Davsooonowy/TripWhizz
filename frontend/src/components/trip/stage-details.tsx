import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { TripsApiClient } from '@/lib/api/trips.ts';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';
import { ItemDetailsModal } from './item-details-modal.tsx';
import { AddStageElement } from '@/components/trip/add-stage-element.tsx';
import { StageElement, StagesApiClient } from '@/lib/api/stages.ts';
import { EditStageElementModal } from './edit-stage-element-modal.tsx';
import { Edit, ThumbsDown, ThumbsUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';

export default function StageDetails() {
  const { tripId, stageId } = useParams();
  const [stageName, setStageName] = useState<string>('Stage');
  const [selectedItem, setSelectedItem] = useState<StageElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [elements, setElements] = useState<StageElement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStageElements = async () => {
      try {
        const apiClient = new StagesApiClient(authenticationProviderInstance);
        const fetchedElements = await apiClient.getStageElements(
          Number(stageId),
        );

        setElements(fetchedElements);
      } catch (error) {
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
      } catch (err) {
        setError('Error fetching stage details. Please try again.');
        setStageName('Error loading stage');
      }
    };

    fetchStageDetails();
  }, [tripId, stageId]);

  const handleReaction = async (id: number, reaction: 'like' | 'dislike') => {
    try {
      const currentElement = elements.find((element) => element.id === id);
      const newReaction =
        currentElement?.userReaction === reaction ? null : reaction;
      const apiClient = new StagesApiClient(authenticationProviderInstance);
      const response = await apiClient.reactToStageElement(id, reaction);

      setElements((prevElements) =>
        prevElements.map((element) =>
          element.id === id
            ? {
                ...element,
                likes: response.likes,
                dislikes: response.dislikes,
                userReaction: newReaction,
              }
            : element,
        ),
      );
      setError(null);
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
                          Likes: {element.likes}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {Array.isArray(element.likesUsers) &&
                          element.likesUsers.length > 0
                            ? element.likesUsers.join(', ')
                            : 'No likes yet'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge
                          variant="secondary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Dislikes: {element.dislikes}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {Array.isArray(element.disLikesUsers) &&
                          element.dislikesUsers.length > 0
                            ? element.dislikesUsers.join(', ')
                            : 'No dislikes yet'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2 justify-center sm:justify-end mt-2">
                  <Button
                    variant={
                      element.userReaction === 'like' ? 'default' : 'outline'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction(element.id, 'like');
                    }}
                  >
                    <ThumbsUp className="w-4 h-4" /> Like
                  </Button>
                  <Button
                    variant={
                      element.userReaction === 'dislike'
                        ? 'destructive'
                        : 'outline'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction(element.id, 'dislike');
                    }}
                  >
                    <ThumbsDown className="w-4 h-4" /> Dislike
                  </Button>
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
