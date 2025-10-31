import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/use-toast.tsx';
import {
  type TripMapPin,
  type TripMapSettings,
  type MapSpawnPoint,
  TripMapsApiClient,
} from '@/lib/api/trips.ts';
import { type User, UsersApiClient } from '@/lib/api/users.ts';
import {
  ItineraryApiClient,
  type ItineraryEventDto,
} from '@/lib/api/itinerary.ts';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';
import { MAP_PIN_CATEGORIES } from '@/lib/data/maps-static-data';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Info, ChevronDown, ChevronUp } from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  import.meta.env.GOOGLE_MAPS_API_KEY;

declare global {
  interface Window {
    initTripWhizzMap: () => void;
    google: any;
  }
}

export default function TripMaps({ tripId }: { tripId?: string }) {
  const { toast } = useToast();
  const mapsClient = useMemo(
    () => new TripMapsApiClient(authenticationProviderInstance),
    [],
  );
  const apiClient = new UsersApiClient(authenticationProviderInstance);
  const itineraryClient = useMemo(
    () => new ItineraryApiClient(authenticationProviderInstance),
    [],
  );

  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [pins, setPins] = useState<TripMapPin[]>([]);
  const [settings, setSettings] = useState<TripMapSettings>({});
  const [spawnPoints, setSpawnPoints] = useState<MapSpawnPoint[]>([]);
  const [savingNewLocationView, setSavingNewLocationView] = useState(false);
  const [newLocationViewName, setNewLocationViewName] = useState('');
  const [showLocationViewsList, setShowLocationViewsList] = useState(false);
  const [events, setEvents] = useState<ItineraryEventDto[]>([]);
  const [newPinEventId, setNewPinEventId] = useState<number | null>(null);
  const [selectedSpawnPoint, setSelectedSpawnPoint] = useState<number | null>(null);
  const [addingPinAt, setAddingPinAt] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinDescription, setNewPinDescription] = useState('');
  const [newPinReason, setNewPinReason] = useState('');
  const [newPinCategory, setNewPinCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerById, setMarkerById] = useState<Record<number, any>>({});
  const [infoWindowById, setInfoWindowById] = useState<Record<number, any>>({});
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const searchMarkerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (window.google?.maps) {
      setIsGoogleLoaded(true);
      return;
    }
    if (!GOOGLE_MAPS_API_KEY) return;
    const existing = document.getElementById('google-maps-script');
    if (existing) return;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!tripId) return;
      try {
        setIsLoading(true);
        const [pinsRes, settingsRes, spawnPointsRes, eventsRes, me] = await Promise.all([
          mapsClient.getPins(Number(tripId), 1, 5, activeCategory || undefined),
          mapsClient.getSettings(Number(tripId)),
          mapsClient.getSpawnPoints(Number(tripId)).catch(() => []),
          itineraryClient.listEvents(Number(tripId)).catch(() => []),
          apiClient.getActiveUser().catch(() => null),
        ]);
        setPins(pinsRes.results);
        setPage(1);
        setHasMore(Boolean(pinsRes.next));
        if (me) setCurrentUser(me);
        setSettings(settingsRes || {});
        setSpawnPoints(spawnPointsRes || []);
        setEvents(eventsRes || []);
        // Automatically select and apply the first location view if available
        if (spawnPointsRes.length > 0) {
          setSelectedSpawnPoint(spawnPointsRes[0].id);
        }
      } catch (e: any) {
        toast({
          title: 'Failed to load map data',
          description: e.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [tripId, mapsClient, toast, activeCategory]);

  useEffect(() => {
    if (!isGoogleLoaded) return;
    const container = document.getElementById('trip-map');
    if (!container) return;

    if ((container as HTMLElement).dataset.tripwhizzMapInitialized === '1')
      return;

    // Use selected spawn point, first spawn point, or default center
    let center = { lat: 0, lng: 0 };
    let zoom = 3;
    
    let spawnPointToUse: MapSpawnPoint | null = null;
    if (selectedSpawnPoint) {
      spawnPointToUse = spawnPoints.find(sp => sp.id === selectedSpawnPoint) || null;
    }
    // If no selected but we have spawn points, use the first one
    if (!spawnPointToUse && spawnPoints.length > 0) {
      spawnPointToUse = spawnPoints[0];
      // Also set it as selected for the dropdown
      if (spawnPoints[0].id) {
        setSelectedSpawnPoint(spawnPoints[0].id);
      }
    }
    
    if (spawnPointToUse) {
      center = {
        lat: Number(spawnPointToUse.latitude),
        lng: Number(spawnPointToUse.longitude),
      };
      zoom = Number(spawnPointToUse.zoom) || 12;
    } else if (settings.default_latitude && settings.default_longitude) {
      center = {
        lat: Number(settings.default_latitude),
        lng: Number(settings.default_longitude),
      };
      zoom = Number(settings.default_zoom ?? 3) || 3;
    }

    const map = new window.google.maps.Map(container, {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    setMapInstance(map);

    const newMarkerById: Record<number, any> = {};
    const newInfoById: Record<number, any> = {};

    pins.forEach((pin) => {
      const marker = new window.google.maps.Marker({
        position: { lat: Number(pin.latitude), lng: Number(pin.longitude) },
        map,
        draggable: currentUser ? pin.created_by?.id === currentUser.id : false,
        title: pin.title,
      });
      const eventInfo = pin.itinerary_event_title 
        ? `<div style="font-size:11px; color:#10B981; margin-top:4px; padding:4px 6px; background:#ECFDF5; border-radius:4px;">Event: ${escapeHtml(pin.itinerary_event_title)}</div>`
        : '';
      const info = new window.google.maps.InfoWindow({
        content: `\n<div style="max-width:240px; font-family: Inter, system-ui, sans-serif; color:#111827;">\n  <div style="font-weight:600; margin-bottom:4px; font-size:14px;">${escapeHtml(pin.title)}</div>\n  ${pin.description ? `<div style="font-size:12px; line-height:1.4; color:#374151; margin-bottom:4px;">${escapeHtml(pin.description)}</div>` : ''}\n  ${pin.reason ? `<div style="font-size:12px; line-height:1.4; color:#6B7280; margin-bottom:6px;"><em>${escapeHtml(pin.reason)}</em></div>` : ''}\n  ${eventInfo}\n  <div style="font-size:11px; color:#6B7280; margin-top:6px;">by ${escapeHtml(pin.created_by?.username || 'unknown')}</div>\n  <div style="margin-top:6px;"><a href="https://www.google.com/maps?q=${encodeURIComponent(String(pin.latitude))},${encodeURIComponent(String(pin.longitude))}" target="_blank" rel="noopener noreferrer" style="font-size:12px; color:#2563EB; text-decoration:underline;">Open in Google Maps</a></div>\n</div>`,
      });
      marker.addListener('click', () => {
        Object.values(newInfoById).forEach((iw) => iw?.close());
        setSelectedPinId(pin.id);
        info.open({ anchor: marker, map });
      });
      if (currentUser && pin.created_by?.id === currentUser.id) {
        marker.addListener('dragstart', () => {
          try {
            map.setOptions({ draggable: false });
          } catch {
            /* ignore */
          }
        });
        marker.addListener('dragend', async (e: any) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          const prevPos = {
            lat: Number(pin.latitude),
            lng: Number(pin.longitude),
          };
          try {
            const updated = await mapsClient.updatePin(Number(tripId), pin.id, {
              latitude: newLat,
              longitude: newLng,
            });
            setPins((prev) =>
              prev.map((p) =>
                p.id === pin.id
                  ? {
                      ...p,
                      latitude: updated.latitude,
                      longitude: updated.longitude,
                    }
                  : p,
              ),
            );
            toast({ title: 'Pin moved', description: 'Location updated.' });
          } catch (err: any) {
            try {
              marker.setPosition(prevPos);
            } catch {
              /* ignore */
            }
            toast({
              title: 'Failed to move pin',
              description: err?.message || 'Please try again.',
              variant: 'destructive',
            });
          } finally {
            try {
              map.setOptions({ draggable: true });
            } catch {
              /* ignore */
            }
          }
        });
      }
      newMarkerById[pin.id] = marker;
      newInfoById[pin.id] = info;
    });
    setMarkerById(newMarkerById);
    setInfoWindowById(newInfoById);

    try {
      (container as HTMLElement).dataset.tripwhizzMapInitialized = '1';
    } catch (err) {
      /* ignore */
    }

    map.addListener('click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setAddingPinAt({ lat, lng });
    });
  }, [
    isGoogleLoaded,
    pins,
    settings,
    spawnPoints,
    selectedSpawnPoint,
    currentUser,
    mapsClient,
    tripId,
  ]);

  useEffect(() => {
    if (!isGoogleLoaded || !mapInstance) return;
    const input = document.getElementById(
      'trip-map-search',
    ) as HTMLInputElement | null;
    if (!input || !window.google?.maps?.places) return;

    if (autocompleteRef.current) {
      try {
        (autocompleteRef.current as any).unbindAll?.();
      } catch (err) {
        console.warn('autocomplete cleanup failed', err);
      }
      autocompleteRef.current = null;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      fields: ['geometry', 'name', 'formatted_address'],
      types: ['geocode', 'establishment'],
    });
    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) return;
      const loc = place.geometry.location;
      const lat = loc.lat();
      const lng = loc.lng();

      try {
        mapInstance.panTo({ lat, lng });
        mapInstance.setZoom(15);
      } catch (err) {
        console.warn('map pan failed', err);
      }

      setNewPinTitle(place.name || '');
      setNewPinDescription(place.formatted_address || '');
      setAddingPinAt({ lat, lng });
    });

    return () => {
      if (listener) (listener as any).remove?.();
      autocompleteRef.current = null;
    };
  }, [isGoogleLoaded, mapInstance]);

  useEffect(() => {
    if (!mapInstance) return;

    if (!addingPinAt) {
      if (searchMarkerRef.current) {
        try {
          searchMarkerRef.current.setMap(null);
        } catch (err) {
          console.warn(err);
        }
        searchMarkerRef.current = null;
      }
      return;
    }

    const { lat, lng } = addingPinAt;

    if (!searchMarkerRef.current && window.google?.maps) {
      searchMarkerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        draggable: true,
        title: newPinTitle || 'New pin',
      });
      searchMarkerRef.current.addListener('dragend', (e: any) => {
        const pLat = e.latLng.lat();
        const pLng = e.latLng.lng();
        setAddingPinAt({ lat: pLat, lng: pLng });
      });
    } else if (searchMarkerRef.current) {
      searchMarkerRef.current.setPosition({ lat, lng });
      searchMarkerRef.current.setMap(mapInstance);
      searchMarkerRef.current.setTitle(newPinTitle || 'New pin');
    }

    return () => {};
  }, [addingPinAt, mapInstance, newPinTitle]);

  const loadMore = useCallback(async () => {
    if (!tripId || !hasMore) return;
    try {
      const nextPage = page + 1;
      const resp = await mapsClient.getPins(
        Number(tripId),
        nextPage,
        5,
        activeCategory || undefined,
      );
      setPins((prev) => [...prev, ...resp.results]);
      setPage(nextPage);
      setHasMore(Boolean(resp.next));
    } catch (e: any) {
      toast({
        title: 'Failed to load more pins',
        description: e.message,
        variant: 'destructive',
      });
    }
  }, [tripId, hasMore, page, mapsClient, toast, activeCategory]);

  const submitNewPin = useCallback(async () => {
    if (!tripId || !addingPinAt) return;
    try {
      const created = await mapsClient.createPin(Number(tripId), {
        title: newPinTitle,
        description: newPinDescription,
        reason: newPinReason,
        category: newPinCategory || undefined,
        latitude: addingPinAt.lat,
        longitude: addingPinAt.lng,
        itinerary_event: newPinEventId || undefined,
      } as any);
      setPins((prev) => [created, ...prev]);
      setAddingPinAt(null);
      if (searchMarkerRef.current) {
        try {
          searchMarkerRef.current.setMap(null);
        } catch (err) {
          console.warn(err);
        }
        searchMarkerRef.current = null;
      }
      setNewPinTitle('');
      setNewPinDescription('');
      setNewPinReason('');
      setNewPinEventId(null);
      toast({ title: 'Pin added' });
      if (mapInstance && window.google?.maps) {
        const marker = new window.google.maps.Marker({
          position: {
            lat: Number(created.latitude),
            lng: Number(created.longitude),
          },
          map: mapInstance,
          title: created.title,
        });
        const info = new window.google.maps.InfoWindow({
          content: `\n<div style="max-width:240px; font-family: Inter, system-ui, sans-serif; color:#111827;">\n  <div style="font-weight:600; margin-bottom:4px; font-size:14px;">${escapeHtml(created.title)}</div>\n  ${created.description ? `<div style="font-size:12px; line-height:1.4; color:#374151; margin-bottom:4px;">${escapeHtml(created.description)}</div>` : ''}\n  ${created.reason ? `<div style="font-size:12px; line-height:1.4; color:#6B7280; margin-bottom:6px;"><em>${escapeHtml(created.reason)}</em></div>` : ''}\n  <div style="font-size:11px; color:#6B7280;">by ${escapeHtml(created.created_by?.username || 'unknown')}</div>\n</div>`,
        });
        marker.addListener('click', () =>
          info.open({ anchor: marker, map: mapInstance }),
        );
        setMarkerById((prev) => ({ ...prev, [created.id]: marker }));
        setInfoWindowById((prev) => ({ ...prev, [created.id]: info }));
      }
    } catch (e: any) {
      toast({
        title: 'Failed to add pin',
        description: e.message,
        variant: 'destructive',
      });
    }
  }, [
    tripId,
    addingPinAt,
    newPinTitle,
    newPinDescription,
    newPinReason,
    newPinCategory,
    newPinEventId,
    mapsClient,
    toast,
    mapInstance,
  ]);


  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Trip Map</h1>
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            aria-label="How it works"
            title="How it works"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {spawnPoints.length > 0 && (
              <select
              className="border rounded px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-800 min-w-[200px]"
              value={selectedSpawnPoint || (spawnPoints.length > 0 ? spawnPoints[0].id : '')}
              onChange={(e) => {
                const spId = e.target.value ? Number(e.target.value) : null;
                setSelectedSpawnPoint(spId);
                if (spId && mapInstance) {
                  const sp = spawnPoints.find(s => s.id === spId);
                  if (sp) {
                    mapInstance.panTo({
                      lat: Number(sp.latitude),
                      lng: Number(sp.longitude),
                    });
                    mapInstance.setZoom(sp.zoom || 12);
                  }
                }
              }}
            >
              {spawnPoints.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setSavingNewLocationView(true);
              setNewLocationViewName('');
            }}
          >
            Add new
          </Button>
        </div>
      </div>

      <div className="w-full flex justify-center">
        <div className="w-full max-w-[1100px]">
          <Input
            id="trip-map-search"
            placeholder={
              isGoogleLoaded ? 'Search places...' : 'Loading search...'
            }
            disabled={!isGoogleLoaded}
            className="mb-3"
          />
        </div>
      </div>

      <div className="w-full flex justify-center">
        {isLoading ? (
          <Skeleton className="w-full max-w-[1100px] h-[60vh] rounded-lg" />
        ) : (
          <div
            id="trip-map"
            style={{
              width: '100%',
              maxWidth: 1100,
              height: '60vh',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#e5e7eb',
            }}
          />
        )}
      </div>

      <div className="w-full flex justify-center">
        <div className="w-full" style={{ maxWidth: 1100 }}>
          <div className="flex items-center justify-between mb-2 gap-2">
            <h2 className="text-lg font-medium">Pins</h2>
            <div className="flex items-center gap-2">
              <select
                value={activeCategory}
                className="border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-800"
                onChange={(e) => setActiveCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {MAP_PIN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading pins…</div>
          ) : pins.length === 0 ? (
            <div className="text-sm text-gray-500">
              No pins yet. Click on the map to add one.
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                {pins.map((pin) => (
                  <li
                    key={pin.id}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer ${selectedPinId === pin.id ? 'bg-blue-50 dark:bg-blue-950/40' : ''}`}
                    onClick={() => {
                      if (mapInstance && markerById[pin.id]) {
                        mapInstance.panTo({
                          lat: Number(pin.latitude),
                          lng: Number(pin.longitude),
                        });
                        mapInstance.setZoom(13);
                        Object.values(infoWindowById).forEach((iw) =>
                          iw?.close(),
                        );
                        const info = infoWindowById[pin.id];
                        setSelectedPinId(pin.id);
                        if (info)
                          info.open({
                            anchor: markerById[pin.id],
                            map: mapInstance,
                          });
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {pin.title}
                        </div>
                        {pin.description && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {pin.description}
                          </div>
                        )}
                        {pin.itinerary_event_title && (
                          <div className="text-[11px] text-green-600 dark:text-green-400 mt-1">
                            Event: {pin.itinerary_event_title}
                          </div>
                        )}
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          by {pin.created_by?.username || 'unknown'}
                        </div>
                        <div className="text-[11px] mt-2 flex gap-3">
                          <a
                            href={`https://www.google.com/maps?q=${encodeURIComponent(String(pin.latitude))},${encodeURIComponent(String(pin.longitude))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open in Google Maps
                          </a>
                          {currentUser &&
                            pin.created_by?.id === currentUser.id && (
                              <button
                                className="text-red-600 dark:text-red-400 hover:underline"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await mapsClient.deletePin(
                                      Number(tripId),
                                      pin.id,
                                    );
                                    setPins((prev) =>
                                      prev.filter((p) => p.id !== pin.id),
                                    );
                                    const m = markerById[pin.id];
                                    if (m) m.setMap(null);
                                  } catch (err: any) {
                                    toast({
                                      title: 'Failed to delete pin',
                                      description: err.message,
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                              >
                                Delete
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {hasMore && (
                <div className="flex justify-center mt-3">
                  <Button variant="outline" onClick={loadMore}>
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog
        open={!!addingPinAt}
        onOpenChange={(open) => !open && setAddingPinAt(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a pin</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              placeholder="Title"
              value={newPinTitle}
              onChange={(e) => setNewPinTitle(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Category:
              </span>
              <select
                className="border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-800"
                value={newPinCategory}
                onChange={(e) => setNewPinCategory(e.target.value)}
              >
                <option value="">None</option>
                {MAP_PIN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            {events.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Link to Event:
                </span>
                <select
                  className="border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-800 flex-1"
                  value={newPinEventId || ''}
                  onChange={(e) => setNewPinEventId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">None</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.date})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddingPinAt(null)}>
              Cancel
            </Button>
            <Button onClick={submitNewPin} disabled={!newPinTitle.trim()}>
              Add pin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help / How it works */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How the Trip Map works</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <p>
              Use the search box to find places. Selecting a result will
              position a temporary marker and open the add pin dialog.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Click anywhere on the map to place a new pin. Fill in details
                and press "Add pin".
              </li>
              <li>
                You can drag pins that you created to fine-tune their location.
                The new position is saved automatically on drop.
              </li>
              <li>
                Use the category filter or the list to focus a pin. Clicking a
                pin in the list centers the map and opens its details.
              </li>
              <li>
                Owners can set the default map center: click "Set default
                center", then click on the map and "Save default".
              </li>
            </ul>
            <p>Tip: Use "Open in Google Maps" for quick directions to a pin.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHelpOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save New Location View Dialog */}
      <Dialog
        open={savingNewLocationView}
        onOpenChange={(open) => !open && setSavingNewLocationView(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View as Location</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              placeholder="Location name (e.g., Paris, Rome, Tokyo)"
              value={newLocationViewName}
              onChange={(e) => setNewLocationViewName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Save the current map view (center and zoom) as a named location view.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setSavingNewLocationView(false);
                setNewLocationViewName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!tripId || !mapInstance || !newLocationViewName.trim()) return;
                try {
                  const center = mapInstance.getCenter();
                  const zoom = mapInstance.getZoom();
                  
                  if (!center) {
                    toast({
                      title: 'Failed to get map position',
                      variant: 'destructive',
                    });
                    return;
                  }
                  
                  const created = await mapsClient.createSpawnPoint(Number(tripId), {
                    name: newLocationViewName,
                    latitude: center.lat(),
                    longitude: center.lng(),
                    zoom: zoom || 12,
                    order: spawnPoints.length,
                  });
                  setSpawnPoints((prev) => [...prev, created]);
                  setSelectedSpawnPoint(created.id);
                  setSavingNewLocationView(false);
                  setNewLocationViewName('');
                  toast({ title: 'View location saved' });
                } catch (e: any) {
                  toast({
                    title: 'Failed to save view location',
                    description: e.message,
                    variant: 'destructive',
                  });
                }
              }}
              disabled={!newLocationViewName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Views List with Delete Option - Collapsible */}
      {spawnPoints.length > 0 && (
        <div className="w-full flex justify-center">
          <div className="w-full" style={{ maxWidth: 1100 }}>
            <button
              onClick={() => setShowLocationViewsList(!showLocationViewsList)}
              className="flex items-center justify-between w-full p-2 rounded-md border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                {showLocationViewsList ? (
                  <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
                <span className="text-sm font-medium">Location Views</span>
                <span className="text-xs text-muted-foreground">
                  ({spawnPoints.length} {spawnPoints.length === 1 ? 'view' : 'views'})
                </span>
              </div>
            </button>
            {showLocationViewsList && (
              <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 dark:divide-gray-800 dark:border-gray-800 mt-2">
                {spawnPoints.map((sp) => (
                  <li
                    key={sp.id}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {sp.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {Number(sp.latitude).toFixed(6)}, {Number(sp.longitude).toFixed(6)} • Zoom: {sp.zoom}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (mapInstance) {
                              mapInstance.panTo({
                                lat: Number(sp.latitude),
                                lng: Number(sp.longitude),
                              });
                              mapInstance.setZoom(sp.zoom || 12);
                              setSelectedSpawnPoint(sp.id);
                            }
                          }}
                        >
                          Go to
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (!confirm(`Delete location view "${sp.name}"?`)) return;
                            try {
                              await mapsClient.deleteSpawnPoint(Number(tripId), sp.id);
                              setSpawnPoints((prev) => {
                                const filtered = prev.filter((s) => s.id !== sp.id);
                                // If deleted spawn point was selected, select first remaining or null
                                if (selectedSpawnPoint === sp.id) {
                                  setSelectedSpawnPoint(filtered.length > 0 ? filtered[0].id : null);
                                  // Center map on first remaining or default
                                  if (filtered.length > 0 && mapInstance) {
                                    const first = filtered[0];
                                    mapInstance.panTo({
                                      lat: Number(first.latitude),
                                      lng: Number(first.longitude),
                                    });
                                    mapInstance.setZoom(first.zoom || 12);
                                  }
                                }
                                return filtered;
                              });
                              toast({ title: 'Location view deleted' });
                            } catch (err: any) {
                              toast({
                                title: 'Failed to delete location view',
                                description: err.message,
                                variant: 'destructive',
                              });
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function escapeHtml(input: string) {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
