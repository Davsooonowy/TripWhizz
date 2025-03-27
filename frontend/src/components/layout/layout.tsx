import type React from 'react';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MobileNavigation } from '@/components/navigation/mobile-navigation';
import { ChevronRight, HomeIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [pageTitle, setPageTitle] = useState('Home');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setPageTitle('Home');
    } else {
      const segments = path.split('/').filter(Boolean);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        setPageTitle(
          lastSegment.charAt(0).toUpperCase() +
            lastSegment.slice(1).replace(/-/g, ' '),
        );
      }
    }
  }, [location]);

  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      {isMobile && <MobileNavigation />}
      <main className={`flex-1 overflow-auto ${isMobile ? 'pb-24' : ''}`}>
        {isMobile && (
          <motion.header
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={`
              backdrop-blur-xl transition-all duration-300 border-b
              ${scrolled ? 'bg-background/85 border-border/30 shadow-sm' : 'bg-background/70 border-transparent'}
            `}
            >
              <div className="flex items-center h-16 px-4">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="text-foreground/80 hover:text-foreground transition-colors" />

                  <Breadcrumb>
                    <BreadcrumbList className="flex items-center">
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/" className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                            <HomeIcon className="w-4 h-4 text-primary" />
                          </div>
                        </BreadcrumbLink>
                      </BreadcrumbItem>

                      <BreadcrumbSeparator>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
                      </BreadcrumbSeparator>

                      <BreadcrumbItem>
                        <BreadcrumbPage>
                          <motion.span
                            key={pageTitle}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="font-medium text-foreground"
                          >
                            {pageTitle}
                          </motion.span>
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </div>
            </div>
          </motion.header>
        )}
        <div className={isMobile ? 'pt-16' : ''}>{children}</div>
      </main>
    </SidebarProvider>
  );
}
