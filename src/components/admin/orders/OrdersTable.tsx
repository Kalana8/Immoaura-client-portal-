import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

interface Order {
  id: string;
  order_number: string;
  client_id: string;
  services_selected: string[];
  status: string;
  total_incl_vat: number;
  created_at: string;
  client?: {
    email: string;
    full_name: string;
    business_name: string;
  };
}

interface OrdersTableProps {
  onOrderSelect: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  "in_review": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800",
  "confirmed": "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800",
  "planned": "bg-purple-100 text-purple-800 hover:bg-purple-100 hover:text-purple-800",
  "delivered": "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800",
  "completed": "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800",
  "cancelled": "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800",
};

export const OrdersTable = ({ onOrderSelect }: OrdersTableProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.orderDetail || translations.EN.orderDetail;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      in_review: trans.inReview,
      confirmed: trans.confirmed,
      planned: trans.planned,
      delivered: trans.delivered,
      completed: trans.completed,
      cancelled: trans.cancelled || trans.canceled,
      canceled: trans.canceled,
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          client_id,
          services_selected,
          status,
          total_incl_vat,
          created_at
        `
        )
        .order("created_at", { ascending: false })
        .limit(1000); // Limit to prevent loading too much data

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setOrders([]);
        return;
      }

      // Fetch all client details in a single batch query
      const clientIds = [...new Set(data.map(order => order.client_id).filter(Boolean))];
      
      let clientsMap = new Map();
      if (clientIds.length > 0) {
        const { data: clientsData, error: clientsError } = await supabase
          .from("users")
          .select("id, email, full_name, business_name, phone")
          .in("id", clientIds);

        if (clientsError) {
          console.error("Error fetching clients:", clientsError);
        } else if (clientsData) {
          clientsMap = new Map(clientsData.map(client => [client.id, client]));
        }
      }

      // Combine orders with clients efficiently
      const ordersWithClients: Order[] = data.map((order) => ({
        ...order,
        client: clientsMap.get(order.client_id),
      }));

      setOrders(ordersWithClients);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to load orders");
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Filter and search - memoized for performance
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    
    const searchLower = searchTerm.toLowerCase();
    return orders.filter((order) => {
      return (
        order.order_number.toLowerCase().includes(searchLower) ||
        order.client?.email?.toLowerCase().includes(searchLower) ||
        order.client?.full_name?.toLowerCase().includes(searchLower) ||
        order.client?.business_name?.toLowerCase().includes(searchLower)
      );
    });
  }, [orders, searchTerm]);

  // Sort - memoized for performance
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
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
              placeholder="Search orders by number, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_review">{trans.inReview}</SelectItem>
            <SelectItem value="confirmed">{trans.confirmed}</SelectItem>
            <SelectItem value="planned">{trans.planned}</SelectItem>
            <SelectItem value="delivered">{trans.delivered}</SelectItem>
            <SelectItem value="completed">{trans.completed}</SelectItem>
            <SelectItem value="cancelled">{trans.cancelled || trans.canceled}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "amount")}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date (Newest)</SelectItem>
            <SelectItem value="amount">Amount (Highest)</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchOrders}
          className="w-full md:w-auto"
        >
          Refresh
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
              <TableHead>Order #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No orders found
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
                      <div className="font-medium">
                        {order.client?.full_name || order.client?.business_name || "Unknown"}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {order.client?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.services_selected?.join(", ") || "None"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${
                        statusColors[order.status] || "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800"
                      }`}
                    >
                      {getStatusLabel(order.status)}
                    </Badge>
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
                      onClick={() => onOrderSelect(order)}
                      className="gap-1"
                    >
                      View
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
          Showing {sortedOrders.length} of {orders.length} orders
        </div>
      )}
    </div>
  );
};
