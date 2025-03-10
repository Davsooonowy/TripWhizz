import { User, Compass, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface JourneyTrackerProps {
  currentStep: number
}

export function ProgressTracker({ currentStep }: JourneyTrackerProps) {
  const steps = [
    {
      id: 1,
      name: "Personal Info",
      icon: User,
      description: "Your profile",
    },
    {
      id: 2,
      name: "Preferences",
      icon: Compass,
      description: "Travel style",
    },
    {
      id: 3,
      name: "Travel Habits",
      icon: Users,
      description: "Your companions",
    },
  ]

  return (
    <div className="relative">
      {/* Desktop version */}
      <div className="hidden md:flex justify-between items-center">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep >= step.id
          const isComplete = currentStep > step.id

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg scale-110"
                    : "bg-muted text-muted-foreground",
                  isComplete && "ring-2 ring-primary ring-offset-2",
                )}
              >
                <Icon className="h-8 w-8" />
              </div>

              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "font-medium transition-all duration-300",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.name}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="absolute top-8 left-[calc(100%+8px)] w-[calc(100%-48px)] h-1 bg-transparent">
                  <div
                    className="h-full bg-transparent transition-all duration-500"
                    style={{
                      width: currentStep > step.id ? "100%" : "0%",
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile version - more visually interesting */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-2 mb-8">
          {steps.map((step) => {
            const Icon = step.icon
            const isActive = currentStep >= step.id
            const isCurrent = currentStep === step.id

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg scale-110"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-2 ring-primary ring-offset-4",
                  )}
                >
                  <Icon className={cn("transition-all duration-300", isActive ? "h-7 w-7" : "h-6 w-6")} />
                </div>
                <p
                  className={cn(
                    "text-xs mt-2 font-medium transition-all duration-300",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.name}
                </p>
              </div>
            )
          })}

          <div className="absolute top-7 left-0 w-full h-1 bg-muted -z-10">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

