import * as React from 'react';
import { ChevronsUpDown, Plus, MapPin, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar.tsx';

export function TripSwitcher({
  trips,
  hasTrips,
}: {
  trips: {
    name: string;
    logo: React.ElementType;
    dates: string;
  }[];
  hasTrips: boolean;
}) {
  const { isMobile } = useSidebar();
  const [activeTrip, setActiveTrip] = React.useState(
    hasTrips ? trips[0] : null,
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {hasTrips ? (
                <>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {activeTrip && <activeTrip.logo className="size-4" />}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeTrip?.name}
                    </span>
                    <span className="truncate text-xs">
                      {activeTrip?.dates}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <MapPin className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">No Trips Yet</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Create your first adventure
                    </span>
                  </div>
                </>
              )}
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            {hasTrips ? (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Your Trips
                </DropdownMenuLabel>
                {trips.map((trip, index) => (
                  <DropdownMenuItem
                    key={trip.name}
                    onClick={() => setActiveTrip(trip)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <trip.logo className="size-4 shrink-0" />
                    </div>
                    <div className="flex flex-col">
                      <span>{trip.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {trip.dates}
                      </span>
                    </div>
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
              </>
            ) : (
              <div className="px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <p className="text-sm font-medium">No trips available</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Start by creating your first trip to begin planning your
                  adventure
                </p>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link to="/trip">
                <div className="flex size-6 items-center justify-center rounded-md border bg-primary/10 text-primary">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium">
                  {hasTrips ? 'Plan New Trip' : 'Create First Trip'}
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
