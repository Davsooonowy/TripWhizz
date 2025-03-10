import type React from "react";
import { Compass, ArrowLeft, ArrowRight, Sun, Umbrella, MountainSnow, Building, Utensils } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface PreferencesStepProps {
  formData: {
    travelStyle: string;
    budget: number;
    interests: string[];
  };
  updateFormData: (data: Partial<PreferencesStepProps["formData"]>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PreferencesStep({ formData, updateFormData, onNext, onBack }: PreferencesStepProps) {
  const handleTravelStyleChange = (value: string) => {
    updateFormData({ travelStyle: value });
  };

  const handleBudgetChange = (value: number[]) => {
    updateFormData({ budget: value[0] });
  };

  const handleInterestToggle = (interest: string) => {
    const interests = [...formData.interests];
    if (interests.includes(interest)) {
      updateFormData({ interests: interests.filter((i) => i !== interest) });
    } else {
      updateFormData({ interests: [...interests, interest] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const interestOptions = [
    { id: "nature", label: "Nature & Outdoors", icon: MountainSnow },
    { id: "culture", label: "Culture & History", icon: Building },
    { id: "food", label: "Food & Dining", icon: Utensils },
    { id: "beach", label: "Beaches & Relaxation", icon: Umbrella },
    { id: "adventure", label: "Adventure & Sports", icon: Sun },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Card className="p-6 shadow-lg border-0 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/5 rounded-full"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Compass className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">How do you like to travel?</h3>
              </div>

              <RadioGroup
                value={formData.travelStyle}
                onValueChange={handleTravelStyleChange}
                className="grid grid-cols-1 gap-4"
              >
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="planner" id="planner" className="mt-1" />
                  <Label htmlFor="planner" className="font-normal cursor-pointer">
                    <span className="font-medium">Detailed Planner</span>
                    <p className="text-sm text-muted-foreground">I like having every detail planned out in advance</p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="explorer" id="explorer" className="mt-1" />
                  <Label htmlFor="explorer" className="font-normal cursor-pointer">
                    <span className="font-medium">Flexible Explorer</span>
                    <p className="text-sm text-muted-foreground">
                      I like having a rough plan with room for spontaneity
                    </p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="spontaneous" id="spontaneous" className="mt-1" />
                  <Label htmlFor="spontaneous" className="font-normal cursor-pointer">
                    <span className="font-medium">Spontaneous Adventurer</span>
                    <p className="text-sm text-muted-foreground">I prefer to go with the flow and decide as I go</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">What's your typical travel budget?</h3>
              <div className="px-3">
                <Slider
                  value={[formData.budget]}
                  onValueChange={handleBudgetChange}
                  max={100}
                  step={1}
                  className="mb-6"
                />
                <div className="flex justify-between text-sm">
                  <span className={formData.budget <= 33 ? "text-primary font-medium" : "text-muted-foreground"}>
                    Budget-friendly
                  </span>
                  <span
                    className={
                      formData.budget > 33 && formData.budget <= 66
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    Mid-range
                  </span>
                  <span className={formData.budget > 66 ? "text-primary font-medium" : "text-muted-foreground"}>
                    Luxury
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">What interests you most when traveling?</h3>
              <div className="grid grid-cols-2 gap-3">
                {interestOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.interests.includes(option.id);

                  return (
                    <Button
                      key={option.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto py-3 px-4 justify-start gap-3 transition-all duration-300 ${
                        isSelected ? "border-primary shadow-md" : ""
                      }`}
                      onClick={() => handleInterestToggle(option.id)}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                      <span className="whitespace-normal">{option.label}</span>
                    </Button>
                  );
                })}
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
                <span className="relative z-10">Continue</span>
                <ArrowRight className="ml-2 h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-primary/80 w-0 group-hover:w-full transition-all duration-300"></div>
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div className="hidden md:flex flex-col justify-center">
        <div className="relative h-96 w-full rounded-xl overflow-hidden">
          <img src="src/assets/undraw_preferences-popup.svg" alt="Travel adventure" className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-white text-2xl font-bold">Personalize Your Experience</h2>
            <p className="text-white/90">Tell us how you like to travel</p>
          </div>
        </div>
      </div>
    </div>
  );
}