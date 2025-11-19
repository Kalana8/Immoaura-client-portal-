import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

interface OrderStatusTimelineProps {
  currentStatus: string;
}

export const OrderStatusTimeline = ({ currentStatus }: OrderStatusTimelineProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.orderDetail || translations.EN.orderDetail;

  const statusFlow = [
    { key: "in_review", label: trans.inReview },
    { key: "confirmed", label: trans.confirmed },
    { key: "planned", label: trans.planned },
    { key: "delivered", label: trans.delivered },
    { key: "completed", label: trans.completed }
  ];

  const currentIndex = statusFlow.findIndex(s => s.key === currentStatus);

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">{trans.orderProgress}</h3>
      <div className="space-y-4">
        {statusFlow.map((status, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={status.key} className="flex items-center gap-3">
              <div className={`flex-shrink-0 ${isCompleted ? "text-green-600" : "text-muted-foreground"}`}>
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                  {status.label}
                </p>
              </div>
              {isCurrent && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {trans.current}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
