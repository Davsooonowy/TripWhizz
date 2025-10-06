import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';
import { TripMapsApiClient, type TripMapPin, type TripMapSettings } from '@/lib/api/trips.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { useToast } from '@/components/ui/use-toast.tsx';
import { UsersApiClient, type User } from '@/lib/api/users.ts';
import { Skeleton } from '@/components/ui/skeleton.tsx';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.GOOGLE_MAPS_API_KEY;

declare global {
  interface Window {
    initTripWhizzMap: () => void;
    google: any;
  }
}

export default function TripMapsPage() {
  const { tripId } = useParams();
  const { toast } = useToast();
  const mapsClient = useMemo(
    () => new TripMapsApiClient(authenticationProviderInstance),
    [],
  );
  const apiClient = new UsersApiClient(authenticationProviderInstance);

  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [pins, setPins] = useState<TripMapPin[]>([]);
  const [settings, setSettings] = useState<TripMapSettings>({});
  const [selectDefaultMode, setSelectDefaultMode] = useState(false);
  const [addingPinAt, setAddingPinAt] = useState<{ lat: number; lng: number } | null>(null);
  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinDescription, setNewPinDescription] = useState('');
  const [newPinReason, setNewPinReason] = useState('');
  const [newPinCategory, setNewPinCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Keep map and marker references for interactions
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerById, setMarkerById] = useState<Record<number, any>>({});
  const [infoWindowById, setInfoWindowById] = useState<Record<number, any>>({});
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const searchMarkerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      setIsGoogleLoaded(true);
      return;
    }
    if (!GOOGLE_MAPS_API_KEY) return;
    const existing = document.getElementById('google-maps-script');
    if (existing) return; // will trigger isGoogleLoaded in onload of first mount
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Fetch initial data
  useEffect(() => {
    const load = async () => {
      if (!tripId) return;
      try {
        setIsLoading(true);
        const [pinsRes, settingsRes, me] = await Promise.all([
          mapsClient.getPins(Number(tripId), 1, 5, activeCategory || undefined),
          mapsClient.getSettings(Number(tripId)),
          apiClient.getActiveUser().catch(() => null),
        ]);
        setPins(pinsRes.results);
        setPage(1);
        setHasMore(Boolean(pinsRes.next));
        if (me) setCurrentUser(me);
        setSettings(settingsRes || {});
        if (!settingsRes?.default_latitude || !settingsRes?.default_longitude) {
          setSelectDefaultMode(true);
        }
      } catch (e: any) {
        toast({ title: 'Failed to load map data', description: e.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [tripId, mapsClient, toast, activeCategory]);

  // Initialize map once Google is loaded
  useEffect(() => {
    if (!isGoogleLoaded) return;
    const container = document.getElementById('trip-map');
    if (!container) return;

    // Prevent double initialization (fix: "Map container is already initialized.")
    if ((container as HTMLElement).dataset.tripwhizzMapInitialized === '1') return;

    const center = {
      lat: Number(settings.default_latitude ?? 0) || 0,
      lng: Number(settings.default_longitude ?? 0) || 0,
    };
    const zoom = Number(settings.default_zoom ?? 3) || 3;

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

    // Add existing pins
    pins.forEach((pin) => {
      const marker = new window.google.maps.Marker({
        position: { lat: Number(pin.latitude), lng: Number(pin.longitude) },
        map,
        title: pin.title,
      });
      const info = new window.google.maps.InfoWindow({
        content: `
<div style="max-width:240px; font-family: Inter, system-ui, sans-serif; color:#111827;">
  <div style="font-weight:600; margin-bottom:4px; font-size:14px;">${escapeHtml(pin.title)}</div>
  ${pin.description ? `<div style="font-size:12px; line-height:1.4; color:#374151; margin-bottom:4px;">${escapeHtml(pin.description)}</div>` : ''}
  ${pin.reason ? `<div style="font-size:12px; line-height:1.4; color:#6B7280; margin-bottom:6px;"><em>${escapeHtml(pin.reason)}</em></div>` : ''}
  <div style="font-size:11px; color:#6B7280;">by ${escapeHtml(pin.created_by?.username || 'unknown')}</div>
  <div style="margin-top:6px;"><a href="https://www.google.com/maps?q=${encodeURIComponent(String(pin.latitude))},${encodeURIComponent(String(pin.longitude))}" target="_blank" rel="noopener noreferrer" style="font-size:12px; color:#2563EB; text-decoration:underline;">Open in Google Maps</a></div>
</div>`,
      });
      marker.addListener('click', () => {
        // close other info windows from this batch
        Object.values(newInfoById).forEach((iw) => iw?.close());
        setSelectedPinId(pin.id);
        info.open({ anchor: marker, map });
      });
      newMarkerById[pin.id] = marker;
      newInfoById[pin.id] = info;
    });
    setMarkerById(newMarkerById);
    setInfoWindowById(newInfoById);

    // mark as initialized
    try { (container as HTMLElement).dataset.tripwhizzMapInitialized = '1'; } catch (err) { /* ignore */ }

    // Map click to add pin or choose default
    map.addListener('click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (selectDefaultMode) {
        setSettings((prev) => ({ ...prev, default_latitude: lat, default_longitude: lng, default_zoom: 8 }));
      } else {
        setAddingPinAt({ lat, lng });
      }
    });
  }, [isGoogleLoaded, pins, settings, selectDefaultMode]);

  // Initialize Places Autocomplete for search input when Google Maps is ready
  useEffect(() => {
    if (!isGoogleLoaded || !mapInstance) return;
    const input = document.getElementById('trip-map-search') as HTMLInputElement | null;
    if (!input || !window.google?.maps?.places) return;

    // clean up existing autocomplete
    if (autocompleteRef.current) {
      try {
        // try best-effort cleanup
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

      // center map and set zoom
      try {
        mapInstance.panTo({ lat, lng });
        mapInstance.setZoom(15);
      } catch (err) {
        console.warn('map pan failed', err);
      }

      // place or move search marker
      if (!searchMarkerRef.current && window.google?.maps) {
        searchMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
          title: place.name || 'Searched place',
        });
      } else if (searchMarkerRef.current) {
        searchMarkerRef.current.setPosition({ lat, lng });
        searchMarkerRef.current.setMap(mapInstance);
        searchMarkerRef.current.setTitle(place.name || 'Searched place');
      }
    });

    return () => {
      if (listener) (listener as any).remove?.();
      // do not remove input element
      if (searchMarkerRef.current) {
        try { searchMarkerRef.current.setMap(null); } catch (err) { console.warn(err); }
        searchMarkerRef.current = null;
      }
      autocompleteRef.current = null;
    };
  }, [isGoogleLoaded, mapInstance]);

  const loadMore = useCallback(async () => {
    if (!tripId || !hasMore) return;
    try {
      const nextPage = page + 1;
      const resp = await mapsClient.getPins(Number(tripId), nextPage, 5, activeCategory || undefined);
      setPins((prev) => [...prev, ...resp.results]);
      setPage(nextPage);
      setHasMore(Boolean(resp.next));
    } catch (e: any) {
      toast({ title: 'Failed to load more pins', description: e.message, variant: 'destructive' });
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
      } as any);
      setPins((prev) => [created, ...prev]);
      setAddingPinAt(null);
      setNewPinTitle('');
      setNewPinDescription('');
      setNewPinReason('');
      toast({ title: 'Pin added' });
      // drop a marker immediately on the current map
      if (mapInstance && window.google?.maps) {
        const marker = new window.google.maps.Marker({
          position: { lat: Number(created.latitude), lng: Number(created.longitude) },
          map: mapInstance,
          title: created.title,
        });
        const info = new window.google.maps.InfoWindow({
          content: `
<div style="max-width:240px; font-family: Inter, system-ui, sans-serif; color:#111827;">
  <div style="font-weight:600; margin-bottom:4px; font-size:14px;">${escapeHtml(created.title)}</div>
  ${created.description ? `<div style="font-size:12px; line-height:1.4; color:#374151; margin-bottom:4px;">${escapeHtml(created.description)}</div>` : ''}
  ${created.reason ? `<div style="font-size:12px; line-height:1.4; color:#6B7280; margin-bottom:6px;"><em>${escapeHtml(created.reason)}</em></div>` : ''}
  <div style="font-size:11px; color:#6B7280;">by ${escapeHtml(created.created_by?.username || 'unknown')}</div>
</div>`,
        });
        marker.addListener('click', () => info.open({ anchor: marker, map: mapInstance }));
        setMarkerById((prev) => ({ ...prev, [created.id]: marker }));
        setInfoWindowById((prev) => ({ ...prev, [created.id]: info }));
      }
    } catch (e: any) {
      toast({ title: 'Failed to add pin', description: e.message, variant: 'destructive' });
    }
  }, [tripId, addingPinAt, newPinTitle, newPinDescription, newPinReason, newPinCategory, mapsClient, toast, mapInstance]);

  const saveDefaultLocation = useCallback(async () => {
    if (!tripId) return;
    try {
      const updated = await mapsClient.updateSettings(Number(tripId), settings);
      setSettings(updated);
      setSelectDefaultMode(false);
      toast({ title: 'Default map location saved' });
    } catch (e: any) {
      toast({ title: 'Failed to save default location', description: e.message, variant: 'destructive' });
    }
  }, [tripId, settings, mapsClient, toast]);

  const canUseMap = !!GOOGLE_MAPS_API_KEY;

  // Search input placed above the map
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trip Map</h1>
        {selectDefaultMode ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">Click on the map to choose default center</span>
            <Button variant="secondary" onClick={() => setSelectDefaultMode(false)}>Cancel</Button>
            <Button onClick={saveDefaultLocation}>Save default</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setSelectDefaultMode(true)}>
            Set default center
          </Button>
        )}
      </div>

      <div className="w-full flex justify-center">
        <div className="w-full max-w-[1100px]">
          <Input
            id="trip-map-search"
            placeholder={isGoogleLoaded ? 'Search places...' : 'Loading search...'}
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

      {/* Pins list */}
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
                <option value="food">Food</option>
                <option value="sights">Sights</option>
                <option value="lodging">Lodging</option>
                <option value="activity">Activity</option>
              </select>
            </div>
          </div>
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading pins…</div>
          ) : pins.length === 0 ? (
            <div className="text-sm text-gray-500">No pins yet. Click on the map to add one.</div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                {pins.map((pin) => (
                  <li
                    key={pin.id}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer ${selectedPinId === pin.id ? 'bg-blue-50 dark:bg-blue-950/40' : ''}`}
                    onClick={() => {
                      if (mapInstance && markerById[pin.id]) {
                        mapInstance.panTo({ lat: Number(pin.latitude), lng: Number(pin.longitude) });
                        mapInstance.setZoom(13);
                        Object.values(infoWindowById).forEach((iw) => iw?.close());
                        const info = infoWindowById[pin.id];
                        setSelectedPinId(pin.id);
                        if (info) info.open({ anchor: markerById[pin.id], map: mapInstance });
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{pin.title}</div>
                        {pin.description && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{pin.description}</div>
                        )}
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">by {pin.created_by?.username || 'unknown'}</div>
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
                          {currentUser && pin.created_by?.id === currentUser.id && (
                            <button
                              className="text-red-600 dark:text-red-400 hover:underline"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await mapsClient.deletePin(Number(tripId), pin.id);
                                  setPins((prev) => prev.filter((p) => p.id !== pin.id));
                                  const m = markerById[pin.id];
                                  if (m) m.setMap(null);
                                } catch (err: any) {
                                  toast({ title: 'Failed to delete pin', description: err.message, variant: 'destructive' });
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
                  <Button variant="outline" onClick={loadMore}>Load more</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={!!addingPinAt} onOpenChange={(open) => !open && setAddingPinAt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a pin</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Title" value={newPinTitle} onChange={(e) => setNewPinTitle(e.target.value)} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Category:</span>
              <select
                className="border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-800"
                value={newPinCategory}
                onChange={(e) => setNewPinCategory(e.target.value)}
              >
                <option value="">None</option>
                <option value="food">Food</option>
                <option value="sights">Sights</option>
                <option value="lodging">Lodging</option>
                <option value="activity">Activity</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddingPinAt(null)}>Cancel</Button>
            <Button onClick={submitNewPin} disabled={!newPinTitle.trim()}>Add pin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Basic HTML escaping for InfoWindow content
function escapeHtml(input: string) {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
