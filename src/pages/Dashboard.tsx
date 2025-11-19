import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { LanguageButtonSmall } from "@/components/LanguageButtonSmall";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { OrdersChart } from "@/components/dashboard/OrdersChart";

const Dashboard = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Ensure user exists in users table with proper name
      try {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, full_name, business_name")
          .eq("id", session.user.id)
          .single();

        const metadata = session.user.user_metadata || {};
        let fullName = existingUser?.full_name;
        let businessName = existingUser?.business_name;

        // Extract name from metadata if user record doesn't have it
        if (!fullName && !businessName) {
          if (metadata.account_type === "individual") {
            // Combine first_name and last_name for individual accounts
            const firstName = metadata.first_name || "";
            const lastName = metadata.last_name || "";
            fullName = `${firstName} ${lastName}`.trim() || null;
          } else if (metadata.account_type === "business") {
            businessName = metadata.business_name || null;
          }
        }

        if (!existingUser) {
          // Create user record if it doesn't exist
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              id: session.user.id,
              email: session.user.email || "",
              full_name: fullName,
              business_name: businessName,
              phone: metadata.phone || metadata.business_phone || null,
            });

          if (insertError) {
            console.error("Error creating user record:", insertError);
          }
        } else if ((!existingUser.full_name && fullName) || (!existingUser.business_name && businessName)) {
          // Update existing user record if name is missing but available in metadata
          const updateData: any = {};
          if (!existingUser.full_name && fullName) {
            updateData.full_name = fullName;
          }
          if (!existingUser.business_name && businessName) {
            updateData.business_name = businessName;
          }
          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from("users")
              .update(updateData)
              .eq("id", session.user.id);

            if (updateError) {
              console.error("Error updating user record:", updateError);
            }
          }
        }
      } catch (error) {
        console.error("Error checking/creating user:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#243E8F] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#282120]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Translations for dashboard header
  const translations: Record<string, { title: string; subtitle: string }> = {
    EN: {
      title: "Dashboard",
      subtitle: "Welcome back! Here's an overview of your orders and activity.",
    },
    FR: {
      title: "Tableau de bord",
      subtitle: "Bienvenue! Voici un aperçu de vos commandes et activités.",
    },
    DE: {
      title: "Armaturenbrett",
      subtitle: "Willkommen zurück! Hier ist ein Überblick über Ihre Bestellungen und Aktivitäten.",
    },
    NL: {
      title: "Dashboard",
      subtitle: "Welkom terug! Hier is een overzicht van uw bestellingen en activiteiten.",
    },
  };

  const currentTranslation = translations[language] || translations.EN;

  // Auto-scroll to completed orders after loading
  const handleOrdersLoaded = () => {
    setTimeout(() => {
      const completedOrdersElement = document.getElementById("completed-orders-start");
      if (completedOrdersElement) {
        completedOrdersElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest"
        });
      }
    }, 300); // Small delay to ensure content is rendered
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section - Professional Header */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {currentTranslation.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base">
                {currentTranslation.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <LanguageButtonSmall />
            </div>
          </div>
        </div>
      </div>

      {/* Stats, Charts, and Recent Orders - Load in parallel */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stats Section */}
        <div className="lg:col-span-2">
          <DashboardStats userId={user.id} />
        </div>

        {/* Charts Section */}
        <div>
          <OrdersChart userId={user.id} />
        </div>

        {/* Recent Orders Section */}
        <div>
          <RecentOrders userId={user.id} onOrdersLoaded={handleOrdersLoaded} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
