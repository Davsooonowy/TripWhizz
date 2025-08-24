import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { authenticationProviderInstance } from '@/lib/authentication-provider';
import { ItineraryApiClient, type ItineraryEventDto } from '@/lib/api/itinerary';
import { useTripContext } from '@/components/util/trip-context';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type DayPlanEvent = {
  id?: number;
  title: string;
  startMinutes: number;
  endMinutes: number;
  color?: string | null;
  description?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function minutesToTimeLabel(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const h = String(hrs).padStart(2, '0');
  const m = String(mins).padStart(2, '0');
  return `${h}:${m}`;
}

function roundToStep(minutes: number, step: number): number {
  return Math.round(minutes / step) * step;
}

export default function DayPlanner({ tripId }: { tripId?: string }) {
  const { selectedTrip } = useTripContext();
  const resolvedTripId = tripId ? Number(tripId) : selectedTrip?.id;
  const apiClient = new ItineraryApiClient(authenticationProviderInstance);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
  const [events, setEvents] = useState<DayPlanEvent[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createRange, setCreateRange] = useState<{ start: number; end: number } | null>(null);
  const [editingEvent, setEditingEvent] = useState<DayPlanEvent | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const hourCount = 24;
  const minuteStep = 15;
  const pxPerHour = 48;
  const gridHeight = hourCount * pxPerHour;

  // Load events from backend when trip resolved
  useEffect(() => {
    const load = async () => {
      if (!resolvedTripId) return;
      try {
        const list = await apiClient.listEvents(resolvedTripId, selectedDate);
        setEvents(
          list.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            startMinutes: e.start_minutes,
            endMinutes: e.end_minutes,
            color: e.color ?? undefined,
          }))
        );
      } catch (e) {
        console.error('Failed to load itinerary events', e);
      }
    };
    load();
  }, [resolvedTripId, selectedDate]);

  const hours = useMemo(() => Array.from({ length: hourCount }, (_, i) => i), []);

  const getMinutesFromPointer = (clientY: number): number => {
    const container = containerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const y = clientY - rect.top + container.scrollTop;
    const minutes = (y / pxPerHour) * 60;
    const bounded = clamp(minutes, 0, hourCount * 60);
    return roundToStep(bounded, minuteStep);
  };

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.button !== 0) return;
    const start = getMinutesFromPointer(e.clientY);
    setCreateRange({ start, end: start + minuteStep });
    const onMove = (ev: MouseEvent) => {
      setCreateRange((prev) => {
        if (!prev) return prev;
        const nextEnd = getMinutesFromPointer(ev.clientY);
        return { start: prev.start, end: Math.max(nextEnd, prev.start + minuteStep) };
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setIsCreating(true);
      setCreateTitle('');
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const createEvent = async () => {
    if (!createRange || !resolvedTripId) return;
    const payload: ItineraryEventDto = {
      date: selectedDate,
      title: createTitle || 'New Event',
      start_minutes: Math.min(createRange.start, createRange.end),
      end_minutes: Math.max(createRange.start, createRange.end),
      color: '#8b5cf6',
    };
    try {
      const created = await apiClient.createEvent(resolvedTripId, payload);
      setEvents((prev) => [
        ...prev,
        {
          id: created.id,
          title: created.title,
          description: created.description,
          startMinutes: created.start_minutes,
          endMinutes: created.end_minutes,
          color: created.color ?? undefined,
        },
      ]);
    } catch (e) {
      console.error('Failed to create event', e);
    } finally {
      setIsCreating(false);
      setCreateRange(null);
      setCreateTitle('');
    }
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setCreateRange(null);
    setCreateTitle('');
  };

  const deleteEvent = async (id?: number) => {
    if (!resolvedTripId || !id) return;
    try {
      await apiClient.deleteEvent(resolvedTripId, id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      console.error('Failed to delete event', e);
    } finally {
      setEditingEvent(null);
    }
  };

  const saveEditingEvent = async () => {
    if (!resolvedTripId || !editingEvent || !editingEvent.id) return;
    try {
      const updated = await apiClient.updateEvent(resolvedTripId, editingEvent.id, {
        title: editingEvent.title,
        description: editingEvent.description,
        start_minutes: editingEvent.startMinutes,
        end_minutes: editingEvent.endMinutes,
      });
      setEvents((prev) => prev.map((e) => e.id === updated.id ? {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        startMinutes: updated.start_minutes,
        endMinutes: updated.end_minutes,
        color: updated.color ?? undefined,
      } : e));
      setEditingEvent(null);
    } catch (e) {
      console.error('Failed to update event', e);
    }
  };

  const selectionStyle = useMemo(() => {
    if (!createRange) return { display: 'none' } as React.CSSProperties;
    const top = (Math.min(createRange.start, createRange.end) / 60) * pxPerHour;
    const height = (Math.abs(createRange.end - createRange.start) / 60) * pxPerHour;
    return {
      position: 'absolute' as const,
      top,
      left: 64,
      right: 12,
      height,
      background: 'rgba(139, 92, 246, 0.25)',
      border: '1px dashed rgba(139, 92, 246, 0.8)',
      borderRadius: 8,
      pointerEvents: 'none' as const,
    };
  }, [createRange, pxPerHour]);

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 order-2 md:order-1">
          <Button variant="outline" size="icon" onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 1);
            setSelectedDate(d.toISOString().slice(0, 10));
          }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + 1);
            setSelectedDate(d.toISOString().slice(0, 10));
          }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="order-1 md:order-2 text-center md:text-left">
          <h1 className="text-2xl font-bold">Day Plans</h1>
          <p className="text-muted-foreground text-sm">Drag on the timeline to create an event</p>
        </div>
        <div className="order-3 w-full md:w-[220px] md:w-1/3 md:ml-auto">
          <DatePicker
            date={new Date(selectedDate)}
            setDate={(d) => {
              if (!d) return;
              d.setHours(0,0,0,0);
              setSelectedDate(d.toISOString().slice(0, 10));
            }}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div
            ref={containerRef}
            className="relative border rounded-xl bg-background overflow-auto"
            style={{ height: 640 }}
            onMouseDown={handleMouseDown}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              if (!touch) return;
              const start = getMinutesFromPointer(touch.clientY);
              setCreateRange({ start, end: start + minuteStep });
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              if (!touch) return;
              setCreateRange((prev) => {
                if (!prev) return prev;
                const nextEnd = getMinutesFromPointer(touch.clientY);
                return { start: prev.start, end: Math.max(nextEnd, prev.start + minuteStep) };
              });
            }}
            onTouchEnd={() => {
              if (!createRange) return;
              setIsCreating(true);
              setCreateTitle('');
            }}
          >
            <div className="relative" style={{ height: gridHeight }}>
              {hours.map((h) => {
                const top = (h * pxPerHour);
                return (
                  <div key={h} className="absolute left-0 right-0" style={{ top, height: pxPerHour }}>
                    <div className="absolute left-0 top-0 w-full h-px bg-border" />
                    <div className="absolute left-0 top-0 w-16 h-full flex items-start justify-end pr-2 text-xs text-muted-foreground select-none">
                      {String(h).padStart(2, '0')}:00
                    </div>
                    <div className="absolute left-16 right-3 top-0 h-full">
                      <div className="absolute left-0 right-0 top-1/2 h-px bg-muted" />
                    </div>
                  </div>
                );
              })}

              {events.map((ev) => {
                const top = (ev.startMinutes / 60) * pxPerHour;
                const height = ((ev.endMinutes - ev.startMinutes) / 60) * pxPerHour;
                return (
                  <div
                    key={ev.id ?? `${ev.title}-${ev.startMinutes}-${ev.endMinutes}`}
                    className="absolute left-16 right-3 rounded-md shadow-sm cursor-pointer"
                    style={{ top, height, background: ev.color ?? '#8b5cf6' }}
                    title={`${ev.title} (${minutesToTimeLabel(ev.startMinutes)} - ${minutesToTimeLabel(ev.endMinutes)})`}
                    onMouseDown={(evt) => { evt.stopPropagation(); }}
                    onClick={(evt) => { evt.stopPropagation(); setEditingEvent(ev); }}
                    onTouchStart={(evt) => { evt.stopPropagation(); }}
                    onTouchEnd={(evt) => { evt.stopPropagation(); setEditingEvent(ev); }}
                  >
                    <div className="p-2 text-xs text-white">
                      <div className="font-semibold flex items-center gap-2">
                        <span>{ev.title}</span>
                        <span className="text-[11px] opacity-90">{minutesToTimeLabel(ev.startMinutes)} - {minutesToTimeLabel(ev.endMinutes)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={selectionStyle} />
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Events</h2>
              <span className="text-xs text-muted-foreground">{events.length}</span>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet. Drag on the timeline to add one.</p>
            ) : (
              <ul className="space-y-2">
                {events
                  .slice()
                  .sort((a, b) => a.startMinutes - b.startMinutes)
                  .map((ev) => (
                    <li
                      key={ev.id}
                      className="rounded-md border p-2 cursor-pointer hover:bg-muted transition"
                      onClick={() => setEditingEvent(ev)}
                    >
                      <div className="font-medium text-sm">{ev.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {minutesToTimeLabel(ev.startMinutes)} - {minutesToTimeLabel(ev.endMinutes)}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isCreating} onOpenChange={(open) => (!open ? cancelCreate() : setIsCreating(true))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Event title"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
            />
            {createRange && (
              <div className="text-sm text-muted-foreground">
                {minutesToTimeLabel(Math.min(createRange.start, createRange.end))}
                {' '}
                –
                {' '}
                {minutesToTimeLabel(Math.max(createRange.start, createRange.end))}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col md:flex-row gap-2 md:gap-2">
            <Button className="w-full md:w-auto" variant="secondary" onClick={cancelCreate}>Cancel</Button>
            <Button className="w-full md:w-auto" onClick={createEvent} disabled={!createRange}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEvent} onOpenChange={(open) => (!open ? setEditingEvent(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Event title"
              value={editingEvent?.title ?? ''}
              onChange={(e) => setEditingEvent((prev) => prev ? { ...prev, title: e.target.value } : prev)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="time"
                value={editingEvent ? minutesToTimeLabel(editingEvent.startMinutes) : ''}
                min="00:00"
                max="23:59"
                step={minuteStep * 60}
                className="bg-background"
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map((x) => parseInt(x, 10));
                  const mins = clamp(h * 60 + m, 0, 23 * 60 + 59);
                  setEditingEvent((prev) => {
                    if (!prev) return prev;
                    const adjustedEnd = Math.max(prev.endMinutes, mins + minuteStep);
                    return { ...prev, startMinutes: mins, endMinutes: adjustedEnd };
                  });
                }}
              />
              <Input
                type="time"
                value={editingEvent ? minutesToTimeLabel(editingEvent.endMinutes >= 24 * 60 ? 24 * 60 - 1 : editingEvent.endMinutes) : ''}
                min="00:00"
                max="23:59"
                step={minuteStep * 60}
                className="bg-background"
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map((x) => parseInt(x, 10));
                  const mins = clamp(h * 60 + m, 0, 23 * 60 + 59);
                  setEditingEvent((prev) => prev ? { ...prev, endMinutes: Math.max(mins, prev.startMinutes + minuteStep) } : prev);
                }}
              />
            </div>
            <Textarea
              placeholder="Description"
              value={editingEvent?.description ?? ''}
              onChange={(e) => setEditingEvent((prev) => prev ? { ...prev, description: e.target.value } : prev)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="flex flex-col md:flex-row gap-2 md:gap-2">
            <Button className="w-full md:w-auto" variant="secondary" onClick={() => setEditingEvent(null)}>Cancel</Button>
            <Button className="w-full md:w-auto" variant="destructive" onClick={() => deleteEvent(editingEvent?.id)}>Delete</Button>
            <Button className="w-full md:w-auto" onClick={saveEditingEvent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


