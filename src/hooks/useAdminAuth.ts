import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AdminUser extends User {
  role?: string;
}

interface UseAdminAuthReturn {
  user: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAdminAuth = (): UseAdminAuthReturn => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          setUser(null);
          setIsAdmin(false);
          navigate("/auth");
          return;
        }

        // Check user role in database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", session.user.id)
          .single();

        if (userError) {
          throw userError;
        }

        if (!userData || userData.role !== "admin") {
          setUser(session.user);
          setIsAdmin(false);
          navigate("/dashboard");
          return;
        }

        // User is admin
        setUser({
          ...session.user,
          role: userData.role,
        });
        setIsAdmin(true);
      } catch (err: any) {
        console.error("Admin auth check error:", err);
        setError(err.message || "Failed to verify admin status");
        setIsAdmin(false);
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    // Set up listener for auth changes
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

  return { user, isAdmin, isLoading, error };
};

/**
 * Hook to check if current user is admin (simpler version)
 */
export const useIsAdmin = (): boolean => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setIsAdmin(false);
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      setIsAdmin(userData?.role === "admin");
    };

    checkAdmin();
  }, []);

  return isAdmin;
};
