import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, RotateCw, X, CheckCircle2, XCircle, Ban } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "open" | "blackout" | "booked";
  booked_by_order_id: string | null;
}

interface CalendarGridProps {
  onSlotsChanged: () => void;
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

export const CalendarGrid = ({ onSlotsChanged }: CalendarGridProps) => {
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSlots(false);

    const subscription = supabase
      .channel("admin_calendar_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calendar_slots",
        },
        () => {
          fetchSlots();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSlots = async (isRefresh: boolean = true) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const start = new Date();
      const end = new Date(start.getFullYear(), start.getMonth() + 12, 1);

      const { data, error } = await supabase
        .from("calendar_slots")
        .select("*")
        .gte("date", start.toISOString().split("T")[0])
        .lt("date", end.toISOString().split("T")[0])
        .order("date")
        .order("start_time");

      if (error) throw error;
      setSlots(data || []);

      // Extract available dates
      const dates = new Set<string>();
      (data || []).forEach((slot: CalendarSlot) => {
        dates.add(slot.date);
      });
      setAvailableDates(dates);
    } catch (err: any) {
      console.error("Error fetching slots:", err);
      toast.error("Failed to load calendar");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const getSlotsForDate = (date: Date | undefined): CalendarSlot[] => {
    if (!date) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return slots.filter((slot) => slot.date === dateStr);
  };

  const getSlotStatus = (date: Date | undefined): "open" | "blackout" | "booked" | "none" => {
    if (!date) return "none";
    const dateSlots = getSlotsForDate(date);
    if (dateSlots.length === 0) return "none";
    if (dateSlots.some((s) => s.status === "booked")) return "booked";
    if (dateSlots.some((s) => s.status === "blackout")) return "blackout";
    return "open";
  };

  // Get detailed status for a date (for styling)
  const getDateStatus = (date: Date): "all-booked" | "partially-booked" | "all-open" | "all-blackout" | "none" => {
    const dateSlots = getSlotsForDate(date);
    if (dateSlots.length === 0) return "none";
    
    const bookedCount = dateSlots.filter(s => s.status === "booked").length;
    const blackoutCount = dateSlots.filter(s => s.status === "blackout").length;
    const openCount = dateSlots.filter(s => s.status === "open").length;
    
    if (bookedCount === dateSlots.length) return "all-booked";
    if (bookedCount > 0) return "partially-booked";
    if (blackoutCount === dateSlots.length) return "all-blackout";
    if (openCount === dateSlots.length) return "all-open";
    return "all-open"; // default
  };

  // Check if date has booked slots
  const hasBookedSlots = (date: Date): boolean => {
    const dateSlots = getSlotsForDate(date);
    return dateSlots.some(s => s.status === "booked");
  };

  // Check if date has all open slots
  const hasAllOpenSlots = (date: Date): boolean => {
    const dateSlots = getSlotsForDate(date);
    return dateSlots.length > 0 && dateSlots.every(s => s.status === "open");
  };

  // Check if date has blackout slots
  const hasBlackoutSlots = (date: Date): boolean => {
    const dateSlots = getSlotsForDate(date);
    return dateSlots.some(s => s.status === "blackout");
  };

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableDates.has(dateStr);
  };

  const isDateDisabled = (date: Date): boolean => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const isPast = date < new Date();
    if (isPast) {
      toast.error("Cannot manage past dates");
      return;
    }
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  const toggleSlotStatus = async (slotId: string, currentStatus: string) => {
    try {
      if (currentStatus === "booked") {
        toast.error("Cannot modify booked slots");
        return;
      }

      const newStatus = currentStatus === "open" ? "blackout" : "open";

      const { error } = await supabase
        .from("calendar_slots")
        .update({ status: newStatus })
        .eq("id", slotId);

      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "calendar_slot_toggle",
          target_table: "calendar_slots",
          target_id: slotId,
          new_values: { status: newStatus },
        });
      }

