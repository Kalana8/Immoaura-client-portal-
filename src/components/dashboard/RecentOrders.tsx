import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";
import { ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentOrdersProps {
  userId: string;
  onOrdersLoaded?: () => void;
}

export const RecentOrders = ({ userId, onOrdersLoaded }: RecentOrdersProps) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const trans = translations[language]?.dashboard || translations.EN.dashboard;
  const transOrderDetail = translations[language]?.orderDetail || translations.EN.orderDetail;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("client_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        
        // Sort orders: completed orders go to bottom, others stay in date order
        const sortedOrders = (data || []).sort((a, b) => {
          const aIsCompleted = a.status === "completed";
          const bIsCompleted = b.status === "completed";
          
          // If one is completed and the other isn't, completed goes to bottom
          if (aIsCompleted && !bIsCompleted) return 1;
          if (!aIsCompleted && bIsCompleted) return -1;
          
          // If both are completed or both are not completed, keep date order
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setOrders(sortedOrders);
      } catch (error) {
        console.error("Error fetching recent orders:", error);
      } finally {
        setLoading(false);
        // Notify parent that orders are loaded
        if (onOrdersLoaded) {
          setTimeout(() => onOrdersLoaded(), 100);
        }
      }
    };

    fetchRecentOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_review: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      planned: "bg-blue-100 text-blue-800",
      delivered: "bg-purple-100 text-purple-800",
      completed: "bg-emerald-100 text-emerald-800",
      canceled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      in_review: transOrderDetail.inReview,
      confirmed: transOrderDetail.confirmed,
      planned: transOrderDetail.planned,
      delivered: transOrderDetail.delivered,
      completed: transOrderDetail.completed,
      canceled: transOrderDetail.canceled,
      cancelled: transOrderDetail.cancelled || transOrderDetail.canceled,
    };
    return statusMap[status] || status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{trans.recentOrders}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{trans.recentOrders}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>
          {trans.viewAll}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{trans.noOrdersYet}</p>
            <Button 
              variant="link" 
              onClick={() => navigate("/orders/new")}
              className="mt-2"
            >
              {trans.createFirstOrder}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, index) => {
              const isFirstCompleted = order.status === "completed" && 
                (index === 0 || orders[index - 1]?.status !== "completed");
              
              return (
              <div
                key={order.id}
                id={isFirstCompleted ? "completed-orders-start" : undefined}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-medium">{order.order_number}</p>
                    <Badge className={getStatusColor(order.status)}>
                      {formatStatus(order.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.services_selected?.join(", ")} • 
                    {order.created_at && ` ${formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}`}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="font-semibold">
                    €{Number(order.total_incl_vat).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">{trans.inclBTW}</p>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
