import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { OrderData, Plan2DConfig } from "@/types/order";
import { z } from "zod";
import { Info, Upload, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

const plan2DSchema = z.object({
  levels: z.number().min(1, "At least 1 level required").max(10, "Maximum 10 levels"),
  squareMetersPerLevel: z.number().min(10, "Must be at least 10m²").max(500, "Must be less than 500m²"),
  outputs: z.array(z.string()).min(1, "Select at least one output format"),
  editableDWG: z.boolean(),
  rush24h: z.boolean(),
});

interface Plan2DConfigurationProps {
  orderData: OrderData;
  setOrderData: (data: OrderData) => void;
}

export const Plan2DConfiguration = ({ orderData, setOrderData }: Plan2DConfigurationProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.wizard?.plan2DConfig || translations.EN.wizard.plan2DConfig;
  
  const [config, setConfig] = useState<Plan2DConfig>(
    orderData.plan2dConfig || {
      levels: 1,
      squareMetersPerLevel: 100,
      outputs: ["PDF"],
      editableDWG: false,
      rush24h: false,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      plan2DSchema.parse(config);
      setOrderData({ ...orderData, plan2dConfig: config });
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

  const toggleOutput = (output: string) => {
    const newOutputs = config.outputs.includes(output)
      ? config.outputs.filter((o) => o !== output)
      : [...config.outputs, output];
    setConfig({ ...config, outputs: newOutputs });
  };

  const getPrice = () => {
    const basePrices: Record<number, number> = { 1: 240, 2: 390, 3: 540 };
    let price = config.levels <= 3 ? basePrices[config.levels] : basePrices[3] + (config.levels - 3) * 150;
    
    if (config.squareMetersPerLevel > 150) {
      price += config.levels * 40;
    }
    if (config.editableDWG) price += 45;
    if (config.rush24h) price += 60;
    
    return price;
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          <strong>{trans.marketingFloorPlan}</strong> — {trans.notForPermits}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="levels">{trans.numberOfLevels} *</Label>
          <Input
            id="levels"
            type="number"
            min={1}
            max={10}
            value={config.levels}
            onChange={(e) => setConfig({ ...config, levels: parseInt(e.target.value) || 1 })}
          />
          {errors.levels && <p className="text-xs text-destructive">{errors.levels}</p>}
          <p className="text-xs text-muted-foreground">
            {trans.levelsPricing}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sqm">{trans.squareMetersPerLevel} *</Label>
          <Input
            id="sqm"
            type="number"
            min={10}
            max={500}
            value={config.squareMetersPerLevel}
            onChange={(e) => setConfig({ ...config, squareMetersPerLevel: parseInt(e.target.value) || 0 })}
          />
          {errors.squareMetersPerLevel && <p className="text-xs text-destructive">{errors.squareMetersPerLevel}</p>}
          {config.squareMetersPerLevel > 150 && (
            <p className="text-xs text-amber-600">{trans.largeLevelSurcharge}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Label>{trans.outputFormats} *</Label>
        <div className="flex flex-wrap gap-3">
          {["PDF", "PNG", "SVG"].map((format) => (
            <div key={format} className="flex items-center space-x-2">
              <Checkbox
                id={format}
                checked={config.outputs.includes(format)}
                onCheckedChange={() => toggleOutput(format)}
              />
              <Label htmlFor={format} className="font-normal cursor-pointer">
                {format}
              </Label>
            </div>
          ))}
        </div>
        {errors.outputs && <p className="text-xs text-destructive">{errors.outputs}</p>}
      </div>

      <div className="space-y-3">
        <Label className="text-base">{trans.addons}</Label>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="editableDWG"
              checked={config.editableDWG}
              onCheckedChange={(checked) => setConfig({ ...config, editableDWG: checked as boolean })}
            />
            <Label htmlFor="editableDWG" className="font-normal cursor-pointer">
              {trans.editableDWG}
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="rush24h2d"
              checked={config.rush24h}
              onCheckedChange={(checked) => setConfig({ ...config, rush24h: checked as boolean })}
            />
            <Label htmlFor="rush24h2d" className="font-normal cursor-pointer">
              {trans.rush24h}
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
            id="plan2d-uploads"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.dwg"
            multiple={true}
            className="hidden"
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              const totalSize = files.reduce((sum, f) => sum + f.size, 0);
              const maxSize = 200 * 1024 * 1024; // 200MB
              
              if (files.length > 10) {
                setErrors({ ...errors, uploadFiles: trans.maxFilesAllowed });
                return;
              }
              if (totalSize > maxSize) {
                setErrors({ ...errors, uploadFiles: trans.maxFileSize });
                return;
              }
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
