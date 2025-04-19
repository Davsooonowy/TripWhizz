"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import {
  Calendar,
  Map,
  Users,
  Clock,
  Plane,
  Palmtree,
  Mountain,
  Building2,
  Tent,
  Ship,
  Train,
  Car,
  ArrowRight,
  Plus,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useTripContext } from "@/components/util/trip-context"
import { TripsApiClient, type TripData, type TripStage } from "@/lib/api/trips"
import { authenticationProviderInstance } from "@/lib/authentication-provider"
import { EmptyContent } from "@/components/not-available/empty-content"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

const iconMap: Record<string, React.ElementType> = {
  plane: Plane,
  beach: Palmtree,
  mountain: Mountain,
  city: Building2,
  camping: Tent,
  cruise: Ship,
  train: Train,
  "road trip": Car,
}

export default function TripHome() {
  const { selectedTrip, isLoading, error, refreshTrips } = useTripContext()
  const [tripDetails, set_TripDetails] = useState<TripData | null>(null)
  const [stages, setStages] = useState<TripStage[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!selectedTrip?.id) return

      setIsLoadingDetails(true)
      setDetailsError(null)

      try {
        const tripsApiClient = new TripsApiClient(authenticationProviderInstance)
        const details = await tripsApiClient.getTripDetails(selectedTrip.id)
        set_TripDetails(details)
        setStages(details.stages || [])
      } catch (err) {
        console.error("Error fetching trip details:", err)
        setDetailsError("Failed to load trip details. Please try again.")
      } finally {
        setIsLoadingDetails(false)
      }
    }

    fetchTripDetails()
  }, [selectedTrip]) // This dependency ensures content refreshes when selectedTrip changes

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshTrips()
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500)
    }
  }

  const calculateDaysUntilTrip = () => {
    if (!tripDetails?.start_date) return null

    const startDate = new Date(tripDetails.start_date)
    const today = new Date()

    // Reset time to compare just the dates
    today.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)

    const diffTime = startDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const calculateTripProgress = () => {
    if (!tripDetails?.start_date || !tripDetails?.end_date) return 0

    const startDate = new Date(tripDetails.start_date)
    const endDate = new Date(tripDetails.end_date)
    const today = new Date()

    // If trip hasn't started yet
    if (today < startDate) return 0

    // If trip has ended
    if (today > endDate) return 100

    // Calculate progress
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = today.getTime() - startDate.getTime()

    return Math.round((elapsed / totalDuration) * 100)
  }

  const getTripIcon = () => {
    if (!tripDetails?.icon) return Plane
    return iconMap[tripDetails.icon.toLowerCase()] || Plane
  }

  const TripIcon = getTripIcon()

  if (isLoading || isLoadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground animate-pulse">
            {isLoading ? "Changing your trip..." : "Loading trip details..."}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Alert variant="destructive" title="Error" description={error} />
      </div>
    )
  }

  if (!selectedTrip) {
    return (
      <EmptyContent
        title="No Trips Yet"
        message="You haven't created any trips yet. Start planning your next adventure!"
        buttonText="Create Trip"
        onButtonClick={() => navigate("/trip/new")}
      />
    )
  }

  const daysUntilTrip = calculateDaysUntilTrip()
  const tripProgress = calculateTripProgress()

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-20 md:pb-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTrip.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="trip-transition"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Trip Dashboard</h1>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing}`} />
              Refresh
            </Button>
          </div>

          {detailsError && <Alert variant="destructive" title="Error" description={detailsError} className="mb-6" />}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="mb-6 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn("p-3 rounded-lg", tripDetails?.icon_color || "bg-primary")}
                  >
                    <TripIcon className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-xl">{tripDetails?.name || selectedTrip.name}</CardTitle>
                    <CardDescription>
                      {tripDetails?.destination || selectedTrip.destination}
                      {tripDetails?.start_date && tripDetails?.end_date && (
                        <span>
                          {" "}
                          • {new Date(tripDetails.start_date).toLocaleDateString()} -{" "}
                          {new Date(tripDetails.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tripDetails?.description && (
                  <p className="text-sm text-muted-foreground mb-4">{tripDetails.description}</p>
                )}

                <motion.div
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <StatCard
                    icon={<Calendar className="h-5 w-5 text-blue-500" />}
                    label="Trip Dates"
                    value={
                      tripDetails?.start_date && tripDetails?.end_date
                        ? `${new Date(tripDetails.start_date).toLocaleDateString()} - ${new Date(tripDetails.end_date).toLocaleDateString()}`
                        : "Not set"
                    }
                  />
                  <StatCard
                    icon={<Clock className="h-5 w-5 text-amber-500" />}
                    label="Days Until Trip"
                    value={
                      daysUntilTrip !== null
                        ? daysUntilTrip <= 0
                          ? daysUntilTrip === 0
                            ? "Today!"
                            : "In progress"
                          : `${daysUntilTrip} days`
                        : "Not set"
                    }
                  />
                  <StatCard
                    icon={<Users className="h-5 w-5 text-purple-500" />}
                    label="Companions"
                    value={tripDetails?.participants_count?.toString() || "0"}
                  />
                  <StatCard
                    icon={<Map className="h-5 w-5 text-green-500" />}
                    label="Stages"
                    value={stages.length.toString()}
                  />
                </motion.div>

                {tripDetails?.start_date && tripDetails?.end_date && (
                  <motion.div
                    className="space-y-2 mb-6"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "100%" }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="flex justify-between text-sm">
                      <span>Trip Progress</span>
                      <span>{tripProgress}%</span>
                    </div>
                    <Progress value={tripProgress} className="h-2" />
                  </motion.div>
                )}

                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <h3 className="text-lg font-medium mb-3">Trip Stages</h3>
                  {stages.length > 0 ? (
                    <div className="space-y-3">
                      {stages.slice(0, 5).map((stage, index) => (
                        <motion.div
                          key={stage.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 * index }}
                        >
                          <StageItem stage={stage} />
                        </motion.div>
                      ))}
                      {stages.length > 5 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                        >
                          <Button variant="outline" className="w-full mt-2" asChild>
                            <Link to="/trip/stages">View All {stages.length} Stages</Link>
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      className="text-center py-6 border border-dashed rounded-lg"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Map className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground mb-2">No stages added yet</p>
                      <Button size="sm" asChild>
                        <Link to="/trip/new/stages">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Stages
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </motion.div>

                {tripDetails?.tags && tripDetails.tags.length > 0 && (
                  <motion.div
                    className="flex flex-wrap gap-2 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    {tripDetails.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </motion.div>
                )}

                <motion.div
                  className="text-center text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <p>
                    More trip planning features coming soon! Stay tuned for itinerary management, expense tracking, and
                    more.
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <motion.div
      className="bg-muted/50 rounded-lg p-3 flex flex-col items-center text-center"
      whileHover={{ scale: 1.05, backgroundColor: "hsl(var(--muted))" }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-1">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </motion.div>
  )
}

interface QuickAccessCardProps {
  title: string
  icon: React.ReactNode
  description: string
  linkText: string
  linkUrl: string
}

function QuickAccessCard({ title, icon, description, linkText, linkUrl }: QuickAccessCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">{icon}</div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
          <Link to={linkUrl}>
            {linkText}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

interface StageItemProps {
  stage: TripStage
}

function StageItem({ stage }: StageItemProps) {
  // Get category color based on category name or custom color
  const getCategoryColor = () => {
    if (stage.is_custom_category && stage.custom_category_color) {
      return stage.custom_category_color
    }

    // Default colors based on category
    const categoryColors: Record<string, string> = {
      accommodation: "bg-blue-500",
      transport: "bg-green-500",
      flight: "bg-purple-500",
      dining: "bg-amber-500",
      activity: "bg-pink-500",
      attraction: "bg-teal-500",
      event: "bg-red-500",
      cruise: "bg-indigo-500",
      train: "bg-cyan-500",
      relaxation: "bg-orange-500",
    }

    return categoryColors[stage.category] || "bg-gray-500"
  }

  return (
    <motion.div
      className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
      whileHover={{ x: 5, backgroundColor: "hsl(var(--muted)/50)" }}
      transition={{ duration: 0.2 }}
    >
      <div className={cn("w-2 h-10 rounded-full mr-3", getCategoryColor())}></div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{stage.name}</p>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="truncate capitalize">{stage.category}</span>
          {stage.start_date && stage.end_date && (
            <span className="ml-2">
              {new Date(stage.start_date).toLocaleDateString()} - {new Date(stage.end_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface AlertProps {
  variant: "default" | "destructive"
  title: string
  description: string
  className?: string
}

function Alert({ variant, title, description, className }: AlertProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        variant === "destructive"
          ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
        className,
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="mt-1 text-sm">{description}</div>
        </div>
      </div>
    </div>
  )
}
