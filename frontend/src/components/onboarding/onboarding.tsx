import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ProgressTracker } from './progress-tracker.tsx';
import { PersonalInfoStep } from './steps/personal-info-step';
import { TechnicalPreferencesStep } from './steps/technical-preferences-step.tsx';
import { CompletionStep } from './steps/completion-step';
import { UsersApiClient } from '@/lib/api/users.ts';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal info
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    avatar: null as File | null,

    // Travel preferences
    notifications: {
      tripInvitations: true,
      expenseUpdates: true,
      packingListReminders: true,
      votingPolls: true,
    },
    notificationType: 'push',
    profileVisibility: 'public',
    defaultTheme: 'light',
    language: 'english',
    currencyPreference: 'usd',
  });

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleComplete = async () => {
    const usersApiClient = new UsersApiClient(authenticationProviderInstance);
    try {
        await usersApiClient.updateCurrentUser({
            name: formData.firstName,
            surname: formData.lastName,
            username: formData.username,
            avatar: formData.avatar,
            notifications: formData.notifications,
            notificationType: formData.notificationType,
            profileVisibility: formData.profileVisibility,
            defaultTheme: formData.defaultTheme,
            currencyPreference: formData.currencyPreference,
            onboarding_complete: true,
        });
        navigate('/no-trips');
    } catch (error) {
        console.error('Error updating user data:', error);
    }
};


  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-secondary to-primary py-8 px-4">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">
            Begin Your Journey
          </h1>
          <p className="text-muted-foreground mt-2">
            Let's set up your travel profile
          </p>
        </div>

        {currentStep < 3 && <ProgressTracker currentStep={currentStep} />}

        <div className="mt-8">
          {currentStep === 1 && (
            <PersonalInfoStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={nextStep}
            />
          )}

          {currentStep === 2 && (
            <TechnicalPreferencesStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 3 && <CompletionStep onComplete={handleComplete} />}
        </div>
      </div>
    </div>
  );
}
