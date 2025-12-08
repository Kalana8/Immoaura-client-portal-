import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type PaymentStatus = "unpaid" | "partial" | "paid";

interface PaymentStatusDropdownProps {
  invoiceId: string;
  orderId: string;
  currentStatus: PaymentStatus;
  onStatusChange: (newStatus: PaymentStatus) => void;
}

const STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: "bg-red-100 text-red-800",
  partial: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
};

export const PaymentStatusDropdown = ({
  invoiceId,
  orderId,
  currentStatus,
  onStatusChange,
}: PaymentStatusDropdownProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsLoading(true);

      // Update invoice payment status
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({ payment_status: newStatus })
        .eq("id", invoiceId);

      if (invoiceError) throw invoiceError;

      // Update order payment status based on all invoices for this order
      const { data: allInvoices } = await supabase
        .from("invoices")
        .select("payment_status")
        .eq("order_id", orderId);

      if (allInvoices && allInvoices.length > 0) {
        // Determine overall order payment status
        let orderPaymentStatus: PaymentStatus = "unpaid";
        const paidCount = allInvoices.filter(inv => inv.payment_status === "paid").length;
        const partialCount = allInvoices.filter(inv => inv.payment_status === "partial").length;
        const unpaidCount = allInvoices.filter(inv => inv.payment_status === "unpaid").length;

        if (paidCount === allInvoices.length) {
          // All invoices are paid
          orderPaymentStatus = "paid";
        } else if (paidCount > 0 || partialCount > 0) {
          // Some invoices are paid or partially paid
          orderPaymentStatus = "partial";
        } else {
          // All invoices are unpaid
          orderPaymentStatus = "unpaid";
        }

        // Update order payment status
        const { data: updatedOrder, error: orderPaymentError } = await supabase
          .from("orders")
          .update({ payment_status: orderPaymentStatus })
          .eq("id", orderId)
          .select()
          .single();

        if (orderPaymentError) {
          console.error("Error updating order payment status:", orderPaymentError);
          toast.error(`Invoice updated but failed to update order payment status: ${orderPaymentError.message}`);
          // Don't fail the whole operation if order update fails
        } else {
          console.log("Order payment_status updated successfully:", updatedOrder?.payment_status);
        }
      }

      // If invoice is paid AND order is delivered, auto-complete the order
      if (newStatus === "paid") {
        const { data: orderData } = await supabase
          .from("orders")
          .select("status")
          .eq("id", orderId)
          .single();

        if (orderData?.status === "delivered") {
          const { error: orderError } = await supabase
            .from("orders")
            .update({ status: "completed" })
            .eq("id", orderId);

          if (orderError) throw orderError;

          toast.success("Order auto-completed (Invoice Paid + Order Delivered)");
        }
      }

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "payment_status_change",
          target_table: "invoices",
          target_id: invoiceId,
          old_values: { payment_status: currentStatus },
          new_values: { payment_status: newStatus },
        });
      }

      toast.success(`Payment status updated to ${STATUS_LABELS[newStatus as PaymentStatus]}`);
      onStatusChange(newStatus as PaymentStatus);
    } catch (err: any) {
      console.error("Status change error:", err);
      toast.error(err.message || "Failed to update payment status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Select onValueChange={handleStatusChange} disabled={isLoading} defaultValue={currentStatus}>
      <SelectTrigger className={`w-40 ${STATUS_COLORS[currentStatus] || ""}`}>
        <SelectValue placeholder={STATUS_LABELS[currentStatus]} />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(STATUS_LABELS) as PaymentStatus[]).map((status) => (
          <SelectItem key={status} value={status}>
            {STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
