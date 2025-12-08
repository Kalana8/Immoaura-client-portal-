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
import { ChevronDown, Search, Plus } from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  issued_at: string;
  due_at: string;
  amount_incl_vat: number;
  payment_status: "unpaid" | "partial" | "paid";
  pdf_path: string | null;
  created_at: string;
  order?: {
    order_number: string;
    client?: {
      email: string;
      full_name: string;
      business_name: string;
    };
  };
}

interface InvoicesTableProps {
  onInvoiceSelect: (invoice: Invoice) => void;
  onCreateNew: () => void;
}

const statusColors: Record<string, string> = {
  unpaid: "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800",
  partial: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800",
  paid: "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800",
};

export const InvoicesTable = ({
  onInvoiceSelect,
  onCreateNew,
}: InvoicesTableProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Fetch all invoices
      let query = supabase
        .from("invoices")
        .select(
          `
          id,
          invoice_number,
          order_id,
          issued_at,
          due_at,
          total_amount,
          amount_excl_vat,
          vat_amount,
          amount_incl_vat,
          payment_status,
          pdf_path,
          pdf_uploaded_at,
          created_at
        `
        )
        .order("created_at", { ascending: false })
        .limit(1000); // Limit to prevent loading too much data

      if (statusFilter !== "all") {
        query = query.eq("payment_status", statusFilter);
      }

      const { data: invoicesData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (!invoicesData || invoicesData.length === 0) {
        setInvoices([]);
        return;
      }

      // Step 2: Get all unique order IDs
      const orderIds = [...new Set(invoicesData.map(inv => inv.order_id))];

      // Step 3: Fetch all orders in a single query
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, client_id")
        .in("id", orderIds);

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        // Continue with invoices even if orders fail
      }

      // Step 4: Get unique client IDs from orders
      const clientIds = ordersData 
        ? [...new Set(ordersData.map(order => order.client_id).filter(Boolean))]
        : [];

      // Step 5: Fetch all clients in a single query (only those we need)
      let clientsData: any[] = [];
      if (clientIds.length > 0) {
        const { data: clients, error: clientsError } = await supabase
          .from("users")
          .select("id, email, full_name, business_name")
          .in("id", clientIds);

        if (clientsError) {
          console.error("Error fetching clients:", clientsError);
        } else {
          clientsData = clients || [];
        }
      }

      // Step 6: Create lookup maps for fast access
      const ordersMap = new Map(
        (ordersData || []).map(order => [order.id, order])
      );
      const clientsMap = new Map(
        clientsData.map(client => [client.id, client])
      );

      // Step 7: Combine data efficiently
      const invoicesWithOrders: Invoice[] = invoicesData.map((invoice) => {
        const order = ordersMap.get(invoice.order_id);
        const client = order ? clientsMap.get(order.client_id) : undefined;

        return {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          order_id: invoice.order_id,
          issued_at: invoice.issued_at,
          due_at: invoice.due_at,
          amount_incl_vat: invoice.amount_incl_vat || invoice.total_amount || (invoice.amount_excl_vat || 0) + (invoice.vat_amount || 0),
          payment_status: invoice.payment_status || "unpaid",
          pdf_path: invoice.pdf_path,
          created_at: invoice.created_at,
          order: order ? {
            order_number: order.order_number,
            client: client ? {
              email: client.email,
              full_name: client.full_name,
              business_name: client.business_name,
            } : undefined,
          } : undefined,
        };
      });

      setInvoices(invoicesWithOrders);
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      setError(err.message || "Failed to load invoices");
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  // Filter and search - memoized for performance
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    
    const searchLower = searchTerm.toLowerCase();
    return invoices.filter((invoice) => {
      return (
        invoice.invoice_number.toLowerCase().includes(searchLower) ||
        invoice.order?.order_number?.toLowerCase().includes(searchLower) ||
        invoice.order?.client?.email?.toLowerCase().includes(searchLower) ||
        invoice.order?.client?.full_name?.toLowerCase().includes(searchLower) ||
        invoice.order?.client?.business_name?.toLowerCase().includes(searchLower)
      );
    });
  }, [invoices, searchTerm]);

  // Sort - memoized for performance
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = (a.issued_at || a.issue_date) ? new Date(a.issued_at || a.issue_date).getTime() : 0;
        const dateB = (b.issued_at || b.issue_date) ? new Date(b.issued_at || b.issue_date).getTime() : 0;
        return dateB - dateA;
      } else {
        return (b.amount_incl_vat || 0) - (a.amount_incl_vat || 0);
      }
    });
  }, [filteredInvoices, sortBy]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-full md:w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-full md:w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-full md:w-auto h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
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
              placeholder="Search invoices by number, order, or email..."
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
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partial">Partially Paid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
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

        <Button onClick={onCreateNew} className="gap-2 w-full md:w-auto">
          <Plus className="h-4 w-4" />
          New Invoice
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
              <TableHead>Invoice #</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              sortedInvoices.map((invoice) => {
                const dueDate = invoice.due_at || invoice.due_date;
                const daysUntilDue = dueDate
                  ? Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
                const isOverdue = daysUntilDue < 0;

                return (
                  <TableRow key={invoice.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-blue-600">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.order?.order_number}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {invoice.order?.client?.full_name ||
                            invoice.order?.client?.business_name ||
                            "Unknown"}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {invoice.order?.client?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {(invoice.issued_at || invoice.issue_date) 
                        ? new Date(invoice.issued_at || invoice.issue_date).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className={isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
                        {(invoice.due_at || invoice.due_date)
                          ? new Date(invoice.due_at || invoice.due_date).toLocaleDateString()
                          : "N/A"}
                      </div>
                      {isOverdue && (
                        <div className="text-xs text-red-600">
                          {Math.abs(daysUntilDue)} days overdue
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      €{(invoice.amount_incl_vat || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.payment_status] || ""}>
                        {invoice.payment_status === "partial" 
                          ? "Partially Paid"
                          : invoice.payment_status.charAt(0).toUpperCase() +
                            invoice.payment_status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onInvoiceSelect(invoice)}
                        className="gap-1"
                      >
                        View
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {sortedInvoices.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {sortedInvoices.length} of {invoices.length} invoices
        </div>
      )}
    </div>
  );
};
