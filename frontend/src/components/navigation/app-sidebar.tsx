import { NavMain } from '@/components/navigation/nav-main.tsx';
import { NavUser } from '@/components/navigation/nav-user.tsx';
import { TripCompanions } from '@/components/navigation/trip-companions';
import { TripSwitcher } from '@/components/navigation/trip-switcher.tsx';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar.tsx';
import { useDarkMode } from '@/components/util/dark-mode-provider.tsx';
import { useTripContext } from '@/components/util/trip-context';

import type * as React from 'react';

import {
  Calendar,
  CheckSquare,
  DollarSign,
  MoonIcon as IconMoon,
  SunIcon as IconSun,
  Map,
} from 'lucide-react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { trips, selectedTrip } = useTripContext();
  const hasTrips = trips.length > 0;

  const data = {
    navMain: [
      {
        title: 'Itinerary',
        url: selectedTrip ? `/trip/${selectedTrip.id}/itinerary` : '/itinerary',
        icon: Calendar,
        items: [
          {
            title: 'Day Plans',
            url: selectedTrip ? `/trip/${selectedTrip.id}/itinerary/days` : '/itinerary/days',
          },
          {
            title: 'Activities',
            url: selectedTrip ? `/trip/${selectedTrip.id}/itinerary/activities` : '/itinerary/activities',
          },
          {
            title: 'Bookings',
            url: selectedTrip ? `/trip/${selectedTrip.id}/itinerary/bookings` : '/itinerary/bookings',
          },
        ],
      },
      {
        title: 'Expenses',
        url: selectedTrip ? `/trip/${selectedTrip.id}/expenses` : '/expenses',
        icon: DollarSign,
        items: [
          {
            title: 'Overview',
            url: selectedTrip ? `/trip/${selectedTrip.id}/expenses/overview` : '/expenses/overview',
          },
          {
            title: 'Split Bills',
            url: selectedTrip ? `/trip/${selectedTrip.id}/expenses/split` : '/expenses/split',
          },
          {
            title: 'Add Expense',
            url: selectedTrip ? `/trip/${selectedTrip.id}/expenses/add` : '/expenses/add',
          },
        ],
      },
      {
        title: 'Maps',
        url: selectedTrip ? `/trip/${selectedTrip.id}/maps` : '/maps',
        icon: Map,
        items: [
          {
            title: 'Destinations',
            url: selectedTrip ? `/trip/${selectedTrip.id}/maps/destinations` : '/maps/destinations',
          },
          {
            title: 'Navigation',
            url: selectedTrip ? `/trip/${selectedTrip.id}/maps/navigation` : '/maps/navigation',
          },
          {
            title: 'Points of Interest',
            url: selectedTrip ? `/trip/${selectedTrip.id}/maps/poi` : '/maps/poi',
          },
        ],
      },
      {
        title: 'Packing List',
        url: selectedTrip ? `/trip/${selectedTrip.id}/packing` : '/packing',
        icon: CheckSquare,
        items: [
          {
            title: 'My Items',
            url: selectedTrip ? `/trip/${selectedTrip.id}/packing/items` : '/packing/items',
          },
          {
            title: 'Shared Items',
            url: selectedTrip ? `/trip/${selectedTrip.id}/packing/shared` : '/packing/shared',
          },
          {
            title: 'Templates',
            url: selectedTrip ? `/trip/${selectedTrip.id}/packing/templates` : '/packing/templates',
          },
        ],
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TripSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} hasTrips={hasTrips} />
        {hasTrips && (
          <SidebarGroup>
            <SidebarGroupLabel>Trip Companions</SidebarGroupLabel>
            <SidebarGroupContent>
              <TripCompanions />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
              <span className="text-sm w-24 truncate">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <NavUser />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
