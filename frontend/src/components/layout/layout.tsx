import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/sidebar";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      {isMobile ? <MobileNavigation /> : <AppSidebar />}
      <main className="flex-1">
        {children}
      </main>
    </SidebarProvider>
  );
}