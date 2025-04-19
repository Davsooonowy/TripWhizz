"use client"

import type * as React from "react"
import { ChevronsUpDown, Plus, MapPin, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"

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
  plane: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  ),
  beach: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M12 9v1M12 4c0-1.1.9-2 2-2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2" />
      <path d="M5 19a7.1 7.1 0 0 1 0-10 7 7 0 0 1 10 0 7.1 7.1 0 0 1 0 10" />
      <path d="M19.5 19c.9-1.1 1.5-2.5 1.5-4 0-3.9-3.1-7-7-7s-7 3.1-7 7c0 1.5.5 2.9 1.5 4" />
      <path d="M12 19v3" />
    </svg>
  ),
  mountain: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  ),
  city: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  ),
  camping: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M17 20V8h2a2 2 0 0 0 0-4H5a2 2 0 0 0 0 4h2v12" />
      <path d="M9 20h6" />
      <path d="m9 16 3-8 3 8" />
      <path d="M13 20v-4" />
    </svg>
  ),
  cruise: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M2 20a6 6 0 0 0 12 0c0-4-3-6-6-8-3 2-6 4-6 8Z" />
      <path d="M16.5 13.5c1.7.9 3 2.1 3.7 3.5" />
      <path d="M19 17h.01" />
      <path d="M22 20c-1 0-4-.5-4-2" />
      <path d="M18 20a6 6 0 0 0 4 0" />
    </svg>
  ),
  train: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <rect x="4" y="3" width="16" height="16" rx="2" />
      <path d="M4 11h16" />
      <path d="M12 3v8" />
      <path d="m8 19-2 3" />
      <path d="m18 22-2-3" />
      <path d="M8 15h0" />
      <path d="M16 15h0" />
    </svg>
  ),
  "road trip": () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.6-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.9 2 11 2 11.3V15c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
}

// Update the getIconComponent function to properly handle icon rendering
const getIconComponent = (iconName?: string) => {
  if (!iconName || !iconMap[iconName.toLowerCase()]) {
    return <MapPin className="size-4" />
  }

  const IconComponent = iconMap[iconName.toLowerCase()]
  return <IconComponent />
}

// Update the TripSwitcher component to properly display icons with their colors
export function TripSwitcher() {
  const { isMobile } = useSidebar()
  const { trips, selectedTrip, setSelectedTrip, refreshContent } = useTripContext()
  const hasTrips = trips.length > 0

  const handleTripSelection = (trip: any) => {
    setSelectedTrip(trip)
    // Trigger content refresh after trip selection
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
