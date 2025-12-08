import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Calendar, Package, Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

interface OrderStatusBadgeProps {
  status: string;
  showIcon?: boolean;
}

export const OrderStatusBadge = ({ status, showIcon = true }: OrderStatusBadgeProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.orderDetail || translations.EN.orderDetail;

  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, string> = {
      in_review: trans.inReview,
      confirmed: trans.confirmed,
      planned: trans.planned,
      delivered: trans.delivered,
      completed: trans.completed,
      canceled: trans.canceled,
      cancelled: trans.cancelled || trans.canceled,
    };

    switch (status) {
      case "in_review":
        return {
          label: statusMap.in_review,
          icon: Clock,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        };
      case "confirmed":
        return {
          label: statusMap.confirmed,
          icon: CheckCircle2,
          className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        };
      case "planned":
        return {
          label: statusMap.planned,
          icon: Calendar,
          className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
        };
      case "delivered":
        return {
          label: statusMap.delivered,
          icon: Package,
          className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
        };
      case "completed":
        return {
          label: statusMap.completed,
          icon: Trophy,
          className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        };
      case "canceled":
      case "cancelled":
        return {
          label: statusMap.cancelled || statusMap.canceled,
          icon: Clock,
          className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        };
      default:
        return {
          label: statusMap[status] || status,
          icon: Clock,
          className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} gap-1`}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
};
