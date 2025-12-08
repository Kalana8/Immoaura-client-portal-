import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OrderData, Plan3DConfig } from "@/types/order";
import { z } from "zod";
import { Info, Upload, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

const plan3DSchema = z.object({
  levels: z.number().min(1, "At least 1 level required").max(10, "Maximum 10 levels"),
  quality: z.enum(["Basic", "Enhanced", "Photoreal"]),
  views: z.array(z.string()).min(1, "Select at least one view"),
  styleMood: z.string().max(500),
  twilight: z.boolean(),
  flyThrough: z.boolean(),
});

interface Plan3DConfigurationProps {
  orderData: OrderData;
  setOrderData: (data: OrderData) => void;
}

export const Plan3DConfiguration = ({ orderData, setOrderData }: Plan3DConfigurationProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.wizard?.plan3DConfig || translations.EN.wizard.plan3DConfig;
  
  const [config, setConfig] = useState<Plan3DConfig>(
    orderData.plan3dConfig || {
      levels: 1,
      quality: "Enhanced",
      views: ["Isometric"],
      styleMood: "",
      twilight: false,
      flyThrough: false,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      plan3DSchema.parse(config);
      setOrderData({ ...orderData, plan3dConfig: config });
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

  const qualities = [
    {
      id: "Basic",
      name: "Basic",
      price: "€300/level",
      features: ["Clean 3D layout", "Simple materials", "1 view", "48-96h delivery"],
    },
    {
      id: "Enhanced",
      name: "Enhanced",
      price: "€500/level",
      features: ["Materials + furniture", "Better lighting", "1-2 views", "48-96h delivery"],
    },
    {
      id: "Photoreal",
      name: "Photoreal",
      price: "€800/level",
      features: ["High-end textures", "Realistic lighting", "2 views", "3-5 days"],
    },
  ];

  const toggleView = (view: string) => {
    const newViews = config.views.includes(view)
      ? config.views.filter((v) => v !== view)
      : [...config.views, view];
    setConfig({ ...config, views: newViews });
  };

  const getPrice = () => {
    const pricePerLevel: Record<string, number> = { Basic: 300, Enhanced: 500, Photoreal: 800 };
    let price = pricePerLevel[config.quality] * config.levels;
    
    if (config.twilight) price += 70 * config.views.length;
    if (config.flyThrough) price += 250;
    
    return price;
  };

  const getViewsIncludedText = () => {
    if (config.quality === "Basic") {
      return trans.viewsIncluded.replace("{basic}", "1");
    } else if (config.quality === "Enhanced") {
      return trans.viewsIncludedRange.replace("{min}", "1").replace("{max}", "2");
    } else {
      return trans.viewsIncluded.replace("{basic}", "2");
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          <strong>{trans.marketing3D}</strong> — {trans.notForConstruction}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="levels3d">{trans.numberOfLevels} *</Label>
        <Input
          id="levels3d"
          type="number"
          min={1}
          max={10}
          value={config.levels}
          onChange={(e) => setConfig({ ...config, levels: parseInt(e.target.value) || 1 })}
        />
        {errors.levels && <p className="text-xs text-destructive">{errors.levels}</p>}
      </div>

      <div className="space-y-3">
        <Label>{trans.qualityLevel} *</Label>
        <RadioGroup value={config.quality} onValueChange={(value: any) => setConfig({ ...config, quality: value })}>
          <div className="grid gap-3 md:grid-cols-3">
            {qualities.map((quality) => (
              <Card
                key={quality.id}
                className={`p-4 cursor-pointer transition-all ${
                  config.quality === quality.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setConfig({ ...config, quality: quality.id as any })}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{quality.name}</h4>
                    <p className="text-sm text-primary font-medium">{quality.price}</p>
                  </div>
                  <RadioGroupItem value={quality.id} />
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {quality.features.map((feature, i) => (
                    <li key={i}>• {feature}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{trans.views} *</Label>
        <div className="flex flex-wrap gap-3">
          {["Isometric", "Perspective", "Close-up"].map((view) => (
            <div key={view} className="flex items-center space-x-2">
              <Checkbox
                id={view}
                checked={config.views.includes(view)}
                onCheckedChange={() => toggleView(view)}
              />
              <Label htmlFor={view} className="font-normal cursor-pointer">
                {view}
              </Label>
            </div>
          ))}
        </div>
        {errors.views && <p className="text-xs text-destructive">{errors.views}</p>}
        <p className="text-xs text-muted-foreground">
          {getViewsIncludedText()}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="styleMood">{trans.styleMood}</Label>
        <Textarea
          id="styleMood"
          placeholder={trans.styleMoodPlaceholder}
          value={config.styleMood}
          onChange={(e) => setConfig({ ...config, styleMood: e.target.value })}
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">{config.styleMood.length}/500</p>
      </div>

      <div className="space-y-3">
        <Label className="text-base">{trans.addons}</Label>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="twilight3d"
              checked={config.twilight}
              onCheckedChange={(checked) => setConfig({ ...config, twilight: checked as boolean })}
            />
            <Label htmlFor="twilight3d" className="font-normal cursor-pointer">
              {trans.twilightRender}
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="flyThrough"
              checked={config.flyThrough}
              onCheckedChange={(checked) => setConfig({ ...config, flyThrough: checked as boolean })}
            />
            <Label htmlFor="flyThrough" className="font-normal cursor-pointer">
              {trans.flyThrough}
            </Label>
          </div>
        </div>
      </div>

      {/* File Uploads */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base">{trans.fileUploads}</Label>
        <p className="text-xs text-muted-foreground">
          {trans.fileUploadsDesc}
        </p>
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            id="plan3d-uploads"
            type="file"
            accept="image/*,.pdf"
            multiple={true}
            className="hidden"
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              setConfig({ ...config, uploadFiles: files });
              setErrors({ ...errors, uploadFiles: "" });
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto border-2 border-dashed hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200 cursor-pointer"
          >
            <Upload className="h-4 w-4 mr-2" />
            {trans.chooseFiles}
          </Button>
          {errors.uploadFiles && (
            <p className="text-xs text-destructive">{errors.uploadFiles}</p>
          )}
          {config.uploadFiles && config.uploadFiles.length > 0 && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {trans.filesSelected.replace("{count}", String(config.uploadFiles.length))}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConfig({ ...config, uploadFiles: undefined });
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="h-6 px-2 text-xs hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" />
                  {trans.clear}
                </Button>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                {config.uploadFiles.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between py-1">
                    <span className="truncate flex-1">• {file.name}</span>
                    <span className="ml-2 text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-sm font-medium">
          {trans.estimatedPrice.replace("{price}", String(getPrice()))}
        </p>
      </div>
    </div>
  );
};
