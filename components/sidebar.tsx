"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  Calendar, 
  ClipboardCheck, 
  Home, 
  LayoutDashboard, 
  Menu, 
  Moon, 
  Settings, 
  Sun, 
  Table2, 
  X,
  Code
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const SidebarLink = ({ href, icon, label, isActive, onClick }: SidebarLinkProps) => {
  return (
    <Link href={href} passHref onClick={onClick}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 mb-1 transition-all duration-300 text-base sidebar-item",
          isActive && "active"
        )}
      >
        {icon}
        <span>{label}</span>
        {isActive && (
          <motion.div
            className="absolute left-0 top-0 h-full w-1 bg-gradient-primary rounded-r-md"
            layoutId="sidebar-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </Button>
    </Link>
  );
};

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const sidebarLinks = [
    { href: "/", icon: <Home size={20} />, label: "Home" },
    { href: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { href: "/bookings", icon: <ClipboardCheck size={20} />, label: "Bookings" },
    { href: "/tables", icon: <Table2 size={20} />, label: "Tables" },
    { href: "/reports", icon: <BarChart3 size={20} />, label: "Reports" },
    { href: "/embed", icon: <Code size={20} />, label: "Embed" },
    { href: "/settings", icon: <Settings size={20} />, label: "Settings" },
  ];

  // Sidebar variants for animation
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  // Hamburger button variants
  const hamburgerVariants = {
    open: { rotate: 90, transition: { duration: 0.2 } },
    closed: { rotate: 0, transition: { duration: 0.2 } }
  };

  return (
    <>
      {/* Mobile menu button */}
      <motion.button
        className="fixed top-4 left-4 z-50 md:hidden hamburger-button"
        onClick={toggleSidebar}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={hamburgerVariants}
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X size={24} className="text-primary" />
        ) : (
          <Menu size={24} className="text-foreground" />
        )}
      </motion.button>

      {/* User menu for mobile - positioned in top right */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <UserMenu />
      </div>

      {/* Sidebar backdrop for mobile */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            className="fixed inset-0 mobile-nav-overlay z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="fixed top-0 left-0 z-40 h-full w-64 sidebar-purple md:translate-x-0"
        initial="closed"
        animate={isOpen || !isMobile ? "open" : "closed"}
        variants={sidebarVariants}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col h-full p-4 bg-gradient-dark">
          <div className="flex items-center justify-between mb-8 mt-2">
            <Link href="/" className="flex items-center gap-3" onClick={closeSidebar}>
              <div className="bg-gradient-purple p-1.5 rounded-md shadow-sm">
                <Image 
                  src="/image.png" 
                  alt="Sully Logo" 
                  width={32} 
                  height={32} 
                  className="rounded-sm"
                />
              </div>
              <span className="font-bold text-xl text-gradient-primary">Sully</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={theme === "dark" ? "dark" : "light"}
                    initial={{ opacity: 0, rotate: -30 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 30 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                  </motion.div>
                </AnimatePresence>
              </Button>
              {/* User menu for desktop */}
              <div className="hidden md:block">
                <UserMenu />
              </div>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {sidebarLinks.map((link) => (
              <SidebarLink
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                isActive={
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href)
                }
                onClick={closeSidebar}
              />
            ))}
          </nav>

          <div className="pt-4 border-t border-border/50">
            <div className="bg-primary/5 rounded-lg p-4 shadow-subtle">
              <h4 className="font-medium mb-2 text-primary">Sully Booking System</h4>
              <p className="text-sm text-muted-foreground">
                A robust solution for restaurant booking management
              </p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content padding for desktop */}
      <div className="md:pl-64 transition-all duration-300">
        {/* This div adds padding to the main content on desktop */}
      </div>
    </>
  );
}