import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Mail,
  User,
  LogOut,
  Menu
} from "lucide-react";
import { toast } from "sonner";
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

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const trans = translations[language]?.sidebar || translations.EN.sidebar;
  const [unreadCount, setUnreadCount] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch user email and unread message count
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Set user email
        setUserEmail(user.email || null);

        // Fetch unread message count
        const { data, error } = await supabase
          .from("messages")
          .select("id", { count: "exact" })
          .eq("recipient_id", user.id)
          .eq("is_read", false);

        if (error) {
          console.error("Error fetching unread count:", error);
          return;
        }

        setUnreadCount(data?.length || 0);
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchUserData();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("messages_unread")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchUserData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      toast.error(trans.failedToSignOut, {
        style: {
          background: "#ef4444",
          color: "#ffffff",
          border: "1px solid #dc2626",
        },
        duration: 4000,
      });
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: trans.dashboard, path: "/dashboard" },
    { icon: ShoppingCart, label: trans.orders, path: "/orders" },
    { icon: FileText, label: trans.invoices, path: "/invoices" },
    { icon: Mail, label: trans.messages, path: "/messages" },
    { icon: User, label: trans.profile, path: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavList = (
    <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${active
              ? "bg-[#243E8F] text-white shadow-lg shadow-[#243E8F]/30"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              }`}
          >
            <div className="relative">
              <Icon className={`h-5 w-5 transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`} />
              {/* Unread message badge */}
              {item.label === trans.messages && unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </div>
              )}
            </div>
            <span className="flex-1 text-left">{item.label}</span>
            {active && <div className="h-2 w-2 rounded-full bg-white"></div>}
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
          className="w-full justify-start gap-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          <LogOut className="h-5 w-5" />
          {trans.signOut}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{trans.signOut}</AlertDialogTitle>
          <AlertDialogDescription>
            {trans.confirmSignOut}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{trans.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={handleSignOut}>{trans.signOut}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="flex flex-col md:flex-row h-dvh md:h-screen overflow-hidden bg-background">
      {/* Mobile Header */}
      <header className="md:hidden shrink-0 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/immoaura-logo.png" alt="Immoaura Logo" className="h-auto w-40 rounded-lg object-contain" />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-white dark:bg-slate-900 border-sidebar-border flex flex-col">
              <SheetHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <SheetTitle className="flex items-center gap-3 flex-wrap">
                  <img src="/immoaura-logo.png" alt="Immoaura Logo" className="h-auto w-full object-contain" />
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <nav className="space-y-2 px-4 py-6">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${active
                          ? "bg-[#243E8F] text-white shadow-lg shadow-[#243E8F]/30"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                          }`}
                      >
                        <div className="relative">
                          <Icon className={`h-5 w-5 transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`} />
                          {/* Unread message badge */}
                          {item.label === trans.messages && unreadCount > 0 && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-left">{item.label}</span>
                        {active && <div className="h-2 w-2 rounded-full bg-[#243E8F]"></div>}
                      </button>
                    );
                  })}
                </nav>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 bg-gray-50 dark:bg-slate-900 space-y-3">
                {userEmail && (
                  <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 truncate">
                    <p className="font-medium">{trans.signedInAs}</p>
                    <p className="truncate">{userEmail}</p>
                  </div>
                )}
                {SignOutButton}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Content row: sidebar (desktop) + main */}
      <div className="flex-1 flex md:flex-row min-h-0">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-y-auto shadow-sm">
          <div className="flex h-full flex-col bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
            {/* Logo Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
              <img
                src="/immoaura-logo.png"
                alt="Immoaura Logo"
                className="h-auto w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Navigation */}
            {NavList}

            {/* Language Selector */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
              <LanguageSelector />
            </div>

            {/* User Info & Sign Out */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 bg-gray-50 dark:bg-slate-900 space-y-3">
              {userEmail && (
                <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 truncate">
                  <p className="font-medium">{trans.signedInAs}</p>
                  <p className="truncate">{userEmail}</p>
                </div>
              )}
              {SignOutButton}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
