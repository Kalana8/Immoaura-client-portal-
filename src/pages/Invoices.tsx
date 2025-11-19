import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { InvoicesList } from "@/components/invoices/InvoicesList";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";
import { LanguageButtonSmall } from "@/components/LanguageButtonSmall";

const Invoices = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const trans = translations[language]?.invoices || translations.EN.invoices;
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

      // Ensure user exists in users table
      try {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (!existingUser) {
          // Create user record if it doesn't exist
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              id: session.user.id,
              email: session.user.email || "",
              full_name: session.user.user_metadata?.full_name || null,
              business_name: session.user.user_metadata?.business_name || null,
            });

          if (insertError) {
            console.error("Error creating user record:", insertError);
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
        <LanguageButtonSmall />
      </div>

      <InvoicesList userId={user.id} />
    </div>
  );
};

export default Invoices;
