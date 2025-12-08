import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
  userEmail?: string;
}

export const AdminLayout = ({ children, userEmail }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully", {
        style: {
          background: "#3b82f6",
          color: "#ffffff",
          border: "1px solid #2563eb",
        },
        duration: 3000,
      });
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to sign out", {
        style: {
          background: "#ef4444",
          color: "#ffffff",
          border: "1px solid #dc2626",
        },
        duration: 4000,
      });
      console.error(error);
    }
  };

  const adminNavItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin/dashboard",
      badge: null,
    },
    {
      icon: ShoppingCart,
      label: "Orders",
      path: "/admin/orders",
      badge: null,
    },
    {
      icon: FileText,
      label: "Invoices",
      path: "/admin/invoices",
      badge: null,
    },
    {
      icon: Calendar,
      label: "Calendar",
      path: "/admin/calendar",
      badge: null,
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
      badge: null,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavList = (
    <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        return (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              setMobileMenuOpen(false);
            }}
            className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#243E8F] text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              {item.label}
            </div>
            {item.badge && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const SignOutButton = (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign Out</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? You'll need to log in again to access the admin panel.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700"
          >
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <img
            src="/logo.png"
            alt="Immoaura Admin"
            className="h-auto w-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* Navigation */}
        {NavList}

        {/* User Info & Sign Out */}
        <div className="border-t border-gray-200 p-3 flex-shrink-0 space-y-3">
          {userEmail && (
            <div className="px-3 py-2 text-xs text-gray-600 truncate">
              <p className="font-medium">Signed in as</p>
              <p className="truncate">{userEmail}</p>
            </div>
          )}
          {SignOutButton}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar - Mobile */}
        <header className="md:hidden border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Immoaura"
              className="h-auto w-40 object-contain"
            />
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="border-b border-gray-200 px-6 py-5">
                <SheetTitle>
                  <img
                    src="/logo.png"
                    alt="Immoaura"
                    className="h-auto w-full object-contain"
                  />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                {NavList}
                <div className="border-t border-gray-200 p-3 mt-auto space-y-3">
                  {userEmail && (
                    <div className="px-3 py-2 text-xs text-gray-600 truncate">
                      <p className="font-medium">Signed in as</p>
                      <p className="truncate">{userEmail}</p>
                    </div>
                  )}
                  {SignOutButton}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
