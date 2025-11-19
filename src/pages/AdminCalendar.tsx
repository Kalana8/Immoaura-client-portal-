import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CalendarGrid } from "@/components/admin/calendar/CalendarGrid";
import { BulkActionsPanel } from "@/components/admin/calendar/BulkActionsPanel";

const AdminCalendar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const handleSlotsChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) return null;

  return (
    <AdminLayout userEmail={user?.email}>
      <div className="space-y-6">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid - Takes 3/4 width */}
          <div className="lg:col-span-3">
            <CalendarGrid
              key={refreshKey}
              onSlotsChanged={handleSlotsChanged}
            />
          </div>

          {/* Bulk Actions - Takes 1/4 width */}
          <div className="lg:col-span-1">
            <BulkActionsPanel
              onActionComplete={handleSlotsChanged}
              currentMonth={currentMonth}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCalendar;
