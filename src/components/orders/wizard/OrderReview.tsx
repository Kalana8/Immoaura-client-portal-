import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { format } from "date-fns";
import { calculateOrderPrice } from "@/lib/pricing";
import type { OrderData } from "@/types/order";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

interface OrderReviewProps {
  orderData: OrderData;
  setOrderData: (data: OrderData) => void;
}

export const OrderReview = ({ orderData, setOrderData }: OrderReviewProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.orderReview || translations.EN.orderReview;
  const wizardTrans = translations[language]?.wizard?.orderReview || translations.EN.wizard.orderReview;
  const [confirmed, setConfirmed] = useState(false);
  const [contactNumber, setContactNumber] = useState(orderData.contact_number || "");
  const pricing = calculateOrderPrice(orderData);

  const handleContactNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value;
    setContactNumber(number);
    setOrderData({ ...orderData, contact_number: number });
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">{wizardTrans.title}</h2>
        <p className="text-muted-foreground">
          {wizardTrans.subtitle}
        </p>
      </div>

      {/* Selected Services */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">{wizardTrans.selectedServices}</h3>
        <div className="flex flex-wrap gap-2">
          {orderData.services.map((service) => (
            <Badge key={service} variant="secondary" className="px-3 py-1">
              {service}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Configuration Summary */}
      {orderData.videoConfig && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">{wizardTrans.propertyVideoConfig}</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{wizardTrans.package}</dt>
              <dd className="font-medium">{orderData.videoConfig.package}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{wizardTrans.propertyType}</dt>
              <dd className="font-medium">{orderData.videoConfig.propertyType}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{wizardTrans.size}</dt>
              <dd className="font-medium">{orderData.videoConfig.squareMeters}m² • {orderData.videoConfig.rooms} rooms</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{wizardTrans.address}</dt>
              <dd className="font-medium">{orderData.videoConfig.address}</dd>
            </div>
            {(orderData.videoConfig.voiceOver || orderData.videoConfig.twilight || 
              orderData.videoConfig.extraSocialCut || orderData.videoConfig.rush24h) && (
              <div className="col-span-2">
                <dt className="text-muted-foreground mb-1">{wizardTrans.addons}</dt>
                <dd className="flex flex-wrap gap-2">
                  {orderData.videoConfig.voiceOver && <Badge variant="outline">Voice Over</Badge>}
                  {orderData.videoConfig.twilight && <Badge variant="outline">Twilight</Badge>}
                  {orderData.videoConfig.extraSocialCut && <Badge variant="outline">Extra Social Cut</Badge>}
                  {orderData.videoConfig.rush24h && <Badge variant="outline">Rush 24h</Badge>}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {orderData.plan2dConfig && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">{wizardTrans.floorPlans2DConfig}</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{wizardTrans.levels}</dt>
              <dd className="font-medium">{orderData.plan2dConfig.levels}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{wizardTrans.sizePerLevel}</dt>
              <dd className="font-medium">{orderData.plan2dConfig.squareMetersPerLevel}m²</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground mb-1">{wizardTrans.outputFormats}</dt>
              <dd className="flex gap-2">
                {orderData.plan2dConfig.outputs.map(output => (
                  <Badge key={output} variant="outline">{output}</Badge>
                ))}
              </dd>
            </div>
          </dl>
        </Card>
      )}

      {orderData.plan3dConfig && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">{wizardTrans.floorPlans3DConfig}</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{wizardTrans.levels}</dt>
              <dd className="font-medium">{orderData.plan3dConfig.levels}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{wizardTrans.quality}</dt>
              <dd className="font-medium">{orderData.plan3dConfig.quality}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground mb-1">{wizardTrans.views}</dt>
              <dd className="flex gap-2">
                {orderData.plan3dConfig.views.map(view => (
                  <Badge key={view} variant="outline">{view}</Badge>
                ))}
              </dd>
            </div>
          </dl>
        </Card>
      )}

      {/* Schedule */}
      {orderData.agendaSlot && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">{wizardTrans.scheduledDateTime}</h3>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="font-medium">
              {format(new Date(orderData.agendaSlot), "EEEE, MMMM d, yyyy 'at' HH:mm")}
            </p>
          </div>
        </Card>
      )}

      {/* Price Breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">{wizardTrans.priceBreakdown}</h3>
        
        <div className="space-y-3">
          {Object.entries(pricing.breakdown.services).map(([service, price]) => (
            <div key={service} className="flex justify-between text-sm">
              <span>{service}</span>
              <span className="font-medium">€{Number(price).toFixed(2)}</span>
            </div>
          ))}

          {Object.keys(pricing.breakdown.addons).length > 0 && (
            <>
              <Separator />
              <p className="text-sm font-medium text-muted-foreground">{wizardTrans.addons}</p>
              {Object.entries(pricing.breakdown.addons).map(([addon, price]) => (
                <div key={addon} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{addon}</span>
                  <span className="font-medium">€{Number(price).toFixed(2)}</span>
                </div>
              ))}
            </>
          )}

          <Separator />
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{wizardTrans.subtotalExclBTW}</span>
            <span className="font-medium">€{pricing.totalExclVat.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{wizardTrans.btw.replace("{rate}", String((pricing.vatRate * 100).toFixed(0)))}</span>
            <span className="font-medium">€{pricing.vatAmount.toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>{wizardTrans.totalInclBTW}</span>
            <span className="text-primary">€{pricing.totalInclVat.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">{wizardTrans.contactInformation}</h3>
        <div className="space-y-2">
          <Label htmlFor="contact-number">{wizardTrans.phoneNumber} *</Label>
          <Input
            id="contact-number"
            type="tel"
            placeholder={wizardTrans.phonePlaceholder}
            value={contactNumber}
            onChange={handleContactNumberChange}
            className="placeholder:text-gray-400"
          />
          <p className="text-xs text-muted-foreground">
            {wizardTrans.phoneDescription}
          </p>
        </div>
      </Card>

      {/* Confirmation */}
      <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted">
        <Checkbox
          id="confirm"
          checked={confirmed}
          onCheckedChange={(checked) => setConfirmed(checked as boolean)}
          disabled={!contactNumber.trim()}
        />
        <Label htmlFor="confirm" className="cursor-pointer leading-relaxed">
          {trans.confirmOrder}
        </Label>
      </div>

      {!confirmed && (
        <p className="text-sm text-center text-muted-foreground">
          {trans.pleaseConfirm}
        </p>
      )}
    </div>
  );
};
