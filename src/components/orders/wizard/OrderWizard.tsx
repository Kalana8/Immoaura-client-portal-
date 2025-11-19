import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ServiceSelection } from "./ServiceSelection";
import { ServiceConfiguration } from "./ServiceConfiguration";
import { AgendaSelection } from "./AgendaSelection";
import { OrderReview } from "./OrderReview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateOrderPrice } from "@/lib/pricing";
import type { OrderData } from "@/types/order";
import { notifyOrderSubmitted } from "@/lib/email-notifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

interface OrderWizardProps {
  userId: string;
}

// Helper function to upload files to Supabase Storage
// Returns an array of promises that can be spread into fileUploadPromises
function uploadFiles(orderId: string, userId: string, files: File[], uploadType: string): Promise<void>[] {
  return files.map(async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orderId}/${uploadType}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    // Store relative path for database (without bucket name)
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('order-files')
      .upload(filePath, file);

    if (uploadError) {
      console.error(`Error uploading ${file.name}:`, uploadError);
      return;
    }

    // Record file in database
    const { error: dbError } = await supabase
      .from('file_uploads')
      .insert({
        order_id: orderId,
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        upload_type: uploadType,
      });

    if (dbError) {
      console.error(`Error saving file record for ${file.name}:`, dbError);
      console.error('DB Error details:', dbError);
    }
  });
}

