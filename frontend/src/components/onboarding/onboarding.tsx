import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { ProgressTracker } from "./progress-tracker.tsx"
import { PersonalInfoStep } from "./steps/personal-info-step"
import { PreferencesStep } from "./steps/preferences-step"
import { TravelBuddiesStep } from "./steps/travel-buddies-step"
import { CompletionStep } from "./steps/completion-step"

export default function Onboarding() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Personal info
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    avatar: null as File | null,

    // Travel preferences
    travelStyle: "explorer",
    budget: 50,
    interests: ["nature", "food"],

    // Travel buddies
    travelFrequency: "monthly",
    tripDuration: "weekend",
    travelCompanions: ["friends", "family"],
    notificationPreferences: ["trip_updates", "friend_joins"],
  })

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo(0, 0)
    } else {
      setCurrentStep(4)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleComplete = () => {
    console.log("Onboarding complete with data:", formData)
    //TODO: Send data to backend
    navigate("/no-trips")
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-secondary to-primary py-8 px-4">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Begin Your Journey</h1>
          <p className="text-muted-foreground mt-2">Let's set up your travel profile</p>
        </div>

        {currentStep < 4 && <ProgressTracker currentStep={currentStep} />}

        <div className="mt-8">
          {currentStep === 1 && (
            <PersonalInfoStep formData={formData} updateFormData={updateFormData} onNext={nextStep} />
          )}

          {currentStep === 2 && (
            <PreferencesStep formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} />
          )}

          {currentStep === 3 && (
            <TravelBuddiesStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 4 && <CompletionStep onComplete={handleComplete} />}
        </div>
      </div>
    </div>
  )
}