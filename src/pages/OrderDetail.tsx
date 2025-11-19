import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import { format } from "date-fns";
import { ArrowLeft, Download, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const trans = translations[language]?.orderDetail || translations.EN.orderDetail;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      return session.user;
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!id || !user) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let isPolling = false;

    const fetchOrderData = async () => {
      try {
        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .eq("client_id", user.id)
          .single();

        if (orderError) throw orderError;
        
        // Only update if data actually changed to avoid unnecessary re-renders
        setOrder((prevOrder) => {
          if (!prevOrder || prevOrder.payment_status !== orderData.payment_status || prevOrder.status !== orderData.status) {
            return orderData;
          }
          return prevOrder;
        });

        // Fetch status history
        const { data: historyData, error: historyError } = await supabase
          .from("order_status_history")
          .select("*")
          .eq("order_id", id)
          .order("created_at", { ascending: true });

        if (historyError) {
          console.error("Error fetching status history:", historyError);
          setStatusHistory([]);
        } else {
          setStatusHistory(historyData || []);
        }

        // Fetch files (only admin-uploaded files for clients)
        const { data: filesData, error: filesError } = await supabase
          .from("file_uploads")
          .select("*")
          .eq("order_id", id)
          .eq("upload_type", "admin-upload")
          .order("created_at", { ascending: false });

        if (filesError) {
          console.error("Error fetching files:", filesError);
          setFiles([]);
        } else {
          setFiles(filesData || []);
        }

        // Fetch invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from("invoices")
          .select("*")
          .eq("order_id", id)
          .order("created_at", { ascending: false });

        if (invoicesError) {
          console.error("Error fetching invoices:", invoicesError);
          // Don't fail the whole operation if invoices fail
          setInvoices([]);
        } else {
          setInvoices(invoicesData || []);
        }
      } catch (error: any) {
        console.error("Error fetching order:", error);
        toast.error(trans.failedToLoadOrderDetails);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();

    // Set up polling as a fallback (check every 5 seconds)
    const startPolling = () => {
      if (pollInterval) return; // Already polling
      isPolling = true;
      pollInterval = setInterval(async () => {
        if (!isPolling) return;
        try {
          const { data: orderData, error } = await supabase
            .from("orders")
            .select("*")
            .eq("id", id)
            .eq("client_id", user.id)
            .single();
          
          if (!error && orderData) {
            setOrder((prevOrder) => {
              if (!prevOrder || 
                  prevOrder.payment_status !== orderData.payment_status || 
                  prevOrder.status !== orderData.status ||
                  prevOrder.updated_at !== orderData.updated_at) {
                console.log("Order updated via polling:", orderData.payment_status);
                return orderData;
              }
              return prevOrder;
            });
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 5000); // Poll every 5 seconds
    };

    // Set up real-time subscription for order updates (including payment_status)
    let orderSubscription: ReturnType<typeof supabase.channel> | null = null;
    
    try {
      orderSubscription = supabase
        .channel(`order-detail-${id}-${Date.now()}`) // Add timestamp to avoid conflicts
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${id}`,
          },
          async (payload) => {
            // Update order data when order is updated (including payment_status)
            if (payload.new) {
              console.log("Order updated via real-time:", payload.new);
              // Temporarily stop polling when real-time update is received
              isPolling = false;
              
              // Refetch the full order to ensure we have all fields
              const { data: updatedOrder, error: refetchError } = await supabase
                .from("orders")
                .select("*")
                .eq("id", id)
                .eq("client_id", user.id)
                .single();
              
              if (!refetchError && updatedOrder) {
                console.log("Order payment_status updated via real-time:", updatedOrder.payment_status);
                setOrder(updatedOrder);
                // Resume polling after a delay
                setTimeout(() => { isPolling = true; }, 10000);
              } else if (payload.new) {
                // Fallback: use payload data if refetch fails
                setOrder((prevOrder) => {
                  if (!prevOrder) return prevOrder;
                  const updated = {
                    ...prevOrder,
                    ...payload.new,
                  };
                  console.log("Order updated via payload:", updated.payment_status);
                  return updated;
                });
                setTimeout(() => { isPolling = true; }, 10000);
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "invoices",
            filter: `order_id=eq.${id}`,
          },
          async () => {
            console.log("Invoice changed for order:", id);
            // Refetch invoices when invoice changes
            const { data: invoicesData, error: invoicesError } = await supabase
              .from("invoices")
              .select("*")
              .eq("order_id", id)
              .order("created_at", { ascending: false });
            
            if (invoicesError) {
              console.error("Error refetching invoices:", invoicesError);
            } else if (invoicesData) {
              setInvoices(invoicesData);
            }
            
            // Always refetch order to update payment_status when invoices change
            const { data: orderData, error: orderError } = await supabase
              .from("orders")
              .select("*")
              .eq("id", id)
              .eq("client_id", user.id)
              .single();
            
            if (orderError) {
              console.error("Error refetching order after invoice change:", orderError);
            } else if (orderData) {
              console.log("Order payment_status updated:", orderData.payment_status);
              setOrder(orderData);
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("Real-time subscription active for order:", id);
            // Start polling as backup if real-time is working
            startPolling();
          } else if (status === "CHANNEL_ERROR") {
            console.error("Real-time subscription error for order:", id);
            // Start polling if real-time fails
            startPolling();
          } else if (status === "TIMED_OUT") {
            console.warn("Real-time subscription timed out for order:", id);
            // Start polling if real-time times out
            startPolling();
          } else if (status === "CLOSED") {
            console.log("Real-time subscription closed for order:", id);
            // Start polling if real-time closes
            startPolling();
          }
        });
    } catch (subscriptionError) {
      console.error("Error setting up real-time subscription:", subscriptionError);
      // Start polling as fallback if subscription setup fails
      startPolling();
    }

    // Start polling immediately as backup
    startPolling();

    return () => {
      isPolling = false;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      if (orderSubscription) {
        try {
          orderSubscription.unsubscribe();
        } catch (unsubError) {
          console.error("Error unsubscribing:", unsubError);
        }
      }
    };
  }, [id, user?.id]);

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('admin-order-files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast.error(trans.failedToDownloadFile);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_review: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      planned: "bg-purple-100 text-purple-800",
      delivered: "bg-orange-100 text-orange-800",
      completed: "bg-gray-100 text-gray-800",
      canceled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      in_review: trans.inReview,
      confirmed: trans.confirmed,
      planned: trans.planned,
      delivered: trans.delivered,
      completed: trans.completed,
      canceled: trans.canceled
    };
    return statusMap[status] || status;
  };

  const handleRefresh = async () => {
    if (!id || !user || refreshing) return;
    
    setRefreshing(true);
    try {
      // Refetch order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("client_id", user.id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Refetch invoices
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: false });
      
      if (invoicesData) setInvoices(invoicesData);
      
      toast.success("Order refreshed");
    } catch (error: any) {
      console.error("Error refreshing order:", error);
      toast.error("Failed to refresh order");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || !user || !order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#243E8F] border-t-transparent"></div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{trans.title} {order.order_number}</h1>
            <p className="text-muted-foreground mt-1">
              {trans.created} {format(new Date(order.created_at), "PPP 'at' p")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(order.status)}>
              {formatStatus(order.status)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{trans.orderSummary}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">{trans.services}</Label>
                <p className="font-medium">{order.services_selected?.join(", ")}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">{trans.paymentStatus}</Label>
                <Badge className={
                  order.payment_status === "paid" 
                    ? "bg-green-100 text-green-800" 
                    : order.payment_status === "partial"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }>
                  {(order.payment_status || "unpaid").toUpperCase()}
                </Badge>
              </div>
              {order.agenda_slot && (
                <div>
                  <Label className="text-sm text-muted-foreground">{trans.scheduledDate}</Label>
                  <p className="font-medium">
                    {format(new Date(order.agenda_slot), "PPP 'at' p")}
                  </p>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{trans.subtotal}</span>
                  <span className="font-medium">€{Number(order.total_excl_vat).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{trans.vatRate}</span>
                  <span className="font-medium">
                    €{(Number(order.total_incl_vat) - Number(order.total_excl_vat)).toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{trans.total}</span>
                  <span>€{Number(order.total_incl_vat).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{trans.orderTimeline}</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusTimeline orderId={order.id} currentStatus={order.status} />
            </CardContent>
          </Card>
        </div>

        {/* Files - Admin Uploaded Files Only */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{trans.files}</CardTitle>
              <CardDescription>Files uploaded by admin for your order</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {files.filter(f => f.upload_type === 'admin-upload').length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{trans.noFilesUploaded}</p>
            ) : (
              <div className="space-y-2">
                {files
                  .filter(f => f.upload_type === 'admin-upload')
                  .map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file.file_path, file.file_name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        {invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{trans.invoices}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Issued: {invoice.issue_date 
                          ? format(new Date(invoice.issue_date), "PPP")
                          : invoice.issued_at 
                          ? format(new Date(invoice.issued_at), "PPP")
                          : "N/A"} • 
                        Amount: €{Number(invoice.amount_incl_vat || invoice.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <Badge className={invoice.payment_status === "paid" ? "bg-green-100 text-green-800" : invoice.payment_status === "partial" ? "bg-yellow-100 text-yellow-800" : ""}>
                      {invoice.payment_status?.toUpperCase() || invoice.status?.toUpperCase() || "UNPAID"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
};

export default OrderDetail;

