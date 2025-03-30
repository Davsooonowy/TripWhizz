import type React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Map,
  Plus,
  Settings,
  Users,
  FileText,
  DollarSign,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function MobileNavigation() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const notificationCount = 2;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="fixed bottom-3 left-0 right-0 z-40 px-4">
        <div className="absolute left-1/2 -translate-x-1/2 -top-5 z-10">
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <motion.button
                className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg"
                whileTap={{ scale: 0.92 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 8px 20px -5px rgba(124, 58, 237, 0.5)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 15,
                }}
              >
                <Plus className="h-7 w-7 text-white" />
              </motion.button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-auto max-h-[80vh] overflow-auto rounded-t-3xl px-6 py-8 border-t-0"
            >
              <SheetHeader className="text-left pb-6">
                <SheetTitle className="text-2xl font-bold">
                  Create New
                </SheetTitle>
                <SheetDescription className="text-base">
                  What would you like to create?
                </SheetDescription>
              </SheetHeader>

              <SheetClose asChild>
                <Link
                  to="/trip"
                  className="flex items-center justify-between p-5 mb-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 hover:bg-primary/15 transition-all duration-300 shadow-md"
                >
                  <div className="flex items-center">
                    <div className="bg-primary/20 p-3 rounded-xl mr-4">
                      <Map className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">New Trip</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Plan your next adventure
                      </p>
                    </div>
                  </div>
                  <div className="text-primary">→</div>
                </Link>
              </SheetClose>

              <div className="grid grid-cols-2 gap-4">
                <SheetClose asChild>
                  <Link
                    to="/documents/new"
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border hover:bg-accent transition-all duration-300 shadow-sm"
                  >
                    <div className="bg-primary/10 p-3 rounded-xl mb-3">
                      <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <span className="text-sm font-medium">New Document</span>
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    to="/expenses/new"
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border hover:bg-accent transition-all duration-300 shadow-sm"
                  >
                    <div className="bg-primary/10 p-3 rounded-xl mb-3">
                      <DollarSign className="h-7 w-7 text-primary" />
                    </div>
                    <span className="text-sm font-medium">New Expense</span>
                  </Link>
                </SheetClose>
              </div>
              <div className="h-10"></div>
            </SheetContent>
          </Sheet>
        </div>

        <motion.div
          className={cn(
            'bg-white/95 dark:bg-slate-900/95 border border-gray-200/50 dark:border-gray-800/50 shadow-lg rounded-full overflow-hidden',
            scrolled ? 'shadow-xl' : 'shadow-md',
          )}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-around h-12 px-2 relative">
            <NavItem path="/" icon={Home} label="Home" />
            <NavItem path="/friends" icon={Users} label="Friends" />

            <div className="w-14"></div>

            <NavItem
              path="/notifications"
              icon={Bell}
              label="Notifications"
              notificationCount={notificationCount}
            />
            <NavItem path="/settings" icon={Settings} label="Settings" />
          </div>
        </motion.div>
      </div>
      <div className="h-16" />
    </>
  );
}

function NavItem({
  path,
  icon: Icon,
  label,
  notificationCount = 0,
}: {
  path: string;
  icon: React.ElementType;
  label: string;
  notificationCount?: number;
}) {
  const location = useLocation();
  const active =
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  return (
    <Link
      to={path}
      className="flex flex-col items-center justify-center w-14 py-1"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-center w-8 h-8 relative">
          <Icon
            className={cn(
              'h-4 w-4',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[8px] font-bold text-white bg-red-500 rounded-full z-50 shadow-sm">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </div>
        <span
          className={cn(
            'text-[10px] -mt-1',
            active ? 'font-medium text-primary' : 'text-muted-foreground',
          )}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}
