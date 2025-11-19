import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface SlotAssignmentModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSlotAssigned: () => void;
}

interface CalendarSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "open" | "blackout" | "booked";
  booked_by_order_id: string | null;
}

export const SlotAssignmentModal = ({
  orderId,
  isOpen,
  onClose,
  onSlotAssigned,
}: SlotAssignmentModalProps) => {
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableSlots();
    }
  }, [isOpen]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get available (open) slots for the next 90 days
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);

      const { data, error: fetchError } = await supabase
        .from("calendar_slots")
        .select("*")
        .eq("status", "open")
        .gte("date", new Date().toISOString().split("T")[0])
        .lte("date", futureDate.toISOString().split("T")[0])
        .order("date")
        .order("start_time");

      if (fetchError) throw fetchError;

      setSlots(data || []);
    } catch (err: any) {
      console.error("Error fetching slots:", err);
      setError(err.message || "Failed to load available slots");
      toast.error("Failed to load available slots");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSlot = async () => {
    if (!selectedSlot) {
      toast.error("Please select a slot");
      return;
    }

    try {
      setSaving(true);

      // Update the slot status to booked
      const { error: slotError } = await supabase
        .from("calendar_slots")
        .update({
          status: "booked",
          booked_by_order_id: orderId,
        })
        .eq("id", selectedSlot);

      if (slotError) throw slotError;

      // Update the order with the slot reference
      const { error: orderError } = await supabase
        .from("orders")
        .update({ calendar_slot_id: selectedSlot })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "slot_assignment",
          target_table: "orders",
          target_id: orderId,
          new_values: { calendar_slot_id: selectedSlot },
        });
      }

      toast.success("Calendar slot assigned successfully");
      onSlotAssigned();
      onClose();
    } catch (err: any) {
      console.error("Error assigning slot:", err);
      toast.error(err.message || "Failed to assign slot");
    } finally {
      setSaving(false);
    }
  };

  const groupedByDate = slots.reduce(
    (acc, slot) => {
      const date = slot.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    },
    {} as Record<string, CalendarSlot[]>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Calendar Slot</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#243E8F]/20 border-t-[#243E8F]"></div>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No available slots for the next 90 days</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {Object.entries(groupedByDate).map(([date, dateSlots]) => (
                <div key={date}>
                  <div className="font-semibold text-sm text-gray-700 mb-2">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="space-y-2 pl-4">
                    {dateSlots.map((slot) => (
                      <label
                        key={slot.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                          selectedSlot === slot.id
                            ? "border-[#243E8F] bg-[#243E8F]/10"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="slot"
                          value={slot.id}
                          checked={selectedSlot === slot.id}
                          onChange={(e) => setSelectedSlot(e.target.value)}
                          className="mr-3"
                        />
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssignSlot} disabled={!selectedSlot || saving}>
            {saving ? "Assigning..." : "Assign Slot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
