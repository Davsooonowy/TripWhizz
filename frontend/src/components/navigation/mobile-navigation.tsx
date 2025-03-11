import { Home, Settings, Shield } from 'lucide-react';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';

export function MobileNavigation() {
  const tabs = [
    { title: 'Dashboard', icon: Home },
    { title: 'Settings', icon: Settings },
    { type: 'separator' as const },
    { title: 'Security', icon: Shield },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center gap-4 bg-background p-4 shadow-lg">
      <ExpandableTabs tabs={tabs} />
    </div>
  );
}
