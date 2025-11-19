import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoConfiguration } from "./config/VideoConfiguration";
import { Plan2DConfiguration } from "./config/Plan2DConfiguration";
import { Plan3DConfiguration } from "./config/Plan3DConfiguration";
import type { OrderData } from "@/types/order";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

interface ServiceConfigurationProps {
  orderData: OrderData;
  setOrderData: (data: OrderData) => void;
}

export const ServiceConfiguration = ({ orderData, setOrderData }: ServiceConfigurationProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.wizard?.serviceConfiguration || translations.EN.wizard.serviceConfiguration;
  
  if (orderData.services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{trans.selectServiceFirst}</p>
      </div>
    );
  }

  const defaultTab = orderData.services[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{trans.title}</h2>
        <p className="text-muted-foreground">
          {trans.subtitle}
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full overflow-x-auto no-scrollbar flex gap-2">
          {orderData.services.map((service) => (
            <TabsTrigger key={service} value={service} className="shrink-0">
              {service}
            </TabsTrigger>
          ))}
        </TabsList>

        {orderData.services.includes("Property Video") && (
          <TabsContent value="Property Video">
            <VideoConfiguration orderData={orderData} setOrderData={setOrderData} />
          </TabsContent>
        )}

        {orderData.services.includes("2D Floor Plans") && (
          <TabsContent value="2D Floor Plans">
            <Plan2DConfiguration orderData={orderData} setOrderData={setOrderData} />
          </TabsContent>
        )}

        {orderData.services.includes("3D Floor Plans") && (
          <TabsContent value="3D Floor Plans">
            <Plan3DConfiguration orderData={orderData} setOrderData={setOrderData} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
