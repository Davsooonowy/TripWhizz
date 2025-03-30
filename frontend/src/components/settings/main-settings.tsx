import type React from "react"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import {
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  Languages,
  LogOut,
  MapPin,
  Moon,
  Palette,
  Shield,
  Sun,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useDarkMode } from "@/components/util/dark-mode-provider"
import { authenticationProviderInstance } from "@/lib/authentication-provider"
import { useNavigate } from "react-router-dom"
import { UsersApiClient } from "@/lib/api/users"
import type { User as UserType } from "@/lib/api/users"

export default function MainSettings() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const apiClient = new UsersApiClient(authenticationProviderInstance)
        const userData = await apiClient.getActiveUser()
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = () => {
    authenticationProviderInstance.logout()
    navigate("/login")
  }

  return (
    <div className="pb-20 md:pb-10">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-card rounded-2xl p-4 mb-6 shadow-sm border"
          >
            <div className="flex items-center">
              <Avatar className="h-16 w-16 border-2 border-background">
                <AvatarImage src={user?.avatar || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {user?.first_name?.[0] || user?.username?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 flex-1">
                <h2 className="font-semibold text-lg">{isLoading ? "Loading..." : user?.first_name || user?.username}</h2>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" asChild>
                <Link to="/settings/profile">
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>

          <div className="space-y-6">

            <SettingsSection title="Preferences" delay={0.3}>
              <SettingsItem
                icon={isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                title="Dark Mode"
                action={<Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />}
              />
              <SettingsItem icon={<Palette className="h-5 w-5" />} title="Appearance" to="/appearance" />
              <SettingsItem
                icon={<Languages className="h-5 w-5" />}
                title="Language"
                subtitle="English"
                to="/language"
              />
              <SettingsItem icon={<Globe className="h-5 w-5" />} title="Region" subtitle="United States" to="/region" />
            </SettingsSection>

            <SettingsSection title="Travel Preferences" delay={0.4}>
              <SettingsItem
                icon={<MapPin className="h-5 w-5" />}
                title="Default Map View"
                subtitle="Standard"
                to="/map-preferences"
              />
              <SettingsItem
                icon={<Bell className="h-5 w-5" />}
                title="Trip Reminders"
                subtitle="1 day before"
                to="/trip-reminders"
              />
            </SettingsSection>

            <SettingsSection title="Privacy" delay={0.5}>
              <SettingsItem icon={<Shield className="h-5 w-5" />} title="Privacy Settings" to="/privacy" />
              <SettingsItem icon={<Bell className="h-5 w-5" />} title="Notification Preferences" to="/notifications" />
            </SettingsSection>

            <SettingsSection title="Support" delay={0.6}>
              <SettingsItem icon={<HelpCircle className="h-5 w-5" />} title="Help Center" to="/help" />
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
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-2" />
                Log Out
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

interface SettingsSectionProps {
  title: string
  children: React.ReactNode
  delay?: number
}

function SettingsSection({ title, children, delay = 0 }: SettingsSectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}>
      <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">{title}</h2>
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm border">{children}</div>
    </motion.div>
  )
}

interface SettingsItemProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  to?: string
  action?: React.ReactNode
  onClick?: () => void
}

function SettingsItem({ icon, title, subtitle, to, action, onClick }: SettingsItemProps) {
  const content = (
    <div className="flex items-center justify-between py-3.5 px-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center">
        <div className="text-primary mr-3">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action || <ChevronRight className="h-5 w-5 text-muted-foreground/70" />}
    </div>
  )

  if (to) {
    return (
      <>
        <Link to={to}>{content}</Link>
        <Separator />
      </>
    )
  }

  return (
    <>
      <div className={onClick ? "cursor-pointer" : ""} onClick={onClick}>
        {content}
      </div>
      <Separator />
    </>
  )
}
