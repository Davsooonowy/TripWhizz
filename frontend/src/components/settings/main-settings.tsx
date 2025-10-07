import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useDarkMode } from '@/components/util/dark-mode-provider';
import { PreferencesApiClient, type UserPreferencesDTO } from '@/lib/api/preferences';
import { UsersApiClient } from '@/lib/api/users';
import type { User as UserType } from '@/lib/api/users';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

import type React from 'react';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import {
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  Moon,
  Palette,
  Shield,
  Sun,
  UserX,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MainSettings() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferencesDTO | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const apiClient = new UsersApiClient(authenticationProviderInstance);
        const userData = await apiClient.getActiveUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPreferences = async () => {
      try {
        const prefsClient = new PreferencesApiClient(
          authenticationProviderInstance,
        );
        const prefs = await prefsClient.getPreferences();
        setPreferences(prefs);
        const prefDark = prefs?.data?.appearance?.dark_mode;
        if (typeof prefDark === 'boolean' && prefDark !== isDarkMode) {
          toggleDarkMode();
        }
      } catch (e) {
        // ignore, show defaults
      }
    };

    fetchUser();
    fetchPreferences();
  }, []);

  const handleLogout = () => {
    authenticationProviderInstance.logout();
    navigate('/login');
  };

  return (
    <div className="pb-20 md:pb-10">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-card rounded-2xl p-4 mb-6 shadow-sm border"
          >
            <div className="flex items-center">
              <Avatar className="h-16 w-16 border-2 border-background rounded-lg">
                <AvatarImage
                  src={typeof user?.avatar === 'string' ? user.avatar : ''}
                />{' '}
                <AvatarFallback className="bg-primary/10 text-primary text-xl rounded-lg">
                  {user?.first_name?.[0] || user?.username?.[0] || '?'}
                  {user?.last_name?.[0] || user?.last_name?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 flex-1">
                <h2 className="font-semibold text-lg">
                  {isLoading
                    ? 'Loading...'
                    : user?.username || user?.first_name}
                </h2>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                asChild
              >
                <Link to="/settings/profile">
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>

          <div className="space-y-6">
            <SettingsSection title="Preferences" delay={0.3}>
              <SettingsItem
                icon={
                  isDarkMode ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )
                }
                title="Dark Mode"
                action={
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={async (checked) => {
                      if (checked !== isDarkMode) toggleDarkMode();
                      try {
                        const client = new PreferencesApiClient(
                          authenticationProviderInstance,
                        );
                        const payload: Partial<UserPreferencesDTO> = {
                          data: {
                            ...(preferences?.data ?? {}),
                            appearance: {
                              ...(preferences?.data?.appearance ?? {}),
                              dark_mode: checked,
                            },
                          },
                        };
                        const saved = await client.updatePreferences(payload);
                        setPreferences(saved);
                      } catch (e) {
                        console.error('Failed to save preference', e);
                      }
                    }}
                  />
                }
              />
              <SettingsItem
                icon={<Palette className="h-5 w-5" />}
                title="Appearance preset"
                action={
                  <Select
                    value={(preferences?.data as any)?.appearance?.preset ?? 'default'}
                    onValueChange={async (value) => {
                      try {
                        const client = new PreferencesApiClient(
                          authenticationProviderInstance,
                        );
                        const payload: Partial<UserPreferencesDTO> = {
                          data: {
                            ...(preferences?.data ?? {}),
                            appearance: {
                              ...((preferences?.data as any)?.appearance ?? {}),
                              preset: value,
                            },
                          },
                        };
                        const saved = await client.updatePreferences(payload);
                        setPreferences(saved);
                      } catch (e) {
                        console.error('Failed to save appearance preset', e);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="rose">Rose</SelectItem>
                      <SelectItem value="emerald">Emerald</SelectItem>
                      <SelectItem value="slate">Slate</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
            </SettingsSection>

            <SettingsSection title="Notifications" delay={0.35}>
              <Collapsible open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between py-3.5 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center">
                      <div className="text-primary mr-3"><Bell className="h-5 w-5" /></div>
                      <div>
                        <p className="font-medium">Notification settings</p>
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-muted-foreground/70 transition-transform ${notificationsOpen ? 'rotate-90' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <Separator />
                <CollapsibleContent>
                  <SettingsItem
                    icon={<Bell className="h-5 w-5" />}
                    title="Friend requests"
                    action={
                      <Switch
                        checked={Boolean(preferences?.data?.notifications?.friend_request ?? true)}
                        onCheckedChange={async (checked) => {
                          try {
                            const client = new PreferencesApiClient(
                              authenticationProviderInstance,
                            );
                            const payload: Partial<UserPreferencesDTO> = {
                              data: {
                                ...(preferences?.data ?? {}),
                                notifications: {
                                  ...(preferences?.data?.notifications ?? {}),
                                  friend_request: checked,
                                },
                              },
                            };
                            const saved = await client.updatePreferences(payload);
                            setPreferences(saved);
                          } catch (e) {
                            console.error('Failed to save notifications', e);
                          }
                        }}
                      />
                    }
                  />
                  <SettingsItem
                    icon={<Bell className="h-5 w-5" />}
                    title="Friend request accepted"
                    action={
                      <Switch
                        checked={Boolean((preferences?.data as any)?.notifications?.friend_acceptance ?? true)}
                        onCheckedChange={async (checked) => {
                          try {
                            const client = new PreferencesApiClient(
                              authenticationProviderInstance,
                            );
                            const payload: Partial<UserPreferencesDTO> = {
                              data: {
                                ...(preferences?.data ?? {}),
                                notifications: {
                                  ...(preferences?.data?.notifications ?? {}),
                                  friend_acceptance: checked,
                                },
                              },
                            };
                            const saved = await client.updatePreferences(payload);
                            setPreferences(saved);
                          } catch (e) {
                            console.error('Failed to save notifications', e);
                          }
                        }}
                      />
                    }
                  />
                  <SettingsItem
                    icon={<Bell className="h-5 w-5" />}
                    title="Trip invitations"
                    action={
                      <Switch
                        checked={Boolean(preferences?.data?.notifications?.trip_invite ?? true)}
                        onCheckedChange={async (checked) => {
                          try {
                            const client = new PreferencesApiClient(
                              authenticationProviderInstance,
                            );
                            const payload: Partial<UserPreferencesDTO> = {
                              data: {
                                ...(preferences?.data ?? {}),
                                notifications: {
                                  ...(preferences?.data?.notifications ?? {}),
                                  trip_invite: checked,
                                },
                              },
                            };
                            const saved = await client.updatePreferences(payload);
                            setPreferences(saved);
                          } catch (e) {
                            console.error('Failed to save notifications', e);
                          }
                        }}
                      />
                    }
                  />
                  <SettingsItem
                    icon={<Bell className="h-5 w-5" />}
                    title="Trip changes"
                    action={
                      <Switch
                        checked={Boolean(preferences?.data?.notifications?.trip_update ?? true)}
                        onCheckedChange={async (checked) => {
                          try {
                            const client = new PreferencesApiClient(
                              authenticationProviderInstance,
                            );
                            const payload: Partial<UserPreferencesDTO> = {
                              data: {
                                ...(preferences?.data ?? {}),
                                notifications: {
                                  ...(preferences?.data?.notifications ?? {}),
                                  trip_update: checked,
                                },
                              },
                            };
                            const saved = await client.updatePreferences(payload);
                            setPreferences(saved);
                          } catch (e) {
                            console.error('Failed to save notifications', e);
                          }
                        }}
                      />
                    }
                  />
                  <SettingsItem
                    icon={<Bell className="h-5 w-5" />}
                    title="Expense added to trip"
                    action={
                      <Switch
                        checked={Boolean((preferences?.data as any)?.notifications?.expense_added ?? true)}
                        onCheckedChange={async (checked) => {
                          try {
                            const client = new PreferencesApiClient(
                              authenticationProviderInstance,
                            );
                            const payload: Partial<UserPreferencesDTO> = {
                              data: {
                                ...(preferences?.data ?? {}),
                                notifications: {
                                  ...(preferences?.data?.notifications ?? {}),
                                  expense_added: checked,
                                },
                              },
                            };
                            const saved = await client.updatePreferences(payload);
                            setPreferences(saved);
                          } catch (e) {
                            console.error('Failed to save notifications', e);
                          }
                        }}
                      />
                    }
                  />
                  <SettingsItem
                    icon={<Bell className="h-5 w-5" />}
                    title="Packing list updates"
                    action={
                      <Switch
                        checked={Boolean((preferences?.data as any)?.notifications?.packing_list_added ?? true)}
                        onCheckedChange={async (checked) => {
                          try {
                            const client = new PreferencesApiClient(
                              authenticationProviderInstance,
                            );
                            const payload: Partial<UserPreferencesDTO> = {
                              data: {
                                ...(preferences?.data ?? {}),
                                notifications: {
                                  ...(preferences?.data?.notifications ?? {}),
                                  packing_list_added: checked,
                                },
                              },
                            };
                            const saved = await client.updatePreferences(payload);
                            setPreferences(saved);
                          } catch (e) {
                            console.error('Failed to save notifications', e);
                          }
                        }}
                      />
                    }
                  />
                  <SettingsItem
                    icon={<Bell className="h-5 w-5" />}
                    title="Document uploaded"
                    action={
                      <Switch
                        checked={Boolean((preferences?.data as any)?.notifications?.document_added ?? true)}
                        onCheckedChange={async (checked) => {
                          try {
                            const client = new PreferencesApiClient(
                              authenticationProviderInstance,
                            );
                            const payload: Partial<UserPreferencesDTO> = {
                              data: {
                                ...(preferences?.data ?? {}),
                                notifications: {
                                  ...(preferences?.data?.notifications ?? {}),
                                  document_added: checked,
                                },
                              },
                            };
                            const saved = await client.updatePreferences(payload);
                            setPreferences(saved);
                          } catch (e) {
                            console.error('Failed to save notifications', e);
                          }
                        }}
                      />
                    }
                  />
                </CollapsibleContent>
              </Collapsible>
            </SettingsSection>

            <SettingsSection title="Privacy" delay={0.4}>
              <SettingsItem
                icon={<Shield className="h-5 w-5" />}
                title="Display avatar"
                action={
                  <Switch
                    checked={Boolean(preferences?.data?.privacy?.profile_visible ?? true)}
                    onCheckedChange={async (checked) => {
                      try {
                        const client = new PreferencesApiClient(
                          authenticationProviderInstance,
                        );
                        const payload: Partial<UserPreferencesDTO> = {
                          data: {
                            ...(preferences?.data ?? {}),
                            privacy: {
                              ...(preferences?.data?.privacy ?? {}),
                              profile_visible: checked,
                            },
                          },
                        };
                        const saved = await client.updatePreferences(payload);
                        setPreferences(saved);
                      } catch (e) {
                        console.error('Failed to save privacy', e);
                      }
                    }}
                  />
                }
              />
            </SettingsSection>

            <SettingsSection title="Travel Preferences" delay={0.45}>
              {/* Default Map View removed */}
              <SettingsItem
                icon={<Globe className="h-5 w-5" />}
                title="Trips sorting"
                action={
                  <Select
                    value={(preferences?.data as any)?.trip_sort ?? 'date'}
                    onValueChange={async (value: 'name' | 'date') => {
                      try {
                        const client = new PreferencesApiClient(
                          authenticationProviderInstance,
                        );
                        const payload: Partial<UserPreferencesDTO> = {
                          data: {
                            ...(preferences?.data ?? {}),
                            trip_sort: value,
                          },
                        };
                        const saved = await client.updatePreferences(payload);
                        setPreferences(saved);
                      } catch (e) {
                        console.error('Failed to save sorting', e);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">By name</SelectItem>
                      <SelectItem value="date">By date</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
            </SettingsSection>

            <SettingsSection title="Support" delay={0.6}>
              <SettingsItem
                icon={<HelpCircle className="h-5 w-5" />}
                title="Help Center"
                to="/help"
              />
              <SettingsItem
                icon={<Info className="h-5 w-5" />}
                title="About TripWhizz"
                subtitle="Version 1.0.0"
                to="/about"
              />
            </SettingsSection>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              className="pt-4"
            >
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Log Out
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <UserX className="h-5 w-5 mr-2" /> Delete account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        your account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          if (!user) return;
                          try {
                            const api = new UsersApiClient(
                              authenticationProviderInstance,
                            );
                            await api.deleteAccount(user.id);
                            authenticationProviderInstance.logout();
                            navigate('/login');
                          } catch (e) {
                            console.error('Failed to delete account', e);
                          }
                        }}
                      >
                        Confirm delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function SettingsSection({ title, children, delay = 0 }: SettingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
        {title}
      </h2>
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm border">
        {children}
      </div>
    </motion.div>
  );
}

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  to?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

function SettingsItem({
  icon,
  title,
  subtitle,
  to,
  action,
  onClick,
}: SettingsItemProps) {
  const content = (
    <div className="flex items-center justify-between py-3.5 px-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center">
        <div className="text-primary mr-3">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action || <ChevronRight className="h-5 w-5 text-muted-foreground/70" />}
    </div>
  );

  if (to) {
    return (
      <>
        <Link to={to}>{content}</Link>
        <Separator />
      </>
    );
  }

  return (
    <>
      <div className={onClick ? 'cursor-pointer' : ''} onClick={onClick}>
        {content}
      </div>
      <Separator />
    </>
  );
}
