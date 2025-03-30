"use client"

import type * as React from "react"
import {
  Calendar,
  CheckSquare,
  DollarSign,
  Map,
  MoonIcon as IconMoon,
  Mountain,
  Palmtree,
  Plane,
  SunIcon as IconSun,
  UserPlus,
} from "lucide-react"

import { NavMain } from "@/components/navigation/nav-main.tsx"
import { NavUser } from "@/components/navigation/nav-user.tsx"
import { TripSwitcher } from "@/components/navigation/trip-switcher.tsx"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar.tsx"
import { useDarkMode } from "@/components/util/dark-mode-provider.tsx"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const data = {
  trips: [
    {
      name: "Paris Adventure",
      logo: Plane,
      dates: "May 15-22, 2024",
    },
    {
      name: "Beach Getaway",
      logo: Palmtree,
      dates: "July 10-17, 2024",
    },
    {
      name: "Mountain Hiking",
      logo: Mountain,
      dates: "Aug 5-12, 2024",
    },
  ],
  navMain: [
    {
      title: "Itinerary",
      url: "/itinerary",
      icon: Calendar,
      items: [
        {
          title: "Day Plans",
          url: "/itinerary/days",
        },
        {
          title: "Activities",
          url: "/itinerary/activities",
        },
        {
          title: "Bookings",
          url: "/itinerary/bookings",
        },
      ],
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: DollarSign,
      items: [
        {
          title: "Overview",
          url: "/expenses/overview",
        },
        {
          title: "Split Bills",
          url: "/expenses/split",
        },
        {
          title: "Add Expense",
          url: "/expenses/add",
        },
      ],
    },
    {
      title: "Maps",
      url: "/maps",
      icon: Map,
      items: [
        {
          title: "Destinations",
          url: "/maps/destinations",
        },
        {
          title: "Navigation",
          url: "/maps/navigation",
        },
        {
          title: "Points of Interest",
          url: "/maps/poi",
        },
      ],
    },
    {
      title: "Packing List",
      url: "/packing",
      icon: CheckSquare,
      items: [
        {
          title: "My Items",
          url: "/packing/items",
        },
        {
          title: "Shared Items",
          url: "/packing/shared",
        },
        {
          title: "Templates",
          url: "/packing/templates",
        },
      ],
    },
  ],
  companions: [
    {
      name: "Alex Johnson",
      url: "/companions/alex",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "bg-blue-500",
    },
    {
      name: "Sarah Miller",
      url: "/companions/sarah",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "bg-pink-500",
    },
    {
      name: "James Wilson",
      url: "/companions/james",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "bg-green-500",
    },
    {
      name: "Emily Davis",
      url: "/companions/emily",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "bg-purple-500",
    },
    {
      name: "David Brown",
      url: "/companions/david",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "bg-amber-500",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TripSwitcher trips={data.trips} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarGroup>
          <SidebarGroupLabel>Trip Companions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.companions.slice(0, 3).map((companion) => (
                <SidebarMenuItem key={companion.name}>
                  <SidebarMenuButton asChild>
                    <a href={companion.url} className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={companion.avatar} alt={companion.name} />
                        <AvatarFallback className={companion.color}>{companion.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{companion.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {data.companions.length > 3 && (
                <SidebarMenuItem>
                  <Dialog>
                    <DialogTrigger asChild>
                      <SidebarMenuButton>
                        <div className="flex -space-x-2 mr-2">
                          {data.companions.slice(3, 5).map((companion, index) => (
                            <Avatar key={index} className="h-6 w-6 border-2 border-sidebar">
                              <AvatarImage src={companion.avatar} alt={companion.name} />
                              <AvatarFallback className={companion.color}>{companion.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span>View All ({data.companions.length})</span>
                      </SidebarMenuButton>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Trip Companions</DialogTitle>
                        <DialogDescription>All travelers joining you on this adventure</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4 max-h-[60vh] overflow-auto">
                        {data.companions.map((companion) => (
                          <div key={companion.name} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                            <Avatar>
                              <AvatarImage src={companion.avatar} alt={companion.name} />
                              <AvatarFallback className={companion.color}>{companion.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium leading-none">{companion.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">Traveler</p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={companion.url}>View</a>
                            </Button>
                          </div>
                        ))}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" className="w-full">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite New Companion
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleDarkMode}>
              {isDarkMode ? (
                <IconSun className="h-5 w-5 flex-shrink-0" />
              ) : (
                <IconMoon className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm w-24 truncate">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <NavUser user={data.user} />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
