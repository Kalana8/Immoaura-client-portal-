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
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

type OrderStatus = "in_review" | "confirmed" | "planned" | "delivered" | "completed" | "cancelled";

interface StatusChangeDropdownProps {
  orderId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

const STATUS_WORKFLOW: Record<OrderStatus, OrderStatus[]> = {
  "in_review": ["confirmed", "cancelled"],
  "confirmed": ["planned", "in_review", "cancelled"],
  "planned": ["delivered", "confirmed", "cancelled"],
  "delivered": ["completed", "cancelled"],
  "completed": [],
  "cancelled": [],
};

// All available statuses - admins can select any status
const ALL_STATUSES: OrderStatus[] = ["in_review", "confirmed", "planned", "delivered", "completed", "cancelled"];

const STATUS_COLORS: Record<OrderStatus, string> = {
  "in_review": "bg-yellow-100 text-yellow-800",
  "confirmed": "bg-blue-100 text-blue-800",
  "planned": "bg-purple-100 text-purple-800",
  "delivered": "bg-green-100 text-green-800",
  "completed": "bg-gray-100 text-gray-800",
  "cancelled": "bg-red-100 text-red-800",
};

export const StatusChangeDropdown = ({
  orderId,
  currentStatus,
  onStatusChange,
}: StatusChangeDropdownProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.orderDetail || translations.EN.orderDetail;
  const [isLoading, setIsLoading] = useState(false);
  const currentStatusKey = currentStatus.toLowerCase().replace(/ /g, "_") as OrderStatus;
  const recommendedStatuses = STATUS_WORKFLOW[currentStatusKey] || [];
  
  // Get all statuses except the current one and recommended ones (to avoid duplication)
  const otherStatuses = ALL_STATUSES.filter(
    status => status !== currentStatusKey && !recommendedStatuses.includes(status)
  );

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

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsLoading(true);

      // Update order status
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "status_change",
          target_table: "orders",
          target_id: orderId,
          old_values: { status: currentStatus },
          new_values: { status: newStatus },
        });
      }

      toast.success(`${trans.statusUpdated} ${getStatusLabel(newStatus)}`);
      onStatusChange(newStatus);
    } catch (err: any) {
      console.error("Status change error:", err);
      toast.error(err.message || "Failed to update order status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Select onValueChange={handleStatusChange} disabled={isLoading} value={currentStatusKey}>
        <SelectTrigger className={`w-full ${STATUS_COLORS[currentStatusKey] || "bg-gray-100"}`}>
          <SelectValue placeholder={getStatusLabel(currentStatusKey) || currentStatus} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentStatusKey} disabled>
            {getStatusLabel(currentStatusKey)} ({trans.current || "Current"})
          </SelectItem>
          {recommendedStatuses.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Recommended Next Steps
              </div>
              {recommendedStatuses.map((status) => (
                <SelectItem key={status} value={status} className="font-medium">
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
              <div className="h-px bg-border my-1" />
            </>
          )}
          {otherStatuses.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Other Statuses
              </div>
              {otherStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        You can update to any status at any time. Recommended next steps are shown first.
      </p>
    </div>
  );
};
