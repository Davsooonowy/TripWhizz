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

const data = {
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { trips } = useTripContext();
  const hasTrips = trips.length > 0;

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
