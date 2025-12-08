import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { OrdersList } from "@/components/orders/OrdersList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";
import { LanguageButtonSmall } from "@/components/LanguageButtonSmall";

const Orders = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const trans = translations[language]?.orders || translations.EN.orders;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

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

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#243E8F] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{trans.title}</h1>
          <p className="text-muted-foreground mt-2">
            {trans.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <LanguageButtonSmall />
          <Button onClick={() => navigate("/orders/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            {trans.newOrder}
          </Button>
        </div>
      </div>

      <OrdersList userId={user.id} />
    </div>
  );
};

export default Orders;
