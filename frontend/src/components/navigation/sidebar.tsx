import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar.tsx";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDarkMode } from "@/components/util/dark-mode-provider.tsx";

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const links = [
    {
      label: "Dashboard",
      href: "main",
      icon: (
        <IconBrandTabler className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <IconUserBolt className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <IconSettings className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-sidebar-background text-sidebar-foreground w-full h-screen border border-sidebar-border overflow-hidden"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 py-2 text-sidebar-foreground"
            >
              {isDarkMode ? (
                <IconSun className="h-5 w-5 flex-shrink-0" />
              ) : (
                <IconMoon className="h-5 w-5 flex-shrink-0" />
              )}
              {open && (
                <span className="text-sm w-24 truncate">
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </span>
              )}
            </button>
            <SidebarLink
              link={{
                label: "Manu Arora",
                href: "#",
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 flex-shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard />
    </div>
  );
}

export const Logo = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <a
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-sidebar-foreground py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-sidebar-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "font-medium whitespace-pre",
          isDarkMode ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
        )}
      >
        Acet Labs
      </motion.span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-sidebar-foreground py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-sidebar-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </a>
  );
};

const Dashboard = () => {
  return (
    <div className="flex flex-1">
      <div className="p-2 md:p-10 rounded-tl-2xl border border-sidebar-border bg-card text-card-foreground flex flex-col gap-2 flex-1 w-full h-full">
      </div>
    </div>
  );
};