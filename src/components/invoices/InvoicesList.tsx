import { useEffect, useState } from "react";
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
import { Download, Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface InvoicesListProps {
  userId: string;
}

export const InvoicesList = ({ userId }: InvoicesListProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.invoices || translations.EN.invoices;
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Optimize: Fetch order IDs first, then invoices in one query
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .eq("client_id", userId)
        .limit(500);

      if (ordersError) throw ordersError;

      const orderIds = ordersData?.map(o => o.id) || [];

      if (orderIds.length === 0) {
        setInvoices([]);
        return;
      }

      // Fetch invoices for these orders
      let query = supabase
        .from("invoices")
        .select(`
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
          created_at,
          orders (
            id,
            order_number
          )
        `)
        .in("order_id", orderIds)
        .order("created_at", { ascending: false })
        .limit(500); // Limit to prevent loading too much data

      if (statusFilter !== "all") {
        query = query.eq("payment_status", statusFilter);
      }

      const { data: invoicesData, error: invoicesError } = await query;

      if (invoicesError) throw invoicesError;
      
      if (!invoicesData || invoicesData.length === 0) {
        setInvoices([]);
        return;
      }
      
      setInvoices(invoicesData);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      setError(error.message || trans.failedToLoadInvoices);
      toast.error(error.message || trans.failedToLoadInvoices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [userId, statusFilter]);

  const getStatusColor = (status: string) => {
    return status === "paid" 
      ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800" 
      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800";
  };

  // Filter and search
  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      invoice.invoice_number?.toLowerCase().includes(searchLower) ||
      invoice.orders?.order_number?.toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  // Sort
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      return (b.total_amount || 0) - (a.total_amount || 0);
    }
  });

  const handleDownloadPDF = async (invoice: any) => {
    try {
      if (!invoice.pdf_path) {
        toast.error(trans.noPDFAvailable);
        return;
      }

      setDownloadingId(invoice.id);

      // Check if pdf_path is a full URL or just a file path
      if (invoice.pdf_path.startsWith("http")) {
        // It's already a public URL, just download it directly
        const link = document.createElement("a");
        link.href = invoice.pdf_path;
        link.download = `${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(trans.pdfDownloadStarted);
      } else {
        // It's a file path, generate signed URL
        const { data, error } = await supabase.storage
          .from("invoices")
          .createSignedUrl(invoice.pdf_path, 3600); // 1 hour expiry

        if (error) throw error;

        if (data.signedUrl) {
          const link = document.createElement("a");
          link.href = data.signedUrl;
          link.download = `${invoice.invoice_number}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(trans.pdfDownloadStarted);
        }
      }
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast.error(error.message || trans.failedToDownloadPDF);
    } finally {
      setDownloadingId(null);
    }
  };

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
              placeholder={trans.searchPlaceholder || "Search invoices by number or order..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder={trans.filterByStatus || "Filter by status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{trans.allStatuses || "All Status"}</SelectItem>
            <SelectItem value="paid">{trans.paid || "Paid"}</SelectItem>
            <SelectItem value="unpaid">{trans.unpaid || "Unpaid"}</SelectItem>
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
          onClick={fetchInvoices}
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
              <TableHead>{trans.invoiceNumber || "Invoice #"}</TableHead>
              <TableHead>{trans.order || "Order #"}</TableHead>
              <TableHead>{trans.status || "Status"}</TableHead>
              <TableHead className="text-right">{trans.amount || "Amount"}</TableHead>
              <TableHead>{trans.issued || "Issued"}</TableHead>
              <TableHead>{trans.due || "Due"}</TableHead>
              <TableHead className="text-right">{trans.action || "Action"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {trans.noInvoicesYet}
                </TableCell>
              </TableRow>
            ) : (
              sortedInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-blue-600">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {invoice.orders?.order_number || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.payment_status)}>
                      {invoice.payment_status?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    €{(invoice.total_amount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(invoice.issued_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(invoice.due_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.pdf_path ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPDF(invoice)}
                        disabled={downloadingId === invoice.id}
                        className="gap-1"
                      >
                        <Download className="h-4 w-4" />
                        {downloadingId === invoice.id ? trans.downloading : trans.downloadPDF}
                      </Button>
                    ) : (
                      <span className="text-sm text-gray-400">{trans.noPDFAvailable}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {sortedInvoices.length > 0 && (
        <div className="text-sm text-gray-600">
          {trans.showing || "Showing"} {sortedInvoices.length} {trans.of || "of"} {invoices.length} {trans.invoices || "invoices"}
        </div>
      )}
    </div>
  );
};
