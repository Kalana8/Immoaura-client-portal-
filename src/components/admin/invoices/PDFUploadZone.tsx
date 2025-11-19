import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PDFUploadZoneProps {
  invoiceId: string;
  invoiceNumber: string;
  onUploadComplete: () => void;
}

export const PDFUploadZone = ({
  invoiceId,
  invoiceNumber,
  onUploadComplete,
}: PDFUploadZoneProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file
    if (!file.type.includes("pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      setIsLoading(true);

      // Create unique filename
      const timestamp = Date.now();
      const filePath = `invoices/${invoiceId}/invoice-${invoiceNumber}-${timestamp}.pdf`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("invoices")
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;

      // Update invoice with PDF path
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          pdf_path: publicUrl,
          pdf_uploaded_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (updateError) throw updateError;

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "pdf_upload",
          target_table: "invoices",
          target_id: invoiceId,
          new_values: {
            pdf_path: publicUrl,
            file_name: file.name,
            file_size: file.size,
          },
        });
      }

      toast.success("PDF uploaded successfully!");
      onUploadComplete();
    } catch (err: any) {
      console.error("Error uploading PDF:", err);
      toast.error(err.message || "Failed to upload PDF");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragging
          ? "border-[#243E8F] bg-[#243E8F]/10"
          : "border-gray-300 bg-gray-50 hover:border-gray-400"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="space-y-2">
        <Upload className="h-8 w-8 mx-auto text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-700">
            Drag & drop your PDF here
          </p>
          <p className="text-xs text-gray-500 mt-1">or click to browse</p>
        </div>
        <p className="text-xs text-gray-400">Max file size: 5MB</p>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          {isLoading ? "Uploading..." : "Select PDF"}
        </Button>
      </div>
    </div>
  );
};

// Standalone component for showing upload status
interface PDFStatusProps {
  pdfPath: string | null;
  uploadedAt: string | null;
  onReupload?: () => void;
}

export const PDFStatus = ({ pdfPath, uploadedAt, onReupload }: PDFStatusProps) => {
  if (pdfPath) {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <div className="flex-1">
          <p className="text-sm text-green-700 font-medium">PDF Uploaded</p>
          {uploadedAt && (
            <p className="text-xs text-green-600">
              {new Date(uploadedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        {onReupload && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onReupload}
            className="text-green-700 hover:text-green-800"
          >
            Replace
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <p className="text-sm text-yellow-700">No PDF uploaded</p>
    </div>
  );
};
