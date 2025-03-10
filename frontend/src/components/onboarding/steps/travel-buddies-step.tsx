import type React from "react"
import { ArrowLeft, ArrowRight, Clock, Calendar, Briefcase, Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface TravelBuddiesStepProps {
  formData: {
    travelFrequency: string
    tripDuration: string
    travelCompanions: string[]
    notificationPreferences: string[]
  }
  updateFormData: (data: Partial<TravelBuddiesStepProps["formData"]>) => void
  onNext: () => void
  onBack: () => void
}

export function TravelBuddiesStep({ formData, updateFormData, onNext, onBack }: TravelBuddiesStepProps) {
  const handleFrequencyChange = (value: string) => {
    updateFormData({ travelFrequency: value })
  }

  const handleDurationChange = (value: string) => {
    updateFormData({ tripDuration: value })
  }

  const handleCompanionToggle = (companion: string) => {
    const companions = [...formData.travelCompanions]
    if (companions.includes(companion)) {
      updateFormData({ travelCompanions: companions.filter((c) => c !== companion) })
    } else {
      updateFormData({ travelCompanions: [...companions, companion] })
    }
  }

  const handleNotificationToggle = (notification: string) => {
    const notifications = [...formData.notificationPreferences]
    if (notifications.includes(notification)) {
      updateFormData({ notificationPreferences: notifications.filter((n) => n !== notification) })
    } else {
      updateFormData({ notificationPreferences: [...notifications, notification] })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  const companionOptions = [
    { id: "solo", label: "Solo Travel" },
    { id: "partner", label: "With Partner" },
    { id: "friends", label: "With Friends" },
    { id: "family", label: "With Family" },
  ]

  const notificationOptions = [
    { id: "trip_updates", label: "Trip Updates & Changes" },
    { id: "friend_joins", label: "When Friends Join Your Trip" },
    { id: "trip_invites", label: "Trip Invitations" },
    { id: "chat_messages", label: "Chat Messages" },
  ]

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="hidden md:flex flex-col justify-center">
        <div className="relative h-96 w-full rounded-xl overflow-hidden">
        <img src="src/assets/undraw_true-friends.svg" alt="Travel adventure" className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-white text-2xl font-bold">Travel Habits</h2>
            <p className="text-white/90">Tell us about your travel routines</p>
          </div>
        </div>
      </div>

      <div>
        <Card className="p-6 shadow-lg border-0 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">How often do you travel?</h3>
              </div>

              <RadioGroup
                value={formData.travelFrequency}
                onValueChange={handleFrequencyChange}
                className="grid grid-cols-1 gap-4"
              >
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="monthly" id="monthly" className="mt-1" />
                  <Label htmlFor="monthly" className="font-normal cursor-pointer">
                    <span className="font-medium">Frequent Traveler</span>
                    <p className="text-sm text-muted-foreground">I travel at least once a month</p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="quarterly" id="quarterly" className="mt-1" />
                  <Label htmlFor="quarterly" className="font-normal cursor-pointer">
                    <span className="font-medium">Regular Traveler</span>
                    <p className="text-sm text-muted-foreground">I travel every few months</p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="yearly" id="yearly" className="mt-1" />
                  <Label htmlFor="yearly" className="font-normal cursor-pointer">
                    <span className="font-medium">Occasional Traveler</span>
                    <p className="text-sm text-muted-foreground">I travel once or twice a year</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">What's your typical trip duration?</h3>
              </div>

              <RadioGroup
                value={formData.tripDuration}
                onValueChange={handleDurationChange}
                className="grid grid-cols-1 gap-4"
              >
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="weekend" id="weekend" className="mt-1" />
                  <Label htmlFor="weekend" className="font-normal cursor-pointer">
                    <span className="font-medium">Weekend Getaways</span>
                    <p className="text-sm text-muted-foreground">2-3 days</p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="week" id="week" className="mt-1" />
                  <Label htmlFor="week" className="font-normal cursor-pointer">
                    <span className="font-medium">Short Vacations</span>
                    <p className="text-sm text-muted-foreground">4-7 days</p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="extended" id="extended" className="mt-1" />
                  <Label htmlFor="extended" className="font-normal cursor-pointer">
                    <span className="font-medium">Extended Trips</span>
                    <p className="text-sm text-muted-foreground">More than a week</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Who do you usually travel with?</h3>
                <p className="text-sm text-muted-foreground">(Select all that apply)</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {companionOptions.map((option) => {
                  const isSelected = formData.travelCompanions.includes(option.id)

                  return (
                    <Button
                      key={option.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto py-3 px-4 justify-center transition-all duration-300 ${
                        isSelected ? "border-primary shadow-md" : ""
                      }`}
                      onClick={() => handleCompanionToggle(option.id)}
                    >
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">(Select all that apply)</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {notificationOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={formData.notificationPreferences.includes(option.id)}
                      onCheckedChange={() => handleNotificationToggle(option.id)}
                    />
                    <Label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1 hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" className="flex-1 relative overflow-hidden group">
                <span className="relative z-10">Complete</span>
                <ArrowRight className="ml-2 h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-primary/80 w-0 group-hover:w-full transition-all duration-300"></div>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

