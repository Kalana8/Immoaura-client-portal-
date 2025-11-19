import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import type { OrderData, VideoConfig } from "@/types/order";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

const videoSchema = z.object({
  package: z.enum(["Starter", "Standard", "Premium"]),
  propertyType: z.string().trim().min(1, "Property type is required").max(100),
  squareMeters: z.number().min(10, "Must be at least 10m²").max(10000, "Must be less than 10000m²"),
  rooms: z.number().min(0, "Cannot be negative").max(100, "Must be less than 100"),
  address: z.string().trim().min(1, "Address is required").max(500),
  accessNotes: z.string().max(1000),
  voiceOver: z.boolean(),
  twilight: z.boolean(),
  extraSocialCut: z.boolean(),
  rush24h: z.boolean(),
});

interface VideoConfigurationProps {
  orderData: OrderData;
  setOrderData: (data: OrderData) => void;
}

export const VideoConfiguration = ({ orderData, setOrderData }: VideoConfigurationProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.wizard?.videoConfig || translations.EN.wizard.videoConfig;
  
  const [config, setConfig] = useState<VideoConfig>(
    orderData.videoConfig || {
      package: "Standard",
      propertyType: "",
      squareMeters: 100,
      rooms: 3,
      address: "",
      accessNotes: "",
      voiceOver: false,
      twilight: false,
      extraSocialCut: false,
      rush24h: false,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Validate and update parent
    try {
      videoSchema.parse(config);
      setOrderData({ ...orderData, videoConfig: config });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  }, [config]);

  const packages = [
    {
      id: "Starter",
      name: "Starter",
      price: "€250",
      features: ["30-45s (16:9)", "Drone inserts", "1 edit round", "48-72h delivery"],
    },
    {
      id: "Standard",
      name: "Standard",
      price: "€350",
      features: ["45-90s (16:9)", "Drone inserts", "+1× vertical 9:16", "Lower-thirds", "48-72h delivery"],
    },
    {
      id: "Premium",
      name: "Premium",
      price: "€450",
      features: ["60-120s (16:9)", "Drone inserts", "+2× social cuts", "Captions", "2 edit rounds"],
    },
  ];

  return (
    <div className="space-y-6 py-4">
      {/* Package Selection */}
      <div className="space-y-3">
        <Label>{trans.package} *</Label>
        <RadioGroup value={config.package} onValueChange={(value: any) => setConfig({ ...config, package: value })}>
          <div className="grid gap-3 md:grid-cols-3">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`p-4 cursor-pointer transition-all ${
                  config.package === pkg.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setConfig({ ...config, package: pkg.id as any })}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{pkg.name}</h4>
                    <p className="text-sm text-primary font-medium">{pkg.price}</p>
                  </div>
                  <RadioGroupItem value={pkg.id} />
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {pkg.features.map((feature, i) => (
                    <li key={i}>• {feature}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Property Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="propertyType">{trans.propertyType} *</Label>
          <Input
            id="propertyType"
            placeholder={trans.propertyTypePlaceholder}
            value={config.propertyType}
            onChange={(e) => setConfig({ ...config, propertyType: e.target.value })}
            maxLength={100}
          />
          {errors.propertyType && <p className="text-xs text-destructive">{errors.propertyType}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="squareMeters">{trans.squareMeters} *</Label>
          <Input
            id="squareMeters"
            type="number"
            min={10}
            max={10000}
            value={config.squareMeters}
            onChange={(e) => setConfig({ ...config, squareMeters: parseInt(e.target.value) || 0 })}
          />
          {errors.squareMeters && <p className="text-xs text-destructive">{errors.squareMeters}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rooms">{trans.numberOfRooms} *</Label>
          <Input
            id="rooms"
            type="number"
            min={0}
            max={100}
            value={config.rooms}
            onChange={(e) => setConfig({ ...config, rooms: parseInt(e.target.value) || 0 })}
          />
          {errors.rooms && <p className="text-xs text-destructive">{errors.rooms}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{trans.addressCity} *</Label>
        <Input
          id="address"
          placeholder={trans.addressPlaceholder}
          value={config.address}
          onChange={(e) => setConfig({ ...config, address: e.target.value })}
          maxLength={500}
        />
        {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="accessNotes">{trans.accessNotes}</Label>
        <Textarea
          id="accessNotes"
          placeholder={trans.accessNotesPlaceholder}
          value={config.accessNotes}
          onChange={(e) => setConfig({ ...config, accessNotes: e.target.value })}
          maxLength={1000}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">{config.accessNotes.length}/1000</p>
      </div>

      {/* Add-ons */}
      <div className="space-y-4">
        <Label className="text-base">{trans.addons}</Label>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="voiceOver"
              checked={config.voiceOver}
              onCheckedChange={(checked) => setConfig({ ...config, voiceOver: checked as boolean })}
            />
            <div className="flex-1">
              <Label htmlFor="voiceOver" className="font-normal cursor-pointer">
                {trans.voiceOver}
              </Label>
              {config.voiceOver && (
                <Select
                  value={config.voiceOverLanguage}
                  onValueChange={(value: any) => setConfig({ ...config, voiceOverLanguage: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={trans.selectLanguage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NL">Nederlands</SelectItem>
                    <SelectItem value="FR">Français</SelectItem>
                    <SelectItem value="DE">Deutsch</SelectItem>
                    <SelectItem value="EN">English</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="twilight"
              checked={config.twilight}
              onCheckedChange={(checked) => setConfig({ ...config, twilight: checked as boolean })}
            />
            <Label htmlFor="twilight" className="font-normal cursor-pointer">
              {trans.twilight}
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="extraSocialCut"
              checked={config.extraSocialCut}
              onCheckedChange={(checked) => setConfig({ ...config, extraSocialCut: checked as boolean })}
            />
            <Label htmlFor="extraSocialCut" className="font-normal cursor-pointer">
              {trans.extraSocialCut}
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="rush24h"
              checked={config.rush24h}
              onCheckedChange={(checked) => setConfig({ ...config, rush24h: checked as boolean })}
            />
            <Label htmlFor="rush24h" className="font-normal cursor-pointer">
              {trans.rush24h}
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};
