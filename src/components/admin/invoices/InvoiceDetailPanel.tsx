import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Download, MessageCircle, FileText, AlertCircle, Trash2 } from "lucide-react";
import { PaymentStatusDropdown } from "./PaymentStatusDropdown";
import { PDFUploadZone } from "./PDFUploadZone";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  issue_date: string;
  due_date: string;
  amount_excl_vat: number;
  vat_amount: number;
  amount_incl_vat: number;
  payment_status: "unpaid" | "partial" | "paid";
  pdf_path: string | null;
  notes: string | null;
  created_at: string;
  order?: {
    order_number: string;
    status: string;
    total_price_incl_vat: number;
    client?: {
      email: string;
      full_name: string;
      business_name: string;
      phone: string;
    };
  };
}

interface InvoiceDetailPanelProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const InvoiceDetailPanel = ({
  invoice,
  isOpen,
  onClose,
  onUpdate,
}: InvoiceDetailPanelProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState(invoice.notes || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setNotes(invoice.notes || "");
  }, [invoice]);

  if (!isOpen) return null;

  const dueDate = invoice.due_date || invoice.due_at;
  const issueDate = invoice.issue_date || invoice.issued_at;
  const daysUntilDue = dueDate 
    ? Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isOverdue = daysUntilDue < 0;

  const handleSaveNotes = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("invoices")
        .update({ notes })
        .eq("id", invoice.id);

      if (error) throw error;

      // Log action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "notes_update",
          target_table: "invoices",
          target_id: invoice.id,
          new_values: { notes },
        });
      }

      toast.success("Notes saved successfully");
      onUpdate();
    } catch (err: any) {
      console.error("Error saving notes:", err);
      toast.error(err.message || "Failed to save notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (invoice.pdf_path) {
      // In production, generate or fetch PDF
      toast.info("PDF download functionality to be implemented");
    } else {
      toast.error("No PDF uploaded for this invoice");
    }
  };

  const handleDeleteInvoice = async () => {
    try {
      setIsDeleting(true);

      // Delete PDF file from storage if it exists
      if (invoice.pdf_path) {
        try {
          // Extract the file path (remove bucket prefix if present)
          let filePath = invoice.pdf_path;
          if (filePath.startsWith('invoice-pdfs/')) {
            filePath = filePath.replace('invoice-pdfs/', '');
          }
          
          const { error: storageError } = await supabase.storage
            .from('invoice-pdfs')
            .remove([filePath]);

          if (storageError) {
            console.warn("Error deleting PDF file from storage:", storageError);
            // Continue with invoice deletion even if PDF deletion fails
          }
        } catch (storageErr) {
          console.warn("Error deleting PDF file:", storageErr);
          // Continue with invoice deletion even if PDF deletion fails
        }
      }

      // Delete the invoice
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoice.id);

      if (error) throw error;

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "invoice_delete",
          target_table: "invoices",
          target_id: invoice.id,
          old_values: {
            invoice_number: invoice.invoice_number,
            order_id: invoice.order_id,
            amount_incl_vat: invoice.amount_incl_vat,
            pdf_path: invoice.pdf_path,
          },
        });
      }

      toast.success(`Invoice ${invoice.invoice_number} deleted successfully`);
      setDeleteDialogOpen(false);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error("Error deleting invoice:", err);
      toast.error(err.message || "Failed to delete invoice");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-end overflow-y-auto">
      <Card className="w-full max-w-md m-4 mt-0 rounded-r-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl">{invoice.invoice_number}</CardTitle>
            <p className="text-sm text-gray-500">Order {invoice.order?.order_number}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Client Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Client</h3>
            <div className="text-sm space-y-1">
              <div className="font-medium">
                {invoice.order?.client?.full_name || invoice.order?.client?.business_name}
              </div>
              <div className="text-gray-600">{invoice.order?.client?.email}</div>
              {invoice.order?.client?.phone && (
                <div className="text-gray-600">{invoice.order?.client?.phone}</div>
              )}
            </div>
          </div>

          <Separator />

          {/* Dates & Status */}
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="text-sm">
                <p className="text-gray-600">Issue Date</p>
                <p className="font-medium">
                  {issueDate ? new Date(issueDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="text-sm text-right">
                <p className="text-gray-600">Due Date</p>
                <p className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
                  {dueDate ? new Date(dueDate).toLocaleDateString() : "N/A"}
                </p>
                {isOverdue && (
                  <p className="text-xs text-red-600 mt-1">
                    {Math.abs(daysUntilDue)} days overdue
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Amount Details */}
          <div className="space-y-2 bg-gray-50 p-3 rounded">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal (exc. VAT)</span>
              <span className="font-medium">€{(invoice.amount_excl_vat || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">VAT (21%)</span>
              <span className="font-medium">€{(invoice.vat_amount || 0).toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total Amount</span>
              <span className="font-bold text-lg">€{(invoice.amount_incl_vat || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Payment Status</label>
            <div className="flex items-center gap-2">
              <PaymentStatusDropdown
                invoiceId={invoice.id}
                orderId={invoice.order_id}
                currentStatus={invoice.payment_status}
                onStatusChange={onUpdate}
              />
            </div>
          </div>

          {/* PDF Upload Status */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">PDF Document</label>
            {invoice.pdf_path ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 flex-1">PDF Uploaded</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownloadPDF}
                  className="gap-1"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <PDFUploadZone
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoice_number}
                onUploadComplete={onUpdate}
              />
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Admin Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this invoice..."
              className="w-full p-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-[#243E8F]"
              rows={4}
            />
            <Button
              onClick={handleSaveNotes}
              disabled={isLoading || notes === invoice.notes}
              className="w-full"
            >
              Save Notes
            </Button>
          </div>

          {/* Order Status Info */}
          {invoice.order?.status && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-gray-600 mb-1">Related Order Status</p>
              <Badge variant="outline">
                {invoice.order.status.charAt(0).toUpperCase() + invoice.order.status.slice(1)}
              </Badge>
            </div>
          )}

          <Separator />

          {/* Delete Invoice Section */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-red-600">Danger Zone</label>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-xs text-red-700 mb-2">
                Deleting this invoice will permanently remove it from the system. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Invoice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice <strong>{invoice.invoice_number}</strong>?
              <br />
              <br />
              This action cannot be undone. The invoice will be permanently removed from the system.
              {invoice.pdf_path && (
                <span className="block mt-2 text-amber-600">
                  Note: The associated PDF file will also be deleted from storage.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
