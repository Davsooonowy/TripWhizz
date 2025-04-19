import type * as React from "react"
import { ChevronsUpDown, Plus, MapPin, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"

import {
  Plane,
  Palmtree,
  Mountain,
  Building2,
  Tent,
  Ship,
  Train,
  Car,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar.tsx"
import { useTripContext } from "@/components/util/trip-context"

const iconMap: Record<string, React.FC> = {
  plane: Plane,
  beach: Palmtree,
  mountain: Mountain,
  city: Building2,
  camping: Tent,
  cruise: Ship,
  train: Train,
  "road trip": Car,
};

const getIconComponent = (iconName?: string) => {
  if (!iconName || !iconMap[iconName.toLowerCase()]) {
    return <MapPin className="size-4" />
  }

  const IconComponent = iconMap[iconName.toLowerCase()]
  return <IconComponent />
}

export function TripSwitcher() {
  const { isMobile } = useSidebar()
  const { trips, selectedTrip, setSelectedTrip, refreshContent } = useTripContext()
  const hasTrips = trips.length > 0

  const handleTripSelection = (trip: any) => {
    setSelectedTrip(trip)
    setTimeout(() => refreshContent(), 100)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {hasTrips && selectedTrip ? (
                <>
                  <div
                    className={`flex aspect-square size-8 items-center justify-center rounded-lg ${selectedTrip.icon_color || "bg-sidebar-primary"} text-sidebar-primary-foreground`}
                  >
                    {getIconComponent(selectedTrip.icon)}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{selectedTrip.name}</span>
                    <span className="truncate text-xs">{selectedTrip.destination}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <MapPin className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">No Trips Yet</span>
                    <span className="truncate text-xs text-muted-foreground">Create your first adventure</span>
                  </div>
                </>
              )}
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {hasTrips ? (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Your Trips</DropdownMenuLabel>
                {trips.map((trip, index) => (
                  <DropdownMenuItem
                    key={trip.id}
                    onClick={() => handleTripSelection(trip)}
                    className={`gap-2 p-2 ${selectedTrip?.id === trip.id ? "bg-muted" : ""}`}
                  >
                    <div
                      className={`flex size-6 items-center justify-center rounded-sm border ${trip.icon_color || "bg-primary/10"}`}
                    >
                      {getIconComponent(trip.icon)}
                    </div>
                    <div className="flex flex-col">
                      <span>{trip.name}</span>
                      <span className="text-xs text-muted-foreground">{trip.destination}</span>
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
                  Start by creating your first trip to begin planning your adventure
                </p>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link to="/trip/new">
                <div className="flex size-6 items-center justify-center rounded-md border bg-primary/10 text-primary">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium">{hasTrips ? "Plan New Trip" : "Create First Trip"}</div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
