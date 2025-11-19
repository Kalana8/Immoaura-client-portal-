import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Video, Layout, Box } from "lucide-react";
import type { OrderData } from "@/types/order";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

interface ServiceSelectionProps {
  orderData: OrderData;
  setOrderData: (data: OrderData) => void;
}

export const ServiceSelection = ({ orderData, setOrderData }: ServiceSelectionProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.wizard?.serviceSelection || translations.EN.wizard.serviceSelection;
  
  const services = [
    {
      id: "Property Video",
      name: trans.propertyVideo,
      description: trans.propertyVideoDesc,
      icon: Video,
      price: trans.propertyVideoPrice,
    },
    {
      id: "2D Floor Plans",
      name: trans.floorPlans2D,
      description: trans.floorPlans2DDesc,
      icon: Layout,
      price: trans.floorPlans2DPrice,
    },
    {
      id: "3D Floor Plans",
      name: trans.floorPlans3D,
      description: trans.floorPlans3DDesc,
      icon: Box,
      price: trans.floorPlans3DPrice,
    },
  ];

  const toggleService = (serviceId: string) => {
    const newServices = orderData.services.includes(serviceId)
      ? orderData.services.filter((s) => s !== serviceId)
      : [...orderData.services, serviceId];

    setOrderData({ ...orderData, services: newServices });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{trans.title}</h2>
        <p className="text-muted-foreground">
          {trans.subtitle}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          const isSelected = orderData.services.includes(service.id);

          return (
            <Card
              key={service.id}
              className={`p-6 cursor-pointer transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => toggleService(service.id)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <Icon className={`h-8 w-8 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleService(service.id)} />
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {service.description}
                  </p>
                  <p className="text-sm font-medium text-primary">{service.price}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {orderData.services.length > 0 && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium">
            {trans.selected}: {orderData.services.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
};
