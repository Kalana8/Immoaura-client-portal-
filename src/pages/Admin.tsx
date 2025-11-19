import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          navigate("/auth");
          return;
        }

        setUser(session.user);

        // Check if user is admin
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (userError) {
          throw userError;
        }

        if (userData?.role !== "admin") {
          setError("You don't have permission to access the admin panel");
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
          return;
        }

        setIsAdmin(true);
        // Redirect to dashboard if accessing /admin directly
        if (window.location.pathname === "/admin") {
          navigate("/admin/dashboard");
        }
      } catch (err: any) {
        console.error("Admin check error:", err);
        setError(err.message || "Failed to verify admin access");
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          setUser(null);
          setIsAdmin(false);
          navigate("/auth");
        } else {
          checkAdminStatus();
        }
      }
    );

    // Initial check
    checkAdminStatus();

    return () => subscription?.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#243E8F]/20 border-t-[#243E8F]"></div>
          </div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#243E8F]/20 border-t-[#243E8F]"></div>
          </div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // This page renders nothing - it's a router that redirects to /admin/dashboard
  // The actual admin pages are rendered as children via the router
  return null;
};

export default Admin;