      toast.success(`Slot ${newStatus === "open" ? "opened" : "blocked"}`);
      fetchSlots();
      onSlotsChanged();
    } catch (err: any) {
      console.error("Error toggling slot:", err);
      toast.error("Failed to update slot");
    }
  };

  const createSlotsForDate = async (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dateSlots = getSlotsForDate(date);

      if (dateSlots.length > 0) {
        toast.info("Slots already exist for this date");
        return;
      }

      const newSlots = SLOT_TIMES.map((time) => ({
        date: dateStr,
        start_time: time.start,
        end_time: time.end,
        status: "open" as const,
      }));

      const { error } = await supabase
        .from("calendar_slots")
        .insert(newSlots);

      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "calendar_slots_create",
          target_table: "calendar_slots",
          new_values: { date: dateStr, slots_created: newSlots.length },
        });
      }

      toast.success(`Created ${newSlots.length} slots for ${format(date, 'EEEE, MMMM d, yyyy')}`);
      fetchSlots();
      onSlotsChanged();
    } catch (err: any) {
      console.error("Error creating slots:", err);
      toast.error("Failed to create slots");
    }
  };

  const toggleAllSlotsForDate = async (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dateSlots = getSlotsForDate(date);
      const status = getSlotStatus(date);

      if (status === "booked") {
        toast.error("Cannot modify booked dates");
        return;
      }

      if (dateSlots.length === 0) {
        await createSlotsForDate(date);
        return;
      }

      const newStatus = status === "open" ? "blackout" : "open";

      const { error } = await supabase
        .from("calendar_slots")
        .update({ status: newStatus })
        .eq("date", dateStr)
        .neq("status", "booked");

      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "calendar_date_toggle",
          target_table: "calendar_slots",
          new_values: { date: dateStr, status: newStatus },
        });
      }

      toast.success(`All slots ${newStatus === "open" ? "opened" : "blocked"}`);
      fetchSlots();
      onSlotsChanged();
    } catch (err: any) {
      console.error("Error toggling date:", err);
      toast.error("Failed to update date");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#243E8F]/20 border-t-[#243E8F]"></div>
      </div>
    );
  }

  const dateSlots = getSlotsForDate(selectedDate);
  const status = getSlotStatus(selectedDate);
  const hasSlots = dateSlots.length > 0;

  return (
    <div className="space-y-6">
      <style>{`
        /* Booked dates - Yellow/Orange background (highest priority for visibility) */
        .rdp-day-booked:not(.rdp-day_selected) {
          background-color: rgb(234 179 8) !important;
          color: rgb(0 0 0) !important;
          font-weight: 600 !important;
          border: 2px solid rgb(202 138 4) !important;
        }
        .rdp-day-booked.rdp-day_today:not(.rdp-day_selected) {
          background-color: rgb(234 179 8) !important;
          color: rgb(0 0 0) !important;
          font-weight: 700 !important;
          border: 2px solid rgb(202 138 4) !important;
          box-shadow: 0 0 0 2px rgb(59 130 246);
        }
        .rdp-day-booked:hover:not(.rdp-day_selected) {
          background-color: rgb(202 138 4) !important;
          color: rgb(0 0 0) !important;
        }
        
        /* All open dates - Green background */
        .rdp-day-all-open:not(.rdp-day_selected):not(.rdp-day-booked) {
          background-color: rgb(34 197 94) !important;
          color: rgb(255 255 255) !important;
          font-weight: 500 !important;
        }
        .rdp-day-all-open.rdp-day_today:not(.rdp-day_selected):not(.rdp-day-booked) {
          background-color: rgb(34 197 94) !important;
          color: rgb(255 255 255) !important;
          font-weight: 600 !important;
          box-shadow: 0 0 0 2px rgb(59 130 246);
        }
        .rdp-day-all-open:hover:not(.rdp-day_selected):not(.rdp-day-booked) {
          background-color: rgb(22 163 74) !important;
          color: rgb(255 255 255) !important;
        }
        
        /* Blackout dates - Red background */
        .rdp-day-blackout:not(.rdp-day_selected):not(.rdp-day-booked) {
          background-color: rgb(239 68 68) !important;
          color: rgb(255 255 255) !important;
          font-weight: 500 !important;
        }
        .rdp-day-blackout.rdp-day_today:not(.rdp-day_selected):not(.rdp-day-booked) {
          background-color: rgb(239 68 68) !important;
          color: rgb(255 255 255) !important;
          font-weight: 600 !important;
          box-shadow: 0 0 0 2px rgb(59 130 246);
        }
        .rdp-day-blackout:hover:not(.rdp-day_selected):not(.rdp-day-booked) {
          background-color: rgb(220 38 38) !important;
          color: rgb(255 255 255) !important;
        }
        
        /* Today's date - Blue (when no slots or mixed status) */
        .rdp-day_today:not(.rdp-day-booked):not(.rdp-day-all-open):not(.rdp-day-blackout):not(.rdp-day_selected) {
          background-color: rgb(59 130 246) !important;
          color: rgb(255 255 255) !important;
          font-weight: 600 !important;
        }
        
        /* Selected date always shows dark blue */
        .rdp-day_selected {
          background-color: rgb(36 62 143) !important;
          color: rgb(255 255 255) !important;
          font-weight: 600 !important;
        }
      `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Calendar Management</h3>
          <p className="text-muted-foreground mt-1">
            Manage availability for Property Video services. Create slots, set availability, and manage bookings.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchSlots()}
          disabled={refreshing}
          className="h-10 w-10 p-0"
          title="Refresh calendar"
        >
          <RotateCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Date Selection and Calendar */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="date-input" className="text-sm font-semibold mb-2 block">
              Select Date
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date-input"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "EEEE, MMMM d, yyyy")
                  ) : (
                    <span>Select a date to manage</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  initialFocus
                  modifiers={{
                    booked: (date) => hasBookedSlots(date),
                    allOpen: (date) => hasAllOpenSlots(date),
                    blackout: (date) => hasBlackoutSlots(date) && !hasBookedSlots(date),
                  }}
                  modifiersClassNames={{
                    booked: "rdp-day-booked",
                    allOpen: "rdp-day-all-open",
                    blackout: "rdp-day-blackout",
                  }}
                  components={{
                    Caption: ({ displayMonth }) => {
                      const months = Array.from({ length: 12 }, (_, i) => {
                        const date = new Date(displayMonth.getFullYear(), i, 1);
                        return format(date, "MMM");
                      });
                      const years = Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 1 + i;
                        return year;
                      });

                      return (
                        <div className="flex justify-center items-center gap-2 py-1 px-3">
                          <Select
                            value={displayMonth.getMonth().toString()}
                            onValueChange={(value) => {
                              const newDate = new Date(displayMonth);
                              newDate.setMonth(parseInt(value));
                              setCurrentMonth(newDate);
                            }}
                          >
                            <SelectTrigger className="h-7 w-20 text-xs border-0 shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month, idx) => (
                                <SelectItem key={idx} value={idx.toString()}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={displayMonth.getFullYear().toString()}
                            onValueChange={(value) => {
                              const newDate = new Date(displayMonth);
                              newDate.setFullYear(parseInt(value));
                              setCurrentMonth(newDate);
                            }}
                          >
                            <SelectTrigger className="h-7 w-20 text-xs border-0 shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    },
                  }}
                  classNames={{
                    months: "flex flex-col space-y-4",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "hidden",
                    nav: "space-x-1 flex items-center",
                    nav_button: cn(
                      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground"
                    ),
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: cn(
                      "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground"
                    ),
                    day_selected: "bg-[#243E8F] text-white hover:bg-[#1E3268] hover:text-white focus:bg-[#243E8F] focus:text-white ring-2 ring-[#243E8F] ring-offset-2",
                    day_today: "!bg-blue-500 !text-white font-semibold hover:!bg-blue-600 hover:!text-white focus:!bg-blue-500 focus:!text-white aria-selected:!bg-[#243E8F] aria-selected:!text-white",
                    day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                    day_outside: "day-outside text-muted-foreground opacity-50",
                  }}
                />
                <div className="p-3 border-t space-y-2">
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-yellow-500 border border-yellow-600"></div>
                      <span className="text-muted-foreground">Booked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-green-500 border border-green-600"></div>
                      <span className="text-muted-foreground">Open</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-red-500 border border-red-600"></div>
                      <span className="text-muted-foreground">Blackout</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-blue-500 border border-blue-600"></div>
                      <span className="text-muted-foreground">Today</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {availableDates.size > 0 ? `${availableDates.size} dates with slots` : "No slots created yet"}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Calendar Widget */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>View and select dates to manage</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border-0"
                modifiers={{
                  booked: (date) => hasBookedSlots(date),
                  allOpen: (date) => hasAllOpenSlots(date),
                  blackout: (date) => hasBlackoutSlots(date) && !hasBookedSlots(date),
                }}
                modifiersClassNames={{
                  booked: "rdp-day-booked",
                  allOpen: "rdp-day-all-open",
                  blackout: "rdp-day-blackout",
                }}
                components={{
                  Caption: ({ displayMonth }) => {
                    const months = Array.from({ length: 12 }, (_, i) => {
                      const date = new Date(displayMonth.getFullYear(), i, 1);
                      return format(date, "MMM");
                    });
                    const years = Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 1 + i;
                      return year;
                    });

                    return (
                      <div className="flex justify-center items-center gap-2 py-1 px-3">
                        <Select
                          value={displayMonth.getMonth().toString()}
                          onValueChange={(value) => {
                            const newDate = new Date(displayMonth);
                            newDate.setMonth(parseInt(value));
                            setCurrentMonth(newDate);
                          }}
                        >
                          <SelectTrigger className="h-7 w-20 text-xs border-0 shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month, idx) => (
                              <SelectItem key={idx} value={idx.toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={displayMonth.getFullYear().toString()}
                          onValueChange={(value) => {
                            const newDate = new Date(displayMonth);
                            newDate.setFullYear(parseInt(value));
                            setCurrentMonth(newDate);
                          }}
                        >
                          <SelectTrigger className="h-7 w-20 text-xs border-0 shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  },
                }}
                classNames={{
                  months: "flex flex-col space-y-4",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "hidden",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground"
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground"
                  ),
                  day_selected: "bg-[#243E8F] text-white hover:bg-[#1E3268] hover:text-white focus:bg-[#243E8F] focus:text-white ring-2 ring-[#243E8F] ring-offset-2",
                  day_today: "!bg-blue-500 !text-white font-semibold hover:!bg-blue-600 hover:!text-white focus:!bg-blue-500 focus:!text-white aria-selected:!bg-[#243E8F] aria-selected:!text-white",
                  day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                  day_outside: "day-outside text-muted-foreground opacity-50",
                }}
              />
              <div className="mt-2 pt-2 border-t space-y-2">
                <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-yellow-500 border border-yellow-600"></div>
                    <span className="text-muted-foreground">Booked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-500 border border-green-600"></div>
                    <span className="text-muted-foreground">Open</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-500 border border-red-600"></div>
                    <span className="text-muted-foreground">Blackout</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-500 border border-blue-600"></div>
                    <span className="text-muted-foreground">Today</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {availableDates.size > 0 ? `${availableDates.size} dates with slots` : "No slots created yet"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Slot Management Panel */}
        <div className="space-y-4">
          {selectedDate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{format(selectedDate, "EEEE, MMMM d, yyyy")}</CardTitle>
                    <CardDescription>
                      Manage time slots for this date
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(undefined)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Summary */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground capitalize">{status}</p>
                  </div>
                  {status === "open" && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {status === "blackout" && (
                    <Ban className="h-5 w-5 text-red-600" />
                  )}
                  {status === "booked" && (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                  {status === "none" && (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Quick Actions */}
                {!hasSlots ? (
                  <Button
                    onClick={() => createSlotsForDate(selectedDate)}
                    className="w-full"
                    variant="default"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Create 10 Time Slots (09:00-19:00)
                  </Button>
                ) : (
                  <Button
                    onClick={() => toggleAllSlotsForDate(selectedDate)}
                    disabled={status === "booked"}
                    variant={status === "open" ? "destructive" : "default"}
                    className="w-full"
                  >
                    {status === "open" ? (
                      <>
                        <Ban className="mr-2 h-4 w-4" />
                        Block All Slots
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Open All Slots
                      </>
                    )}
                  </Button>
                )}

                {/* Time Slots List */}
                {hasSlots && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Time Slots</Label>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {dateSlots
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .map((slot) => (
                          <div
                            key={slot.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              slot.status === "open" && "bg-green-50 border-green-200",
                              slot.status === "blackout" && "bg-red-50 border-red-200",
                              slot.status === "booked" && "bg-yellow-50 border-yellow-200"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {slot.status}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSlotStatus(slot.id, slot.status)}
                              disabled={slot.status === "booked"}
                              className="h-8 w-8 p-0"
                            >
                              {slot.status === "open" ? (
                                <Ban className="h-4 w-4 text-red-600" />
                              ) : slot.status === "blackout" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-600" />
                              )}
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Date Management</CardTitle>
                <CardDescription>Select a date to manage time slots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a date from the calendar to manage slots</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