export const OrderWizard = ({ userId }: OrderWizardProps) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const trans = translations[language]?.wizard || translations.EN.wizard;
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [orderData, setOrderData] = useState<OrderData>({
    services: [],
    videoConfig: null,
    plan2dConfig: null,
    plan3dConfig: null,
    agendaSlot: null,
  });

  const steps = [
    { number: 1, title: trans.step1, component: ServiceSelection },
    { number: 2, title: trans.step2, component: ServiceConfiguration },
    { number: 3, title: trans.step3, component: AgendaSelection },
    { number: 4, title: trans.step4, component: OrderReview },
  ];

  const progress = (currentStep / steps.length) * 100;

  const canProceed = () => {
    if (currentStep === 1) {
      return orderData.services.length > 0;
    }
    if (currentStep === 2) {
      if (orderData.services.includes("Property Video") && !orderData.videoConfig) {
        return false;
      }
      if (orderData.services.includes("2D Floor Plans") && !orderData.plan2dConfig) {
        return false;
      }
      if (orderData.services.includes("3D Floor Plans") && !orderData.plan3dConfig) {
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      // Skip agenda if no video service
      if (!orderData.services.includes("Property Video")) {
        return true;
      }
      return !!orderData.agendaSlot;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 3 && !orderData.services.includes("Property Video")) {
      // Skip agenda step if no video service
      setCurrentStep(4);
    } else if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      // Navigate back to orders page on first step
      navigate("/orders");
    } else if (currentStep === 4 && !orderData.services.includes("Property Video")) {
      // Skip agenda step when going back
      setCurrentStep(2);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Validate contact number
      if (!orderData.contact_number?.trim()) {
        toast.error(trans.pleaseProvideContactNumber);
        setSubmitting(false);
        return;
      }

      const pricing = calculateOrderPrice(orderData);
      
      // Generate sequential order number using database function (IM-000001 format)
      const { data: orderNumberData, error: orderNumberError } = await supabase
        .rpc('generate_order_number');
      
      if (orderNumberError) throw orderNumberError;
      
      const orderNumber = orderNumberData || `IM-${String(Date.now()).slice(-6)}`;

      const orderInsert = {
        client_id: userId,
        order_number: orderNumber,
        services_selected: orderData.services,
        config_video: orderData.videoConfig as any,
        config_2d: orderData.plan2dConfig as any,
        config_3d: orderData.plan3dConfig as any,
        agenda_slot: orderData.agendaSlot,
        price_breakdown: pricing.breakdown as any,
        total_excl_vat: pricing.totalExclVat,
        vat_rate: pricing.vatRate,
        total_incl_vat: pricing.totalInclVat,
        status: "in_review" as const,
        payment_status: "unpaid" as const,
      };

      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderInsert)
        .select()
        .single();

      if (orderError) throw orderError;

      // Update user's phone number in users table
      if (orderData.contact_number?.trim()) {
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({ phone: orderData.contact_number })
          .eq("id", userId);

        if (userUpdateError) {
          console.error("Error updating user phone number:", userUpdateError);
          // Don't fail the order creation if phone update fails
        }
      }

      // Mark the calendar slot as booked with order ID
      if (orderData.agendaSlot && orderData.services.includes("Property Video")) {
        try {
          // Parse the datetime to get date and start_time
          // agendaSlot format: "2025-11-09T14:00:00" 
          // We need to extract date and time without timezone conversion
          const [slotDatePart, slotTimePart] = orderData.agendaSlot.split('T');
          const slotDate = slotDatePart; // Already in YYYY-MM-DD format
          const slotTime = slotTimePart.substring(0, 5); // Get HH:MM format
          
          console.log("📅 Marking slot as booked:", { slotDate, slotTime, orderId: newOrder.id });
          
          const { error: slotUpdateError } = await supabase
            .from("calendar_slots")
            .update({ 
              status: "booked",
              booked_by_order_id: newOrder.id,
              updated_at: new Date().toISOString(),
            })
            .eq("date", slotDate)
            .eq("start_time", slotTime);

          if (slotUpdateError) {
            console.error("Error marking slot as booked:", slotUpdateError);
            // Don't fail the order if slot update fails
          } else {
            console.log("✅ Slot marked as booked successfully");
          }
        } catch (err) {
          console.error("Error updating calendar slot:", err);
          // Don't fail the order if slot update fails
        }
      }

      // Upload files if any
      const fileUploadPromises: Promise<void>[] = [];
      
      if (orderData.videoConfig?.logoFiles && Array.isArray(orderData.videoConfig.logoFiles) && orderData.videoConfig.logoFiles.length > 0) {
        fileUploadPromises.push(...uploadFiles(newOrder.id, userId, orderData.videoConfig.logoFiles, 'video-logo'));
      }
      if (orderData.videoConfig?.musicFiles && Array.isArray(orderData.videoConfig.musicFiles) && orderData.videoConfig.musicFiles.length > 0) {
        fileUploadPromises.push(...uploadFiles(newOrder.id, userId, orderData.videoConfig.musicFiles, 'video-music'));
      }
      if (orderData.plan2dConfig?.uploadFiles && Array.isArray(orderData.plan2dConfig.uploadFiles) && orderData.plan2dConfig.uploadFiles.length > 0) {
        fileUploadPromises.push(...uploadFiles(newOrder.id, userId, orderData.plan2dConfig.uploadFiles, 'plan2d-uploads'));
      }
      if (orderData.plan3dConfig?.uploadFiles && Array.isArray(orderData.plan3dConfig.uploadFiles) && orderData.plan3dConfig.uploadFiles.length > 0) {
        fileUploadPromises.push(...uploadFiles(newOrder.id, userId, orderData.plan3dConfig.uploadFiles, 'plan3d-uploads'));
      }

      // Upload files in parallel (don't wait for completion to show success)
      if (fileUploadPromises.length > 0) {
        Promise.all(fileUploadPromises).catch(err => {
          console.error('Error uploading files:', err);
          // Don't show error to user - files can be uploaded later
        });
      }

      // Send email notifications (non-blocking)
      const { data: userData } = await supabase.auth.getUser();
      const clientEmail = userData?.user?.email || '';
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@immoaura.com';
      
      notifyOrderSubmitted(orderNumber, clientEmail, adminEmail, orderData).catch(err => {
        console.error('Email notification failed:', err);
      });

      toast.success(trans.orderCreatedSuccessfully);
      navigate("/orders");
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error.message || trans.failedToCreateOrder);
    } finally {
      setSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{trans.stepOf.replace("{current}", String(currentStep)).replace("{total}", String(steps.length))}</span>
          <span>{steps[currentStep - 1].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between overflow-x-auto no-scrollbar gap-4 sm:gap-6 px-1">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`flex flex-col items-center gap-2 shrink-0 min-w-[72px] sm:min-w-0 ${step.number === currentStep
                ? "text-primary"
                : step.number < currentStep
                  ? "text-green-600"
                  : "text-muted-foreground"
              }`}
          >
            <div
              className={`flex h-10 w-10 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 font-semibold ${step.number === currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.number < currentStep
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-muted-foreground"
                }`}
            >
              {step.number}
            </div>
            <span className="text-xs font-medium block sm:block">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          <CurrentStepComponent orderData={orderData} setOrderData={setOrderData} />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={submitting}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {trans.back}
        </Button>

        {currentStep === steps.length ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? trans.creatingOrder : trans.submitOrder}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed() || submitting}>
            {trans.next}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
