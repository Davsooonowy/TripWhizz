import type * as React from 'react';
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
} from 'lucide-react';

import { NavMain } from '@/components/navigation/nav-main.tsx';
import { NavUser } from '@/components/navigation/nav-user.tsx';
import { TripSwitcher } from '@/components/navigation/trip-switcher.tsx';
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
} from '@/components/ui/sidebar.tsx';
import { useDarkMode } from '@/components/util/dark-mode-provider.tsx';
import { TripCompanions } from '@/components/navigation/trip-companions';


// dummy data and dummy companions before we will implement real ones :)
const data = {
  trips: [
    {
      name: 'Paris Adventure',
      logo: Plane,
      dates: 'May 15-22, 2024',
    },
    {
      name: 'Beach Getaway',
      logo: Palmtree,
      dates: 'July 10-17, 2024',
    },
    {
      name: 'Mountain Hiking',
      logo: Mountain,
      dates: 'Aug 5-12, 2024',
    },
  ],
  navMain: [
    {
      title: 'Itinerary',
      url: '/itinerary',
      icon: Calendar,
      items: [
        {
          title: 'Day Plans',
          url: '/itinerary/days',
        },
        {
          title: 'Activities',
          url: '/itinerary/activities',
        },
        {
          title: 'Bookings',
          url: '/itinerary/bookings',
        },
      ],
    },
    {
      title: 'Expenses',
      url: '/expenses',
      icon: DollarSign,
      items: [
        {
          title: 'Overview',
          url: '/expenses/overview',
        },
        {
          title: 'Split Bills',
          url: '/expenses/split',
        },
        {
          title: 'Add Expense',
          url: '/expenses/add',
        },
      ],
    },
    {
      title: 'Maps',
      url: '/maps',
      icon: Map,
      items: [
        {
          title: 'Destinations',
          url: '/maps/destinations',
        },
        {
          title: 'Navigation',
          url: '/maps/navigation',
        },
        {
          title: 'Points of Interest',
          url: '/maps/poi',
        },
      ],
    },
    {
      title: 'Packing List',
      url: '/packing',
      icon: CheckSquare,
      items: [
        {
          title: 'My Items',
          url: '/packing/items',
        },
        {
          title: 'Shared Items',
          url: '/packing/shared',
        },
        {
          title: 'Templates',
          url: '/packing/templates',
        },
      ],
    },
  ],
  companions: [
    {
      name: 'Alex Johnson',
      avatar: '/placeholder.svg?height=40&width=40',
      color: 'bg-blue-500',
    },
    {
      name: 'Sarah Miller',
      avatar: '/placeholder.svg?height=40&width=40',
      color: 'bg-pink-500',
    },
    {
      name: 'James Wilson',
      avatar: '/placeholder.svg?height=40&width=40',
      color: 'bg-green-500',
    },
    {
      name: 'Emily Davis',
      avatar: '/placeholder.svg?height=40&width=40',
      color: 'bg-purple-500',
    },
    {
      name: 'David Brown',
      avatar: '/placeholder.svg?height=40&width=40',
      color: 'bg-amber-500',
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

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
            <TripCompanions companions={data.companions} />
          </SidebarGroupContent>
        </SidebarGroup> </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleDarkMode}>
              {isDarkMode ? (
                <IconSun className="h-5 w-5 flex-shrink-0" />
              ) : (
                <IconMoon className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm w-24 truncate">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <NavUser user={data.user} />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
