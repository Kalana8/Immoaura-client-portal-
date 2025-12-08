import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, RotateCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parse } from "date-fns";
import { nl, enUS, de, fr, type Locale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { OrderData } from "@/types/order";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

interface AgendaSelectionProps {
  orderData: OrderData;
  setOrderData: (data: OrderData) => void;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  service_type: string;
  is_available: boolean;
  capacity: number;
  booked_count: number;
}

// Helper: Format date string WITHOUT any timezone conversion
const formatDateSafely = (dateStr: string, pattern: string = "EEEE, d MMMM yyyy", locale: Locale = enUS) => {
  try {
    const datePart = dateStr.split('T')[0];
    const [yearStr, monthStr, dayStr] = datePart.split('-');

    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    const date = new Date(year, month - 1, day);
    return format(date, pattern, { locale });
  } catch (err) {
    console.error("Error formatting date:", err);
    return dateStr;
  }
};

// Helper: Format time safely
const formatTimeSafely = (timeStr: string) => {
  try {
    return timeStr.substring(0, 5);
  } catch (err) {
    return timeStr;
  }
};

// Get locale based on language
const getLocale = (language: string) => {
  switch (language) {
    case 'NL': return nl;
    case 'DE': return de;
    case 'FR': return fr;
    default: return enUS;
  }
};

export const AgendaSelection = ({ orderData, setOrderData }: AgendaSelectionProps) => {
  const { language } = useLanguage();
  const locale = getLocale(language);
  const trans = translations[language]?.wizard?.agendaSelection || translations.EN.wizard.agendaSelection;
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const fetchSlots = async () => {
    try {
      setRefreshing(true);

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayLocal = `${year}-${month}-${day}`;

      const { data, error } = await supabase
        .from("calendar_slots")
        .select("*")
        .eq("status", "open")
        .gte("date", todayLocal)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        const transformedSlots = data.map((slot: any) => ({
          id: slot.id,
          start_time: `${slot.date}T${slot.start_time}`,
          end_time: `${slot.date}T${slot.end_time}`,
          service_type: "Property Video",
          is_available: slot.status === "open" && !slot.booked_by_order_id,
          capacity: 1,
          booked_count: slot.booked_by_order_id ? 1 : 0,
        }));

        setSlots(transformedSlots);

        // Extract unique dates
        const dates = new Set<string>();
        transformedSlots.forEach((slot: TimeSlot) => {
          const datePart = slot.start_time.split('T')[0];
          dates.add(datePart);
        });
        setAvailableDates(dates);
      } else {
        setSlots([]);
        setAvailableDates(new Set());
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
      setAvailableDates(new Set());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (orderData.services.includes("Property Video")) {
      setLoading(true);
      fetchSlots().then(() => setLoading(false));

      const subscription = supabase
        .channel("calendar_slots_changes")
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
    } else {
      setLoading(false);
    }
  }, [orderData.services]);

  // Get available times for selected date
  const getAvailableTimesForDate = (date: Date | undefined): TimeSlot[] => {
    if (!date) return [];

    const dateStr = format(date, 'yyyy-MM-dd');
    return slots.filter(slot => {
      const slotDate = slot.start_time.split('T')[0];
      return slotDate === dateStr && slot.is_available;
    });
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setCalendarOpen(false);

    // Clear selected time slot when date changes
    if (date) {
      const times = getAvailableTimesForDate(date);
      if (times.length > 0) {
        // Auto-select first available time
        setOrderData({ ...orderData, agendaSlot: times[0].start_time });
      } else {
        setOrderData({ ...orderData, agendaSlot: null });
      }
    } else {
      setOrderData({ ...orderData, agendaSlot: null });
    }
  };

  // Handle time selection
  const handleTimeSelect = (timeSlot: string) => {
    setOrderData({ ...orderData, agendaSlot: timeSlot });
  };

  // Check if date has available slots
  const isDateAvailable = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableDates.has(dateStr);
  };

  // Disable dates that don't have available slots
  const isDateDisabled = (date: Date): boolean => {
    return !isDateAvailable(date);
  };

  // Get currently selected date from agendaSlot
  useEffect(() => {
    if (orderData.agendaSlot) {
      const datePart = orderData.agendaSlot.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
  }, [orderData.agendaSlot]);

  if (!orderData.services.includes("Property Video")) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {trans.noSchedulingNeeded}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#243E8F] border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">{trans.loadingSlots}</p>
      </div>
    );
  }

  const availableTimes = getAvailableTimesForDate(selectedDate);
  const selectedTimeSlot = orderData.agendaSlot;

  return (
    <div className="space-y-6 py-4">
      <style>{`
        .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
          background-color: rgb(34 197 94) !important;
          color: white !important;
        }
        .rdp-day:focus:not(.rdp-day_disabled):not(.rdp-day_selected) {
          background-color: rgb(34 197 94) !important;
          color: white !important;
        }
        .rdp-day_today:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
          background-color: rgb(34 197 94) !important;
          color: white !important;
        }
        .rdp-day_today:focus:not(.rdp-day_disabled):not(.rdp-day_selected) {
          background-color: rgb(34 197 94) !important;
          color: white !important;
        }
        button.rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
          background-color: rgb(34 197 94) !important;
          color: white !important;
        }
        button.rdp-day:focus:not(.rdp-day_disabled):not(.rdp-day_selected) {
          background-color: rgb(34 197 94) !important;
          color: white !important;
        }
      `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">{trans.title}</h2>
          <p className="text-muted-foreground">
            {trans.subtitle}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchSlots()}
          disabled={refreshing}
          className="h-10 w-10 p-0"
          title={trans.refreshSlots}
        >
          <RotateCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {slots.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">{trans.noSlotsAvailable}</p>
          <p className="text-sm text-muted-foreground">
            {trans.contactToSchedule}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Date and Time Selection */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Day Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="date-input" className="text-sm font-semibold mb-2 block">
                  {trans.day}
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
                        formatDateSafely(format(selectedDate, 'yyyy-MM-dd'), "EEEE, d MMMM yyyy", locale)
                      ) : (
                        <span>{trans.selectDate}</span>
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
                      locale={locale}
                      components={{
                        Caption: ({ displayMonth }) => {
                          const months = Array.from({ length: 12 }, (_, i) => {
                            const date = new Date(displayMonth.getFullYear(), i, 1);
                            return format(date, "MMM", { locale });
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
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: cn(
                          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:!bg-green-500 hover:!text-white focus:!bg-green-500 focus:!text-white focus:ring-green-500 focus:ring-offset-0 focus-visible:!bg-green-500 focus-visible:!text-white focus-visible:ring-green-500 aria-selected:!bg-green-500 aria-selected:!text-white"
                        ),
                        day_selected: "!bg-green-500 !text-white hover:!bg-green-600 hover:!text-white focus:!bg-green-500 focus:!text-white",
                        day_today: "!bg-blue-500 !text-white font-semibold hover:!bg-blue-600 hover:!text-white focus:!bg-blue-500 focus:!text-white aria-selected:!bg-green-500 aria-selected:!text-white",
                        day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                        day_outside: "day-outside text-muted-foreground opacity-50",
                      }}
                    />
                    <div className="p-3 border-t">
                      <p className="text-xs text-muted-foreground text-center">{trans.availableDays}</p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div>
                <Label htmlFor="time-select" className="text-sm font-semibold mb-2 block">
                  {trans.time}
                </Label>
                <Select
                  value={selectedTimeSlot || ""}
                  onValueChange={handleTimeSelect}
                  disabled={!selectedDate || availableTimes.length === 0}
                >
                  <SelectTrigger id="time-select" className="w-full">
                    <SelectValue placeholder={trans.chooseTime}>
                      {selectedTimeSlot ? (
                        <span>
                          {formatTimeSafely(selectedTimeSlot.split('T')[1])} - {formatTimeSafely(
                            slots.find(s => s.start_time === selectedTimeSlot)?.end_time.split('T')[1] || ''
                          )}
                        </span>
                      ) : (
                        trans.chooseTime
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {trans.noTimesAvailable}
                      </SelectItem>
                    ) : (
                      availableTimes.map((slot) => (
                        <SelectItem key={slot.id} value={slot.start_time}>
                          {formatTimeSafely(slot.start_time.split('T')[1])} - {formatTimeSafely(slot.end_time.split('T')[1])}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calendar Widget */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold mb-2 block">
                {trans.calendar}
              </Label>
              <Card className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  locale={locale}
                  className="rounded-md border-0"
                  components={{
                    Caption: ({ displayMonth }) => {
                      const months = Array.from({ length: 12 }, (_, i) => {
                        const date = new Date(displayMonth.getFullYear(), i, 1);
                        return format(date, "MMM", { locale });
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
                    day_selected: "!bg-green-500 !text-white hover:!bg-green-600 hover:!text-white focus:!bg-green-500 focus:!text-white",
                    day_today: "!bg-blue-500 !text-white font-semibold hover:!bg-blue-600 hover:!text-white focus:!bg-blue-500 focus:!text-white aria-selected:!bg-green-500 aria-selected:!text-white",
                    day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                    day_outside: "day-outside text-muted-foreground opacity-50",
                  }}
                />
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground text-center">{trans.availableDays}</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
