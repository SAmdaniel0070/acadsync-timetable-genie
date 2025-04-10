
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Calendar,
  GraduationCap,
  Home,
  Settings,
  User,
  Users,
  BookOpen,
  Clock,
  Share,
} from "lucide-react";

type NavItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
};

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/",
  },
  {
    title: "Classes",
    icon: GraduationCap,
    href: "/classes",
  },
  {
    title: "Teachers",
    icon: Users,
    href: "/teachers",
  },
  {
    title: "Subjects",
    icon: BookOpen,
    href: "/subjects",
  },
  {
    title: "Timings",
    icon: Clock,
    href: "/timings",
  },
  {
    title: "Timetables",
    icon: Calendar,
    href: "/timetables",
  },
  {
    title: "Share",
    icon: Share,
    href: "/share",
  },
];

const Sidebar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Navigation Bar */}
      <div className="flex items-center justify-between p-4 border-b md:hidden bg-white">
        <div className="flex items-center">
          <span className="font-bold text-xl text-brand-700">ACADSYNC</span>
        </div>
        <button
          className="p-2 rounded-md hover:bg-gray-100"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-white transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <span className="font-bold text-xl text-brand-700">ACADSYNC</span>
            </div>
            <button
              className="p-2 rounded-md hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md group",
                    location.pathname === item.href
                      ? "bg-brand-100 text-brand-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      location.pathname === item.href
                        ? "text-brand-700"
                        : "text-gray-400"
                    )}
                  />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-6">
              <span className="font-bold text-xl text-brand-700">ACADSYNC</span>
            </div>
            <nav className="mt-5 flex-1 px-3 space-y-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-4 py-3 text-sm font-medium rounded-md",
                    location.pathname === item.href
                      ? "bg-brand-100 text-brand-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      location.pathname === item.href
                        ? "text-brand-700"
                        : "text-gray-400"
                    )}
                  />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <Link
              to="/settings"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md w-full"
            >
              <Settings className="mr-3 h-5 w-5 text-gray-400" />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
