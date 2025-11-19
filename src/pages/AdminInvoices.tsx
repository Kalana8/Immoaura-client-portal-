import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { InvoicesTable } from "@/components/admin/invoices/InvoicesTable";
import { InvoiceDetailPanel } from "@/components/admin/invoices/InvoiceDetailPanel";
import { CreateInvoiceForm } from "@/components/admin/invoices/CreateInvoiceForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

const AdminInvoices = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userData?.role !== "admin") {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
    } catch (err) {
      console.error("Auth check error:", err);
      navigate("/auth");
    }
  };

  if (!isAdmin) {
    return (
      <AdminLayout userEmail={user?.email}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userEmail={user?.email}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">
            Manage all client invoices, payment status, and generate new invoices from orders
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>View and manage all invoices. Click on any invoice to see details and update payment status.</CardDescription>
          </CardHeader>

          <CardContent>
            <InvoicesTable 
              key={refreshKey}
              onInvoiceSelect={(invoice) => {
                setSelectedInvoice(invoice);
                setIsDetailOpen(true);
              }}
              onCreateNew={() => setIsCreateFormOpen(true)}
            />
          </CardContent>
        </Card>

        {/* Invoice Detail Panel */}
        {selectedInvoice && (
          <InvoiceDetailPanel
            invoice={selectedInvoice}
            isOpen={isDetailOpen}
            onClose={() => {
              setIsDetailOpen(false);
              setTimeout(() => setSelectedInvoice(null), 300);
            }}
            onUpdate={() => setRefreshKey((prev) => prev + 1)}
          />
        )}

        {/* Create Invoice Form Modal */}
        <CreateInvoiceForm
          isOpen={isCreateFormOpen}
          onClose={() => setIsCreateFormOpen(false)}
          onInvoiceCreated={() => {
            setRefreshKey((prev) => prev + 1);
            setIsCreateFormOpen(false);
          }}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminInvoices;
