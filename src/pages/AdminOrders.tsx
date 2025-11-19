import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { OrderDetailPanel } from "@/components/admin/orders/OrderDetailPanel";

interface Order {
  id: string;
  order_number: string;
  client_id: string;
  services_selected: string[];
  status: string;
  total_incl_vat: number;
  total_excl_vat: number;
  vat_rate: number;
  price_breakdown: Record<string, any>;
  config_video: any;
  config_2d: any;
  config_3d: any;
  admin_notes: string;
  calendar_slot_id: string | null;
  created_at: string;
  client?: {
    email: string;
    full_name: string;
    business_name: string;
    phone: string;
  };
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setDetailPanelOpen(true);
  };

  const handleDetailPanelClose = () => {
    setDetailPanelOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  const handleOrderUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) return null;

  return (
    <AdminLayout userEmail={user?.email}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-2">View and manage all client orders. Click on any order to see details and make changes.</p>
        </div>

        {/* Orders Table */}
        <OrdersTable key={refreshKey} onOrderSelect={handleOrderSelect} />

        {/* Order Detail Panel */}
        {selectedOrder && (
          <OrderDetailPanel
            order={selectedOrder}
            isOpen={detailPanelOpen}
            onClose={handleDetailPanelClose}
            onUpdate={handleOrderUpdate}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
