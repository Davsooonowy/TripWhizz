import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import type React from 'react';
import { useState } from 'react';

import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Globe,
  Lock,
  Map,
  MessageSquare,
  Share2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TripType() {
  const [selectedOption, setSelectedOption] = useState<
    'private' | 'public' | null
  >(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Your New Trip</h1>
          <p className="text-muted-foreground">
            Choose whether you want to plan a trip with friends or create a trip
            for others to join
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Card
            className={`h-full cursor-pointer transition-all duration-300 hover:shadow-md ${
              selectedOption === 'private'
                ? 'border-primary ring-2 ring-primary/20'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedOption('private')}
          >
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full mr-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Private Trip</h3>
                  <p className="text-sm text-muted-foreground">
                    Plan a trip with your friends
                  </p>
                </div>
                {selectedOption === 'private' && (
                  <CheckCircle2 className="ml-auto text-primary h-6 w-6" />
                )}
              </div>

              <div className="space-y-4 flex-grow">
                <FeatureItem
                  icon={<UserPlus className="h-4 w-4 text-green-500" />}
                  text="Invite friends to plan the trip together"
                />
                <FeatureItem
                  icon={<Calendar className="h-4 w-4 text-green-500" />}
                  text="Collaborate on dates and itinerary"
                />
                <FeatureItem
                  icon={<MessageSquare className="h-4 w-4 text-green-500" />}
                  text="Group chat and decision making"
                />
                <FeatureItem
                  icon={<Map className="h-4 w-4 text-green-500" />}
                  text="Build your adventure together from scratch"
                />
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-sm">
                    Perfect for planning upcoming trips with friends
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`h-full cursor-pointer transition-all duration-300 hover:shadow-md ${
              selectedOption === 'public'
                ? 'border-primary ring-2 ring-primary/20'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedOption('public')}
          >
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center mb-4">
                <div className="bg-secondary/20 p-3 rounded-full mr-3">
                  <Globe className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Public Trip</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a trip for others to join
                  </p>
                </div>
                {selectedOption === 'public' && (
                  <CheckCircle2 className="ml-auto text-primary h-6 w-6" />
                )}
              </div>

              <div className="space-y-4 flex-grow">
                <FeatureItem
                  icon={<Compass className="h-4 w-4 text-blue-500" />}
                  text="Plan the entire trip from A to Z yourself"
                />
                <FeatureItem
                  icon={<Share2 className="h-4 w-4 text-blue-500" />}
                  text="Post your completed trip plan publicly"
                />
                <FeatureItem
                  icon={<UserCheck className="h-4 w-4 text-blue-500" />}
                  text="Allow others to join your planned adventure"
                />
                <FeatureItem
                  icon={<Lock className="h-4 w-4 text-blue-500" />}
                  text="Control who can join with approval settings"
                />
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-sm">
                    Great for trip organizers and social travelers
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between">
          <Link to="/trip">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>

          <Link to={selectedOption ? `/trip/new/${selectedOption}` : '#'}>
            <Button disabled={!selectedOption}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start">
      <div className="mt-0.5 mr-3">{icon}</div>
      <span className="text-sm">{text}</span>
    </div>
  );
}
