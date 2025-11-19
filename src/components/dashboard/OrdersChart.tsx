import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface OrdersChartProps {
  userId: string;
}

export const OrdersChart = ({ userId }: OrdersChartProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.dashboard || translations.EN.dashboard;
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Fetch all orders once instead of 12 separate queries
        const { data: orders, error } = await supabase
          .from("orders")
          .select("created_at")
          .eq("client_id", userId)
          .gte("created_at", subMonths(new Date(), 12).toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Process data in memory - much faster
        const months = [];
        for (let i = 11; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const start = startOfMonth(date);
          const end = endOfMonth(date);
          
          const monthOrders = orders?.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= start && orderDate <= end;
          }) || [];

          months.push({
            month: format(date, "MMM"),
            orders: monthOrders.length,
          });
        }

        setChartData(months);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{trans.ordersOverview}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#243E8F] border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{trans.ordersOverviewSubtitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[560px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-sm"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  className="text-sm"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar 
                  dataKey="orders" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
