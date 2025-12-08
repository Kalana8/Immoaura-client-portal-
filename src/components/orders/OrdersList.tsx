import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";
import { Search, ChevronDown } from "lucide-react";

interface OrdersListProps {
  userId: string;
}

export const OrdersList = ({ userId }: OrdersListProps) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const trans = translations[language]?.orders || translations.EN.orders;
  const transOrderDetail = translations[language]?.orderDetail || translations.EN.orderDetail;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("orders")
        .select(`
          id,
          order_number,
          services_selected,
          status,
          payment_status,
          total_incl_vat,
          created_at
        `)
        .eq("client_id", userId)
        .order("created_at", { ascending: false })
        .limit(500); // Limit to prevent loading too much data

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || trans.failedToLoadOrders || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId, statusFilter]);

  const statusColors: Record<string, string> = {
    in_review: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800",
    planned: "bg-purple-100 text-purple-800 hover:bg-purple-100 hover:text-purple-800",
    delivered: "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800",
    completed: "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800",
    canceled: "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800",
    cancelled: "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800",
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      in_review: transOrderDetail.inReview,
      confirmed: transOrderDetail.confirmed,
      planned: transOrderDetail.planned,
      delivered: transOrderDetail.delivered,
      completed: transOrderDetail.completed,
      cancelled: transOrderDetail.cancelled || transOrderDetail.canceled,
      canceled: transOrderDetail.canceled,
    };
    return statusMap[status] || status;
  };

  // Filter and search - memoized for performance
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    
    const searchLower = searchTerm.toLowerCase();
    return orders.filter((order) => {
      return (
        order.order_number.toLowerCase().includes(searchLower) ||
        order.services_selected?.some((service: string) =>
          service.toLowerCase().includes(searchLower)
        )
      );
    });
  }, [orders, searchTerm]);

  // Sort - completed orders go to bottom - memoized for performance
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      // Check if either order is completed
      const aIsCompleted = a.status === "completed";
      const bIsCompleted = b.status === "completed";

      // If one is completed and the other isn't, completed goes to bottom
      if (aIsCompleted && !bIsCompleted) return 1;
      if (!aIsCompleted && bIsCompleted) return -1;

      // If both are completed or both are not completed, sort normally
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return (b.total_incl_vat || 0) - (a.total_incl_vat || 0);
      }
    });
  }, [filteredOrders, sortBy]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#243E8F]/20 border-t-[#243E8F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={trans.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder={trans.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{trans.allStatuses}</SelectItem>
            <SelectItem value="in_review">{transOrderDetail.inReview}</SelectItem>
            <SelectItem value="confirmed">{transOrderDetail.confirmed}</SelectItem>
            <SelectItem value="planned">{transOrderDetail.planned}</SelectItem>
            <SelectItem value="delivered">{transOrderDetail.delivered}</SelectItem>
            <SelectItem value="completed">{transOrderDetail.completed}</SelectItem>
            <SelectItem value="canceled">{transOrderDetail.canceled}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "amount")}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder={trans.sortBy || "Sort by"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{trans.sortByDate || "Date (Newest)"}</SelectItem>
            <SelectItem value="amount">{trans.sortByAmount || "Amount (Highest)"}</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchOrders}
          className="w-full md:w-auto"
        >
          {trans.refresh || "Refresh"}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead>{trans.orderNumber || "Order #"}</TableHead>
              <TableHead>{trans.services || "Services"}</TableHead>
              <TableHead>{trans.status || "Status"}</TableHead>
              <TableHead className="text-right">{trans.amount || "Amount"}</TableHead>
              <TableHead>{trans.created || "Created"}</TableHead>
              <TableHead className="text-right">{trans.action || "Action"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {trans.noOrdersFound}
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-blue-600">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.services_selected?.join(", ") || "None"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${
                          statusColors[order.status] || "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800"
                        }`}
                      >
                        {getStatusLabel(order.status)}
                      </Badge>
                      {order.payment_status === "paid" && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800">{trans.paid}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    €{(order.total_incl_vat || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="gap-1"
                    >
                      {trans.view || "View"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {sortedOrders.length > 0 && (
        <div className="text-sm text-gray-600">
          {trans.showing || "Showing"} {sortedOrders.length} {trans.of || "of"} {orders.length} {trans.orders || "orders"}
        </div>
      )}
    </div>
  );
};
