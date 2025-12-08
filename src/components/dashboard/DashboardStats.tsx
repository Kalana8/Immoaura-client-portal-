import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Package, 
  TrendingUp,
  Euro
} from "lucide-react";

interface DashboardStatsProps {
  userId: string;
}

export const DashboardStats = ({ userId }: DashboardStatsProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.dashboard || translations.EN.dashboard;
  const [stats, setStats] = useState({
    total: 0,
    inReview: 0,
    confirmed: 0,
    planned: 0,
    delivered: 0,
    completed: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: orders, error } = await supabase
          .from("orders")
          .select("status, total_incl_vat")
          .eq("client_id", userId);

        if (error) throw error;

        const statsData = {
          total: orders?.length || 0,
          inReview: orders?.filter(o => o.status === "in_review").length || 0,
          confirmed: orders?.filter(o => o.status === "confirmed").length || 0,
          planned: orders?.filter(o => o.status === "planned").length || 0,
          delivered: orders?.filter(o => o.status === "delivered").length || 0,
          completed: orders?.filter(o => o.status === "completed").length || 0,
          totalSpent: orders?.reduce((sum, o) => sum + Number(o.total_incl_vat || 0), 0) || 0,
        };

        setStats(statsData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const statCards = [
    { title: trans.totalOrders, value: stats.total, icon: ShoppingCart, color: "text-[#243E8F]" },
    { title: trans.inReview, value: stats.inReview, icon: Clock, color: "text-yellow-600" },
    { title: trans.confirmed, value: stats.confirmed, icon: CheckCircle2, color: "text-green-600" },
    { title: trans.planned, value: stats.planned, icon: Calendar, color: "text-[#243E8F]" },
    { title: trans.delivered, value: stats.delivered, icon: Package, color: "text-purple-600" },
    { title: trans.completed, value: stats.completed, icon: TrendingUp, color: "text-emerald-600" },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
        
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {trans.totalSpent}
            </CardTitle>
            <Euro className="h-5 w-5 text-[#243E8F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{stats.totalSpent.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
