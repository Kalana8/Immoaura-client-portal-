import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SendMessageModal } from "@/components/admin/messaging/SendMessageModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ShoppingCart, FileText, Calendar, MessageSquare } from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  inReviewCount: number;
  confirmedCount: number;
  plannedCount: number;
  deliveredCount: number;
  pendingInvoices: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    inReviewCount: 0,
    confirmedCount: 0,
    plannedCount: 0,
    deliveredCount: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate("/auth");
          return;
        }
        setUser(session.user);

        // Fetch order and invoice statistics in parallel for better performance
        const [ordersResult, invoicesResult] = await Promise.all([
          supabase
            .from("orders")
            .select("id, status, total_incl_vat"),
          supabase
            .from("invoices")
            .select("id, payment_status")
        ]);

        const orders = ordersResult.data;
        const ordersError = ordersResult.error;
        const invoices = invoicesResult.data;
        const invoicesError = invoicesResult.error;

        if (ordersError) throw ordersError;
        if (invoicesError) throw invoicesError;

        // Calculate statistics
        const statusCounts = {
          in_review: 0,
          confirmed: 0,
          planned: 0,
          delivered: 0,
          completed: 0,
        };

        let totalRevenue = 0;
        orders?.forEach((order: any) => {
          const status = order.status.toLowerCase().replace(/ /g, "_");
          if (status in statusCounts) {
            statusCounts[status as keyof typeof statusCounts]++;
          }
          totalRevenue += order.total_incl_vat || 0;
        });

        const pendingInvoices = invoices?.filter(
          (inv: any) => inv.payment_status !== "paid"
        ).length || 0;

        setStats({
          totalOrders: orders?.length || 0,
          inReviewCount: statusCounts.in_review,
          confirmedCount: statusCounts.confirmed,
          plannedCount: statusCounts.planned,
          deliveredCount: statusCounts.delivered,
          pendingInvoices,
          totalRevenue,
        });
      } catch (err: any) {
        console.error("Dashboard error:", err);
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <AdminLayout userEmail={user?.email}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#243E8F]/20 border-t-[#243E8F]"></div>
            </div>
            <p className="text-[#282120]">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userEmail={user?.email}>
      <div className="space-y-6">
        {/* Header with Send Message Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#243E8F] dark:text-[#5B7FD8]">Admin Dashboard</h1>
            <p className="text-[#282120] dark:text-gray-300 mt-2">Manage orders, invoices, and calendar</p>
          </div>
          
          {/* Send Message Button - Top Right */}
          <Button
            onClick={() => setIsSendMessageModalOpen(true)}
            className="bg-[#243E8F] hover:bg-[#1E3268] text-white font-semibold py-2 px-4 h-auto flex items-center gap-2 whitespace-nowrap"
            size="sm"
          >
            <MessageSquare className="h-4 w-4" />
            Send Message
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-gray-600">All time orders</p>
            </CardContent>
          </Card>

          {/* In Review Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Review</CardTitle>
              <FileText className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inReviewCount}</div>
              <p className="text-xs text-gray-600">Awaiting review</p>
            </CardContent>
          </Card>

          {/* Confirmed Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.confirmedCount}</div>
              <p className="text-xs text-gray-600">Ready to plan</p>
            </CardContent>
          </Card>

          {/* Pending Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
              <Calendar className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.pendingInvoices}</div>
              <p className="text-xs text-gray-600">Unpaid invoices</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => navigate("/admin/orders")} 
                className="bg-[#243E8F] hover:bg-[#1E3268] text-white border-[#243E8F] hover:border-[#1E3268]"
              >
                View All Orders
              </Button>
              <Button 
                onClick={() => navigate("/admin/invoices")} 
                variant="outline"
                className="border-[#243E8F] text-[#243E8F] bg-white hover:bg-[#243E8F] hover:text-white hover:border-[#243E8F] transition-colors"
              >
                Manage Invoices
              </Button>
              <Button 
                onClick={() => navigate("/admin/calendar")} 
                variant="outline"
                className="border-[#243E8F] text-[#243E8F] bg-white hover:bg-[#243E8F] hover:text-white hover:border-[#243E8F] transition-colors"
              >
                Calendar Manager
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Send Message Modal */}
        <SendMessageModal
          isOpen={isSendMessageModalOpen}
          onClose={() => setIsSendMessageModalOpen(false)}
        />

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">In Review</span>
                  <span className="font-medium">{stats.inReviewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmed</span>
                  <span className="font-medium">{stats.confirmedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Planned</span>
                  <span className="font-medium">{stats.plannedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivered</span>
                  <span className="font-medium">{stats.deliveredCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  €{stats.totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-gray-600">Total revenue from all orders</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
