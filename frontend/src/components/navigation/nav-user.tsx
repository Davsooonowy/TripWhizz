import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar.tsx';
import { getInitials } from '@/components/util/avatar-utils';
import { type User, UsersApiClient } from '@/lib/api/users.ts';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';
import { PreferencesApiClient } from '@/lib/api/preferences';
import { useToast } from '@/components/ui/use-toast';

import { useEffect, useState } from 'react';

import { Bell, ChevronsUpDown, LogOut, Settings2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export function NavUser() {
  const { isMobile } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [showAvatar, setShowAvatar] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const apiClient = new UsersApiClient(authenticationProviderInstance);
        const userData = await apiClient.getActiveUser();
        setUser(userData);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load user', variant: 'destructive' });
      }
    };
    const fetchPrefs = async () => {
      try {
        const prefsClient = new PreferencesApiClient(authenticationProviderInstance);
        const prefs = await prefsClient.getPreferences();
        setShowAvatar(prefs?.data?.privacy?.profile_visible !== false);
      } catch {}
    };

    fetchUser();
    fetchPrefs();
  }, []);

  const handleLogout = () => {
    authenticationProviderInstance.logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const userInitials = getInitials(
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.email || user.username || '',
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
              <Avatar className="h-8 w-8 rounded-lg">
                {showAvatar && (
                  <AvatarImage
                    src={user.avatar_url || undefined}
                    alt={user.first_name || user.username}
                  />
                )}
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.username}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <Link
                to="/settings/profile"
                className="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  {showAvatar && (
                    <AvatarImage
                      src={user.avatar_url || undefined}
                      alt={user.username}
                    />
                  )}
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.username}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/friends">
                  <Users className="mr-2 h-4 w-4" />
                  Friends
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
