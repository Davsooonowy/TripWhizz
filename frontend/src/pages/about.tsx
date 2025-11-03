import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" /> About TripWhizz
          </CardTitle>
          <Button asChild variant="ghost">
            <Link to="/settings">Back to Settings</Link>
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              TripWhizz is a collaborative trip planning app. It helps friends
              and travel groups turn ideas into an organized plan — from early
              brainstorming to a day-by-day itinerary, with documents, packing,
              maps and expenses all in one place.
            </p>
          </div>

          <div className="space-y-3">
            <div className="font-medium">What you can do with TripWhizz</div>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                Build a trip timeline using time periods (stages) like
                “Paris Sightseeing” or “Mountain Hike”.
              </li>
              <li>
                Propose ideas inside each stage (hotels, activities, places) and
                let the group rate them to quickly find the favorite option.
              </li>
              <li>
                Convert the winning ideas into a day plan with start/end times.
              </li>
              <li>
                Drop trip map pins to keep track of must‑see spots and reasons
                to visit them.
              </li>
              <li>
                Store travel documents by category (tickets, reservations,
                IDs) so everything is easy to find.
              </li>
              <li>
                Manage shared and personal packing lists and check items off as
                you go.
              </li>
              <li>
                Track expenses, split costs fairly, and record settlements to
                keep balances clear.
              </li>
              <li>
                Stay in sync with gentle notifications for key updates.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-medium">How it works</div>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>Create a trip and invite your friends.</li>
              <li>Add stages that represent parts of your trip.</li>
              <li>Propose options in each stage and let everyone rate them.</li>
              <li>Pick winners and add them to the Day Plans.</li>
              <li>Attach documents, manage packing, and track expenses.</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Version</div>
              <div className="text-muted-foreground">1.0.0</div>
            </div>
            <div>
              <div className="font-medium">License</div>
              <div className="text-muted-foreground">MIT</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
