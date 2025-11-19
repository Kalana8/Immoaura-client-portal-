import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BulkActionsPanelProps {
  onActionComplete: () => void;
  currentMonth: Date;
}

// Generate 10 one-hour slots from 9 AM to 7 PM (09:00-19:00)
const SLOT_TIMES = Array.from({ length: 10 }, (_, i) => {
  const hour = 9 + i; // Start at 9 AM
  const startHour = String(hour).padStart(2, '0');
  const endHour = String(hour + 1).padStart(2, '0');
  return {
    start: `${startHour}:00`,
    end: `${endHour}:00`,
  };
});

export const BulkActionsPanel = ({
  onActionComplete,
  currentMonth,
}: BulkActionsPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [targetMonth, setTargetMonth] = useState<string>("current");

  const getMonthDate = (offset: number = 0) => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() + offset);
    return date;
  };

  const getMonthLabel = (offset: number) => {
    const date = getMonthDate(offset);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const repeatWeeklyPattern = async () => {
    try {
      setLoading(true);

      // Get all slots for the current month
      const month = getMonthDate(0);
      const nextMonth = new Date(month);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { data: currentSlots, error: fetchError } = await supabase
        .from("calendar_slots")
        .select("*")
        .gte("date", month.toISOString().split("T")[0])
        .lt("date", nextMonth.toISOString().split("T")[0]);

      if (fetchError) throw fetchError;

      if (!currentSlots || currentSlots.length === 0) {
        toast.error("No slots found in current month");
        return;
      }

      // Get the first week of the month to determine the pattern
      const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
      const firstSunday = new Date(firstDay);
      firstSunday.setDate(firstDay.getDate() - firstDay.getDay());

      // Create slots for the next 12 months by repeating the weekly pattern
      const newSlots = [];
      const copyMonth = getMonthDate(1);

      for (let i = 0; i < 52; i++) {
        // 52 weeks ahead
        const weekDate = new Date(firstSunday);
        weekDate.setDate(weekDate.getDate() + i * 7);

        // Skip if in the current month
        if (
          weekDate.getMonth() === month.getMonth() &&
          weekDate.getFullYear() === month.getFullYear()
        ) {
          continue;
        }

        // For each slot in the first week, create equivalent slots in future weeks
        const firstWeekSlots = currentSlots.filter((slot) => {
          const slotDate = new Date(slot.date);
          return (
            slotDate.getDay() === weekDate.getDay() &&
            slotDate >= firstDay &&
            slotDate < new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 1)
          );
        });

        for (const sourceSlot of firstWeekSlots) {
          const dateStr = weekDate.toISOString().split("T")[0];

          // Check if slot already exists
          const { data: existing } = await supabase
            .from("calendar_slots")
            .select("id")
            .eq("date", dateStr)
            .eq("start_time", sourceSlot.start_time)
            .single();

          if (!existing) {
            newSlots.push({
              date: dateStr,
              start_time: sourceSlot.start_time,
              end_time: sourceSlot.end_time,
              status: sourceSlot.status,
            });
          }
        }
      }

      if (newSlots.length > 0) {
        const { error: insertError } = await supabase
          .from("calendar_slots")
          .insert(newSlots);

        if (insertError) throw insertError;
      }

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "calendar_repeat_weekly",
          target_table: "calendar_slots",
          new_values: { slots_created: newSlots.length },
        });
      }

      toast.success(`Created ${newSlots.length} slots for upcoming months`);
      onActionComplete();
    } catch (err: any) {
      console.error("Error repeating weekly pattern:", err);
      toast.error("Failed to repeat weekly pattern");
    } finally {
      setLoading(false);
    }
  };

  const copyMonth = async () => {
    try {
      setLoading(true);

      const sourceMonth = getMonthDate(0);
      const destMonth = getMonthDate(parseInt(targetMonth) || 0);

      const sourceStart = sourceMonth.toISOString().split("T")[0];
      const sourceEnd = new Date(
        sourceMonth.getFullYear(),
        sourceMonth.getMonth() + 1,
        1
      )
        .toISOString()
        .split("T")[0];

      const { data: sourceSlots, error: fetchError } = await supabase
        .from("calendar_slots")
        .select("*")
        .gte("date", sourceStart)
        .lt("date", sourceEnd);

      if (fetchError) throw fetchError;

      if (!sourceSlots || sourceSlots.length === 0) {
        toast.error("No slots in source month");
        return;
      }

      const destStart = destMonth.toISOString().split("T")[0];
      const destEnd = new Date(destMonth.getFullYear(), destMonth.getMonth() + 1, 1)
        .toISOString()
        .split("T")[0];

      // Delete existing slots in destination month
      await supabase
        .from("calendar_slots")
        .delete()
        .gte("date", destStart)
        .lt("date", destEnd);

      // Copy slots to destination month
      const dayDiff = destMonth.getDate() - sourceMonth.getDate();
      const newSlots = sourceSlots.map((slot) => {
        const sourceDate = new Date(slot.date);
        const destDate = new Date(sourceDate);
        destDate.setMonth(destMonth.getMonth());
        destDate.setFullYear(destMonth.getFullYear());

        return {
          date: destDate.toISOString().split("T")[0],
          start_time: slot.start_time,
          end_time: slot.end_time,
          status: slot.status,
        };
      });

      const { error: insertError } = await supabase
        .from("calendar_slots")
        .insert(newSlots);

      if (insertError) throw insertError;

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "calendar_copy_month",
          target_table: "calendar_slots",
          new_values: {
            source: getMonthLabel(0),
            destination: getMonthLabel(parseInt(targetMonth) || 0),
          },
        });
      }

      toast.success("Month copied successfully");
      onActionComplete();
    } catch (err: any) {
      console.error("Error copying month:", err);
      toast.error("Failed to copy month");
    } finally {
      setLoading(false);
    }
  };

  const clearMonth = async () => {
    try {
      setLoading(true);

      const month = getMonthDate(0);
      const monthStart = month.toISOString().split("T")[0];
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1)
        .toISOString()
        .split("T")[0];

      const { error } = await supabase
        .from("calendar_slots")
        .delete()
        .gte("date", monthStart)
        .lt("date", monthEnd);

      if (error) throw error;

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "calendar_clear_month",
          target_table: "calendar_slots",
          new_values: { month: getMonthLabel(0) },
        });
      }

      toast.success("Month cleared successfully");
      onActionComplete();
    } catch (err: any) {
      console.error("Error clearing month:", err);
      toast.error("Failed to clear month");
    } finally {
      setLoading(false);
    }
  };

  const openAllDays = async () => {
    try {
      setLoading(true);

      const month = getMonthDate(0);
      // Use local date formatting to avoid timezone issues
      const year = month.getFullYear();
      const monthNum = month.getMonth();
      const monthStart = `${year}-${String(monthNum + 1).padStart(2, '0')}-01`;
      const nextMonth = monthNum === 11 ? 0 : monthNum + 1;
      const nextYear = monthNum === 11 ? year + 1 : year;
      const monthEnd = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`;

      // Get existing slots to avoid duplicates
      const { data: existingSlots, error: fetchError } = await supabase
        .from("calendar_slots")
        .select("date, start_time, end_time")
        .gte("date", monthStart)
        .lt("date", monthEnd);

      if (fetchError) {
        console.error("Error fetching existing slots:", fetchError);
        throw new Error(`Failed to fetch existing slots: ${fetchError.message}`);
      }

      const existingSet = new Set(
        (existingSlots || []).map((s) => `${s.date}_${s.start_time}_${s.end_time}`)
      );

      // Create open slots for every day in the month
      const newSlots = [];
      const lastDay = new Date(year, monthNum + 1, 0).getDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let day = 1; day <= lastDay; day++) {
        const date = new Date(year, monthNum, day);
        date.setHours(0, 0, 0, 0);
        
        // Skip past dates
        if (date < today) continue;

        // Format date as YYYY-MM-DD (local, not UTC)
        const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        SLOT_TIMES.forEach((time) => {
          const slotKey = `${dateStr}_${time.start}_${time.end}`;
          if (!existingSet.has(slotKey)) {
            newSlots.push({
              date: dateStr,
              start_time: time.start,
              end_time: time.end,
              status: "open",
            });
          }
        });
      }

      // Insert new slots in batches to avoid overwhelming the database
      // Handle duplicates gracefully by inserting one by one or in smaller batches
      let successCount = 0;
      let duplicateCount = 0;
      
      if (newSlots.length > 0) {
        const batchSize = 50; // Smaller batches to reduce duplicate conflicts
        
        for (let i = 0; i < newSlots.length; i += batchSize) {
          const batch = newSlots.slice(i, i + batchSize);
          
          // Try to insert the batch
          const { error: insertError } = await supabase
            .from("calendar_slots")
            .insert(batch);

          if (insertError) {
            // If duplicate error, try inserting individually to skip duplicates
            if (insertError.code === '23505' || insertError.message.includes('duplicate key')) {
              // Insert slots one by one to handle duplicates gracefully
              for (const slot of batch) {
                const { error: singleError } = await supabase
                  .from("calendar_slots")
                  .insert(slot);
                
                if (singleError) {
                  if (singleError.code === '23505' || singleError.message.includes('duplicate key')) {
                    duplicateCount++;
                    // Skip this duplicate, continue with next slot
                    continue;
                  } else {
                    console.error("Error inserting single slot:", singleError);
                    // Continue with other slots even if one fails
                  }
                } else {
                  successCount++;
                }
              }
            } else {
              console.error("Error inserting slots batch:", insertError);
              throw new Error(`Failed to create slots: ${insertError.message}`);
            }
          } else {
            successCount += batch.length;
          }
        }
        
        if (successCount === 0 && duplicateCount > 0) {
          // All slots were duplicates, which is fine - they already exist
          console.log(`All ${duplicateCount} slots already exist`);
        }
      }

      // Also update any existing blackout slots to open (but not booked ones)
      const { error: updateError } = await supabase
        .from("calendar_slots")
        .update({ status: "open" })
        .gte("date", monthStart)
        .lt("date", monthEnd)
        .eq("status", "blackout");

      if (updateError) {
        console.error("Error updating blackout slots:", updateError);
        // Don't throw here, just log - the new slots were created successfully
        console.warn("Some blackout slots could not be updated, but new slots were created");
      }

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "calendar_open_all_days",
          target_table: "calendar_slots",
          new_values: { month: getMonthLabel(0), slots_created: newSlots.length },
        });
      }

      // Count how many blackout slots were updated
      const blackoutSlots = (existingSlots || []).filter(s => {
        // We need to check the actual status, but we don't have it in existingSlots
        // So we'll just show the new slots count
        return s.date >= monthStart && s.date < monthEnd;
      }).length;
      
      const message = successCount > 0 
        ? `Opened all days in ${getMonthLabel(0)}. Created ${successCount} new slots${duplicateCount > 0 ? ` (${duplicateCount} already existed)` : ''}.`
        : duplicateCount > 0
        ? `All slots in ${getMonthLabel(0)} already exist. Updated blackout slots to open.`
        : `Opened all days in ${getMonthLabel(0)}.`;
      
      toast.success(message);
      onActionComplete();
    } catch (err: any) {
      console.error("Error opening all days:", err);
      const errorMessage = err?.message || err?.toString() || "Unknown error";
      toast.error(`Failed to open all days: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const blackoutAll = async () => {
    try {
      setLoading(true);

      const month = getMonthDate(0);
      const monthStart = month.toISOString().split("T")[0];
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1)
        .toISOString()
        .split("T")[0];

      // First, clear existing slots
      await supabase
        .from("calendar_slots")
        .delete()
        .gte("date", monthStart)
        .lt("date", monthEnd);

      // Create blackout slots for every day
      const newSlots = [];
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(month.getFullYear(), month.getMonth(), day);
        date.setHours(0, 0, 0, 0);
        
        // Skip past dates
        if (date < today) continue;

        const dateStr = date.toISOString().split("T")[0];

        SLOT_TIMES.forEach((time) => {
          newSlots.push({
            date: dateStr,
            start_time: time.start,
            end_time: time.end,
            status: "blackout",
          });
        });
      }

      if (newSlots.length > 0) {
        const { error } = await supabase
          .from("calendar_slots")
          .insert(newSlots);

        if (error) throw error;
      }

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "calendar_blackout_all",
          target_table: "calendar_slots",
          new_values: { month: getMonthLabel(0) },
        });
      }

      toast.success("Month blacked out successfully");
      onActionComplete();
    } catch (err: any) {
      console.error("Error blacking out month:", err);
      toast.error("Failed to blackout month");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Open All Days - NEW FEATURE */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-sm mb-2">Open All Days</h4>
          <p className="text-xs text-gray-600 mb-3">
            Mark all days in {getMonthLabel(0)} as open (creates slots for all future dates)
          </p>
          <Button
            onClick={openAllDays}
            disabled={loading}
            className="w-full bg-green-50 text-green-700 hover:bg-green-100 border border-green-300"
            variant="outline"
          >
            {loading ? "Processing..." : "Open All Days"}
          </Button>
        </div>

        {/* Repeat Weekly */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-sm mb-2">Repeat Weekly Pattern</h4>
          <p className="text-xs text-gray-600 mb-3">
            Apply the current month's weekly pattern to the next 12 months
          </p>
          <Button
            onClick={repeatWeeklyPattern}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? "Processing..." : "Repeat Weekly Pattern"}
          </Button>
        </div>

        {/* Copy Month */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-sm mb-2">Copy Month</h4>
          <p className="text-xs text-gray-600 mb-3">
            Copy slots from {getMonthLabel(0)} to another month
          </p>
          <div className="flex gap-2">
            <Select value={targetMonth} onValueChange={setTargetMonth}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((offset) => (
                  <SelectItem key={offset} value={offset.toString()}>
                    {getMonthLabel(offset)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={copyMonth}
              disabled={loading}
              variant="outline"
            >
              Copy
            </Button>
          </div>
        </div>

        {/* Clear Month */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-sm mb-2">Clear Month</h4>
          <p className="text-xs text-gray-600 mb-3">
            Remove all slots from {getMonthLabel(0)}
          </p>
          <Button
            onClick={clearMonth}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? "Processing..." : "Clear Month"}
          </Button>
        </div>

        {/* Blackout All */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Blackout All Days</h4>
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-[#243E8F] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600">
              Block all slots in {getMonthLabel(0)} as unavailable
            </p>
          </div>
          <Button
            onClick={blackoutAll}
            disabled={loading}
            className="w-full bg-red-50 text-red-700 hover:bg-red-100 border border-red-300"
            variant="outline"
          >
            {loading ? "Processing..." : "Blackout All Days"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
