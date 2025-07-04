
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabase } from '@/contexts/supabase-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  AlertTriangle, 
  X, 
  Star, 
  Phone, 
  Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { addDays, format } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type Status = 'Approval' | 'Objection' | 'Manual Handle' | 'Waiting' | 'Escalation' | 'Cancel' | 'Important' | 'Bookcall';
type Record = {
  id: string;
  created_at: string;
  permission: Status | null;
  escalation: boolean;
  cancel: boolean;
  important: boolean;
  bookcall: boolean;
};

const statusDetails: Record<string, { icon: React.ElementType; color: string }> = {
  Approval: { icon: CheckCircle2, color: 'text-chart-1' },
  Objection: { icon: XCircle, color: 'text-destructive' },
  'Manual Handle': { icon: MessageSquare, color: 'text-chart-2' },
  Escalation: { icon: AlertTriangle, color: 'text-chart-3' },
  Cancel: { icon: X, color: 'text-muted-foreground' },
  Important: { icon: Star, color: 'text-chart-4' },
  Bookcall: { icon: Phone, color: 'text-chart-5' },
  Waiting: { icon: Clock, color: 'text-muted-foreground' },
};


export default function DashboardPage() {
  const { supabase, credentials, isLoading: isSupabaseLoading } = useSupabase();
  const [data, setData] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(date?.from);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(date?.to);

  useEffect(() => {
    setTempStartDate(date?.from);
    setTempEndDate(date?.to);
  }, [date]);

  const handleApplyDateRange = () => {
    setDate({ from: tempStartDate, to: tempEndDate });
    setPopoverOpen(false);
  };

  const fetchData = useCallback(async () => {
    if (!supabase || !credentials?.table) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const query = supabase
      .from(credentials.table)
      .select('id, created_at, permission, escalation, cancel, important, bookcall');

    if (date?.from) {
      query.gte('created_at', date.from.toISOString());
    }
    if (date?.to) {
      // Add one day to 'to' date to include the whole day
      const toDate = new Date(date.to);
      toDate.setDate(toDate.getDate() + 1);
      query.lte('created_at', toDate.toISOString());
    }

    const { data: records, error } = await query;
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to fetch data',
        description: error.message || 'There was a problem connecting to your Supabase table. Please check your configuration.',
      });
    } else if (records) {
      setData(records as Record[]);
    }
    setIsLoading(false);
  }, [supabase, credentials, date, toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!supabase || !credentials?.table) return;

    const channel = supabase.channel(`realtime-dashboard`)
      .on('postgres_changes', { event: '*', schema: 'public', table: credentials.table }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, credentials?.table, fetchData]);
  
  const { liveStats } = useMemo(() => {
    const permissionCounts: Record<string, number> = { 'Approval': 0, 'Objection': 0, 'Manual Handle': 0 };
    const overallCounts: Record<string, number> = { 'Escalation': 0, 'Cancel': 0, 'Important': 0, 'Bookcall': 0 };
    let waitingCount = 0;

    data.forEach(item => {
      if (item.permission && permissionCounts.hasOwnProperty(item.permission)) {
        permissionCounts[item.permission]++;
      }
      if (item.permission === 'Waiting' || item.permission === null) {
        waitingCount++;
      }
      if (item.escalation) overallCounts['Escalation']++;
      if (item.cancel) overallCounts['Cancel']++;
      if (item.important) overallCounts['Important']++;
      if (item.bookcall) overallCounts['Bookcall']++;
    });

    const stats = {
      Approval: permissionCounts['Approval'],
      Objection: permissionCounts['Objection'],
      'Manual Handle': permissionCounts['Manual Handle'],
      Escalation: overallCounts['Escalation'],
      Cancel: overallCounts['Cancel'],
      Important: overallCounts['Important'],
      Bookcall: overallCounts['Bookcall'],
      Waiting: waitingCount,
    };

    return { liveStats: stats };
  }, [data]);

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
        <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            </CardContent>
        </Card>
    </div>
  );

  if (isSupabaseLoading) {
    return renderLoadingSkeleton();
  }

  if (!credentials) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
          <Card className="w-full max-w-md text-center p-6">
              <CardHeader>
                  <CardTitle className="text-2xl">Welcome to SendVision</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="mb-4">Please configure your Supabase connection to get started.</p>
                  <BarChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Click the profile icon in the top right to open settings.</p>
              </CardContent>
          </Card>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-semibold">Monitoring Dashboard</h1>
            <div className="ml-auto flex items-center gap-2">
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span>Custom Range</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4 space-y-3" align="end">
                        <div className="space-y-1">
                            <Label>Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-[240px] justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {tempStartDate ? format(tempStartDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={tempStartDate} onSelect={setTempStartDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1">
                            <Label>End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-[240px] justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {tempEndDate ? format(tempEndDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={tempEndDate} onSelect={setTempEndDate} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button onClick={handleApplyDateRange} className="w-full">Apply Custom Range</Button>
                    </PopoverContent>
                </Popover>
            </div>
        </div>

        <Card>
            <CardHeader><CardTitle>Live Statistics</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(liveStats).map(([status, count]) => {
                        const details = statusDetails[status];
                        const Icon = details?.icon;
                        return (
                            <div key={status} className="border rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-center bg-card shadow-sm">
                                {Icon && <Icon className={`h-8 w-8 ${details.color}`} />}
                                <span className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-10 mx-auto" /> : count}</span>
                                <span className="text-sm text-muted-foreground mt-1">{status}</span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
