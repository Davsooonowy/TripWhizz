import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-3xl font-bold mb-2">About TripWhizz</h1>
        <p className="text-muted-foreground mb-6">
          TripWhizz helps you plan trips with friends the smart way. Organize itineraries, manage packing lists,
          split expenses fairly, and keep everyone in sync with friendly notifications.
        </p>
        <Separator className="my-6" />
        <Card className="p-5">
          <h2 className="text-xl font-semibold mb-2">Why TripWhizz?</h2>
          <p className="text-sm text-muted-foreground">
            We built TripWhizz to remove the hassle from group travel planning. From invites and notifications, to
            packing and documents, everything is in one place so you can focus on the fun.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
