import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface Order {
  id: string;
  order_number: string;
  total_incl_vat: number;
  client: {
    email: string;
    full_name: string;
    business_name: string;
  };
}

interface CreateInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: () => void;
}

export const CreateInvoiceForm = ({
  isOpen,
  onClose,
  onInvoiceCreated,
}: CreateInvoiceFormProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);
  const [createdInvoiceNumber, setCreatedInvoiceNumber] = useState<string>("");
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [amountExcVat, setAmountExcVat] = useState<number>(0);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [amountIncVat, setAmountIncVat] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableOrders();
    }
  }, [isOpen]);

  const fetchAvailableOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const { data, error } = await supabase
        .from("available_orders_for_invoice")
        .select("*");

      if (error) throw error;

      // Transform data to match Order interface
      const transformedOrders = data.map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        total_incl_vat: order.total_incl_vat,
        client: {
          email: order.email,
          full_name: order.full_name,
          business_name: order.business_name,
        },
      }));

      setOrders(transformedOrders);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load orders");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    const selected = orders.find((o) => o.id === orderId);
    if (selected) {
      // Pre-fill amount
      const amount = selected.total_incl_vat;
      setAmountIncVat(amount);
      const excVat = Math.round(amount / 1.21 * 100) / 100;
      const vat = Math.round((amount - excVat) * 100) / 100;
      setAmountExcVat(excVat);
      setVatAmount(vat);
    }
  };

  const handleAmountChange = (value: number) => {
    setAmountIncVat(value);
    const excVat = Math.round(value / 1.21 * 100) / 100;
    const vat = Math.round((value - excVat) * 100) / 100;
    setAmountExcVat(excVat);
    setVatAmount(vat);
  };

  const handleCreate = async () => {
    if (!selectedOrderId) {
      toast.error("Please select an order");
      return;
    }

    if (!invoiceNumber || invoiceNumber.trim() === "") {
      toast.error("Please enter an invoice number");
      return;
    }

    try {
      setLoading(true);

      // Get current user (admin)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("Not authenticated");
      }

      const selected = orders.find((o) => o.id === selectedOrderId);
      if (!selected) throw new Error("Order not found");

      // Check if invoice number already exists
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("invoice_number", invoiceNumber.trim())
        .single();

      if (existingInvoice) {
        toast.error("Invoice number already exists. Please use a different number.");
        setLoading(false);
        return;
      }

      // Direct insert - simpler and more reliable
      const { data: invoiceData, error: insertError } = await supabase
        .from("invoices")
        .insert({
          order_id: selectedOrderId,
          invoice_number: invoiceNumber.trim(),
          issued_at: issueDate,
          due_at: dueDate,
          amount_excl_vat: amountExcVat,
          vat_amount: vatAmount,
          amount_incl_vat: amountIncVat,
          payment_status: "unpaid",
        })
        .select();

      if (insertError) throw insertError;

      const newInvoiceId = invoiceData?.[0]?.id;
      if (!newInvoiceId) throw new Error("Invoice ID not returned");

      // Log the action
      await supabase.from("admin_activity_log").insert({
        admin_id: session.user.id,
        action: "invoice_created",
        target_table: "invoices",
        target_id: newInvoiceId,
        new_values: {
          order_number: selected.order_number,
          invoice_number: invoiceNumber.trim(),
          amount: amountIncVat,
        },
      });

      // Log email notification
      await supabase.from("email_notifications").insert({
        recipient_email: selected.client.email,
        recipient_name: selected.client.full_name,
        email_type: "invoice_created",
        subject: `Invoice ${invoiceNumber.trim()} Created`,
        body: `Your invoice ${invoiceNumber.trim()} has been created for amount €${amountIncVat.toFixed(2)}`,
        related_invoice_id: newInvoiceId,
      });

      // Set created invoice info to show PDF upload section
      setCreatedInvoiceId(newInvoiceId);
      setCreatedInvoiceNumber(invoiceNumber.trim());
      toast.success("Invoice created successfully! You can now upload the PDF document.");
    } catch (err: any) {
      console.error("Error creating invoice:", err);
      toast.error(err.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedOrderId("");
    setInvoiceNumber("");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate(
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    setAmountExcVat(0);
    setVatAmount(0);
    setAmountIncVat(0);
    setCreatedInvoiceId(null);
    setCreatedInvoiceNumber("");
    setPdfUploaded(false);
    onClose();
  };

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
    if (!createdInvoiceId) return;

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
      setIsUploadingPDF(true);

      // Create unique filename
      const timestamp = Date.now();
      const filePath = `invoices/${createdInvoiceId}/invoice-${createdInvoiceNumber}-${timestamp}.pdf`;

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
        .eq("id", createdInvoiceId);

      if (updateError) throw updateError;

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "pdf_upload",
          target_table: "invoices",
          target_id: createdInvoiceId,
          new_values: {
            pdf_path: publicUrl,
            file_name: file.name,
            file_size: file.size,
          },
        });
      }

      setPdfUploaded(true);
      toast.success("PDF uploaded successfully!");
      onInvoiceCreated();
    } catch (err: any) {
      console.error("Error uploading PDF:", err);
      toast.error(err.message || "Failed to upload PDF");
    } finally {
      setIsUploadingPDF(false);
    }
  };

  const handleFinish = () => {
    onInvoiceCreated();
    handleClose();
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {createdInvoiceId ? "Upload PDF Document" : "Create New Invoice"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select Order */}
          <div className="space-y-2">
            <Label htmlFor="order">Select Order</Label>
            <Select value={selectedOrderId} onValueChange={handleOrderSelect}>
              <SelectTrigger id="order" disabled={isLoadingOrders}>
                <SelectValue
                  placeholder={
                    isLoadingOrders ? "Loading orders..." : "Choose an order"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    <div className="flex flex-col">
                      <span>
                        {order.order_number} - €{order.total_incl_vat.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {order.client.full_name || order.client.business_name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {orders.length === 0 && !isLoadingOrders && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No orders available for invoice creation
                </AlertDescription>
              </Alert>
            )}
          </div>

          {selectedOrder && (
            <>
              {/* Invoice Number */}
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV-2025-001"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter a unique invoice number
                </p>
              </div>

              {/* Issue Date */}
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Amount */}
              <div className="space-y-3 bg-gray-50 p-3 rounded">
                <div className="flex justify-between text-sm">
                  <Label htmlFor="excVat">Amount (exc. VAT)</Label>
                  <Input
                    id="excVat"
                    type="number"
                    step="0.01"
                    value={amountExcVat}
                    readOnly
                    className="w-24 text-right"
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <Label htmlFor="vat">VAT (21%)</Label>
                  <Input
                    id="vat"
                    type="number"
                    step="0.01"
                    value={vatAmount}
                    readOnly
                    className="w-24 text-right"
                  />
                </div>

                <div className="border-t pt-2 flex justify-between font-semibold">
                  <Label htmlFor="incVat">Amount (inc. VAT)</Label>
                  <Input
                    id="incVat"
                    type="number"
                    step="0.01"
                    value={amountIncVat}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value))}
                    className="w-24 text-right"
                  />
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm space-y-1">
                <div className="font-semibold text-blue-900">Order {selectedOrder.order_number}</div>
                <div className="text-blue-800">
                  {selectedOrder.client.full_name || selectedOrder.client.business_name}
                </div>
                <div className="text-blue-700 text-xs">{selectedOrder.client.email}</div>
              </div>
            </>
          )}
        </div>

        {/* PDF Upload Section - Show after invoice creation */}
        {createdInvoiceId && (
          <>
            <Separator />
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-semibold">PDF Document</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload the invoice PDF document
                </p>
              </div>

              {pdfUploaded ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm text-green-700 font-medium">PDF Uploaded Successfully</p>
                    <p className="text-xs text-green-600">
                      Invoice {createdInvoiceNumber} is ready
                    </p>
                  </div>
                </div>
              ) : (
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
                    disabled={isUploadingPDF}
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
                      disabled={isUploadingPDF}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      {isUploadingPDF ? "Uploading..." : "Select PDF"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          {createdInvoiceId ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                {pdfUploaded ? "Close" : "Skip & Close"}
              </Button>
              {!pdfUploaded && (
                <Button
                  onClick={handleFinish}
                  variant="outline"
                >
                  Finish Without PDF
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !selectedOrderId || !invoiceNumber.trim()}
                className="gap-2"
              >
                {loading ? "Creating..." : "Create Invoice"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
