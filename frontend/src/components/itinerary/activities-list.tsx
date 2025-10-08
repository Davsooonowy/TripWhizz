import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useTripContext } from '@/components/util/trip-context';
import {
  ItineraryApiClient,
  type ItineraryEventDto,
} from '@/lib/api/itinerary';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

import { useEffect, useMemo, useState } from 'react';

type GroupedEvents = Record<string, ItineraryEventDto[]>;

function formatDisplayDate(isoDate: string): string {
  const data = new Date(isoDate);
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return formatter.format(data);
}

function minutesToTimeLabel(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const h = String(hrs).padStart(2, '0');
  const m = String(mins).padStart(2, '0');
  return `${h}:${m}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function ActivitiesList({ tripId }: { tripId?: string }) {
  const { selectedTrip } = useTripContext();
  const resolvedTripId = tripId ? Number(tripId) : selectedTrip?.id;
  const apiClient = new ItineraryApiClient(authenticationProviderInstance);
  const [events, setEvents] = useState<ItineraryEventDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ItineraryEventDto | null>(null);
  const minuteStep = 15;

  useEffect(() => {
    const run = async () => {
      if (!resolvedTripId) return;
      try {
        setError(null);
        const list = await apiClient.listEvents(resolvedTripId);
        list.sort((a, b) => {
          if (a.date < b.date) return -1;
          if (a.date > b.date) return 1;
          return a.start_minutes - b.start_minutes;
        });
        setEvents(list);
      } catch (e) {
        setError('Failed to load activities. Please try again.');
      }
    };
    run();
  }, [resolvedTripId]);

  const grouped: GroupedEvents = useMemo(() => {
    const byDate: GroupedEvents = {};
    if (!events) return byDate;
    for (const ev of events) {
      if (!byDate[ev.date]) byDate[ev.date] = [];
      byDate[ev.date].push(ev);
    }
    return byDate;
  }, [events]);

  if (!resolvedTripId) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        Select or open a trip to view activities.
      </div>
    );
  }

  const deleteEvent = async (id?: number) => {
    if (!resolvedTripId || !id) return;
    try {
      await apiClient.deleteEvent(resolvedTripId, id);
      setEvents((prev) => (prev ? prev.filter((e) => e.id !== id) : prev));
    } catch (e) {
      setError('Failed to delete event. Please try again.');
    } finally {
      setEditing(null);
    }
  };

  const saveEditing = async () => {
    if (!resolvedTripId || !editing || !editing.id) return;
    try {
      const updated = await apiClient.updateEvent(resolvedTripId, editing.id, {
        title: editing.title,
        description: editing.description,
        start_minutes: editing.start_minutes,
        end_minutes: editing.end_minutes,
        date: editing.date,
      });
      setEvents((prev) => {
        if (!prev) return prev;
        const next = prev.map((e) => (e.id === updated.id ? updated : e));
        next.sort((a, b) => {
          if (a.date < b.date) return -1;
          if (a.date > b.date) return 1;
          return a.start_minutes - b.start_minutes;
        });
        return next;
      });
      setEditing(null);
    } catch (e) {
      setError('Failed to update event. Please try again.');
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Activities</h1>

      {error && (
        <div className="p-4 bg-red-100 text-red-500 rounded-md mb-4">
          {error}
        </div>
      )}

      {events === null ? (
        <div className="space-y-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No activities yet. Create events in Days to see them here grouped by
          date.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayEvents]) => (
            <Card key={date}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {formatDisplayDate(date)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start justify-between gap-4 border rounded-md p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => setEditing(ev)}
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{ev.title}</div>
                      {ev.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {ev.description}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap self-center">
                      {`${String(Math.floor(ev.start_minutes / 60)).padStart(2, '0')}:${String(ev.start_minutes % 60).padStart(2, '0')}`}
                      {' – '}
                      {`${String(Math.floor(ev.end_minutes / 60)).padStart(2, '0')}:${String(ev.end_minutes % 60).padStart(2, '0')}`}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!editing}
        onOpenChange={(open) => (!open ? setEditing(null) : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit activity</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input
                placeholder="Event title"
                value={editing.title}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev
                      ? ({
                          ...prev,
                          title: e.target.value,
                        } as ItineraryEventDto)
                      : prev,
                  )
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="time"
                  value={minutesToTimeLabel(editing.start_minutes)}
                  min="00:00"
                  max="23:59"
                  step={minuteStep * 60}
                  className="bg-background focus:bg-muted"
                  onChange={(e) => {
                    const [h, m] = e.target.value
                      .split(':')
                      .map((x) => parseInt(x, 10));
                    const mins = clamp(h * 60 + m, 0, 23 * 60 + 59);
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            start_minutes: Math.min(
                              mins,
                              (prev.end_minutes ?? 0) - 1,
                            ),
                          }
                        : prev,
                    );
                  }}
                />
                <Input
                  type="time"
                  value={minutesToTimeLabel(
                    editing.end_minutes >= 24 * 60
                      ? 24 * 60 - 1
                      : editing.end_minutes,
                  )}
                  min="00:00"
                  max="23:59"
                  step={minuteStep * 60}
                  className="bg-background focus:bg-muted"
                  onChange={(e) => {
                    const [h, m] = e.target.value
                      .split(':')
                      .map((x) => parseInt(x, 10));
                    const mins = clamp(h * 60 + m, 0, 23 * 60 + 59);
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            end_minutes: Math.max(
                              mins,
                              (prev.start_minutes ?? 0) + minuteStep,
                            ),
                          }
                        : prev,
                    );
                  }}
                />
              </div>
              <DatePicker
                date={new Date(editing.date)}
                setDate={(d) => {
                  if (!d) return;
                  d.setHours(0, 0, 0, 0);
                  const iso = d.toISOString().slice(0, 10);
                  setEditing((prev) => (prev ? { ...prev, date: iso } : prev));
                }}
                className="w-full"
              />
              <Textarea
                placeholder="Description"
                value={editing.description ?? ''}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev,
                  )
                }
                className="min-h-[100px]"
              />
            </div>
          )}
          <DialogFooter className="flex flex-col md:flex-row gap-2 md:gap-2">
            <Button
              className="w-full md:w-auto"
              variant="secondary"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button
              className="w-full md:w-auto"
              variant="destructive"
              onClick={() => deleteEvent(editing?.id)}
            >
              Delete
            </Button>
            <Button className="w-full md:w-auto" onClick={saveEditing}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
