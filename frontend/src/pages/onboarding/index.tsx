import { useState } from "react";
import WelcomeDialog from "@/components/onboarding/welcome-dialog";
import Onboarding from "@/components/onboarding/onboarding";

export default function OnboardingPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(true)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <WelcomeDialog isOpen={isDialogOpen} onClose={setIsDialogOpen} />
      {!isDialogOpen && <Onboarding />}
    </div>
  )
}
