"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSupabase } from '@/contexts/supabase-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { 
  Database,
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  AlertTriangle, 
  X, 
  Star, 
  Phone, 
  Clock,
  Send,
  MessageSquareReply,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { addDays, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { SupabaseRealtimePayload, SupabaseClient } from '@supabase/supabase-js';

type Status = 'Approval' | 'Objection' | 'Manual Handle' | 'Waiting' | 'Escalation' | 'Cancel' | 'Important' | 'Bookcall';
type Record = {
  id: string;
  created_at: string;
  permission: Status | null;
  escalation: boolean;
  important: boolean;
  bookcall: boolean;
  message_sent: boolean;
  replied: boolean;
  removed: boolean;
};

const statusDetails: Record<string, { icon: React.ElementType; color: string }> = {
  Total: { icon: Database, color: 'text-primary' },
  'Message Sent': { icon: Send, color: 'text-chart-3' },
  Approval: { icon: CheckCircle2, color: 'text-chart-1' },
  Objection: { icon: XCircle, color: 'text-destructive' },
  'Manual Handle': { icon: MessageSquare, color: 'text-chart-2' },
  Replied: { icon: MessageSquareReply, color: 'text-chart-1' },
  Escalation: { icon: AlertTriangle, color: 'text-chart-3' },
  Cancel: { icon: X, color: 'text-muted-foreground' },
  Important: { icon: Star, color: 'text-chart-4' },
  Bookcall: { icon: Phone, color: 'text-chart-5' },
  Waiting: { icon: Clock, color: 'text-muted-foreground' },
};

const chartConfig = {
  Approval: { label: 'Approval', color: 'hsl(var(--chart-1))' },
  Objection: { label: 'Objection', color: 'hsl(var(--destructive))' },
  'Manual Handle': { label: 'Manual Handle', color: 'hsl(var(--chart-2))' },
  Waiting: { label: 'Waiting', color: 'hsl(var(--muted-foreground))' },
  Escalation: { label: 'Escalation', color: 'hsl(var(--chart-3))' },
  Cancel: { label: 'Cancel', color: 'hsl(var(--muted-foreground))' },
  Important: { label: 'Important', color: 'hsl(var(--chart-4))' },
  Bookcall: { label: 'Bookcall', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;


export default function DashboardPage() {
  const { supabase, credentials, isLoading: isSupabaseLoading } = useSupabase();
  const [data, setData] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [timeRange, setTimeRange] = useState('24h');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isCustomPopoverOpen, setCustomPopoverOpen] = useState(false);
  
  const [realtime, setRealtime] = useState(true);
  const realtimeChannel = useRef<ReturnType<SupabaseClient['channel']> | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase || !credentials?.table) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    let query = supabase
      .from(credentials.table)
      .select('id, created_at, permission, escalation, important, bookcall, message_sent, replied, removed')
      .or('removed.is.null,removed.eq.false');

    if (timeRange === 'custom' && startDate) {
        const from = startDate;
        const to = endDate ? endDate : from;
        const toEndOfDay = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
  
        query = query.gte('created_at', from.toISOString()).lte('created_at', toEndOfDay.toISOString());
    } else if (timeRange !== 'custom') {
        const toDate = new Date();
        let fromDate;
        switch (timeRange) {
          case '24h': fromDate = addDays(toDate, -1); break;
          case '7d': fromDate = addDays(toDate, -7); break;
          case '30d': fromDate = addDays(toDate, -30); break;
          case '90d': fromDate = addDays(toDate, -90); break;
          default: fromDate = addDays(toDate, -1);
        }
        query = query.gte('created_at', fromDate.toISOString());
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
  }, [supabase, credentials, timeRange, startDate, endDate, toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRealtimeUpdate = useCallback((payload: SupabaseRealtimePayload<any>) => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (realtime && supabase && credentials?.table) {
      if (!realtimeChannel.current) {
        realtimeChannel.current = supabase
          .channel('realtime-dashboard')
          .on('postgres_changes', { event: '*', schema: 'public', table: credentials.table }, handleRealtimeUpdate)
          .subscribe();
      }
    } else {
      if (realtimeChannel.current && supabase) {
        supabase.removeChannel(realtimeChannel.current);
        realtimeChannel.current = null;
      }
    }
    return () => {
      if (realtimeChannel.current && supabase) {
        supabase.removeChannel(realtimeChannel.current);
        realtimeChannel.current = null;
      }
    };
  }, [realtime, supabase, credentials, handleRealtimeUpdate]);

  const handleApplyCustomRange = () => {
    if (startDate) {
        setTimeRange('custom');
        setCustomPopoverOpen(false);
    } else {
        toast({
            variant: "destructive",
            title: "Start date required",
            description: "Please select a start date for the custom range.",
        });
    }
  };
  
  const { liveStats, permissionChartData, overallChartData } = useMemo(() => {
    const stats: Record<Status | 'Total' | 'Replied' | 'Message Sent', number> = {
      Total: data.length,
      'Message Sent': 0,
      Approval: 0,
      Objection: 0,
      'Manual Handle': 0,
      Waiting: 0,
      Escalation: 0,
      Important: 0,
      Bookcall: 0,
      Cancel: 0,
      Replied: 0,
    };

    data.forEach(item => {
      if (item.message_sent) stats['Message Sent']++;
      if (item.replied) stats.Replied++;
      
      if (item.permission === null || item.permission === 'Waiting') {
        stats.Waiting++;
      } else if (item.permission && stats.hasOwnProperty(item.permission)) {
        const key = item.permission as keyof typeof stats;
        (stats[key] as number)++;
      }
      
      if (item.escalation) stats.Escalation++;
      if (item.important) stats.Important++;
      if (item.bookcall) stats.Bookcall++;
    });
    
    const pChartData = Object.entries({
      Approval: stats.Approval,
      Objection: stats.Objection,
      'Manual Handle': stats['Manual Handle'],
    })
    .map(([name, value]) => ({ name, value, fill: chartConfig[name as keyof typeof chartConfig]?.color }))
    .filter(item => item.value > 0);

    const oChartData = Object.entries({
      Escalation: stats.Escalation,
      Important: stats.Important,
      Bookcall: stats.Bookcall,
    })
    .map(([name, value]) => ({ name, value, fill: chartConfig[name as keyof typeof chartConfig]?.color }))
    .filter(item => item.value > 0);

    return { liveStats: stats, permissionChartData: pChartData, overallChartData: oChartData };
  }, [data]);

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
        <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 11 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[350px] w-full" />
            <Skeleton className="h-[350px] w-full" />
        </div>
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
                  <CardTitle className="text-2xl">Neswave</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="mb-4">Please configure your Supabase connection to get started.</p>
                  <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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
                <Select value={timeRange === 'custom' ? '' : timeRange} onValueChange={(value) => {
                    if (value) {
                      setTimeRange(value);
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }
                }}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a time range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="24h">Last 24 hours</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
                <Popover open={isCustomPopoverOpen} onOpenChange={setCustomPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Custom Range</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="start-date" variant={"outline"} className="w-[260px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "MM/dd/yyyy") : <span>mm/dd/yyyy</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="end-date" variant={"outline"} className="w-[260px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "MM/dd/yyyy") : <span>mm/dd/yyyy</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={{ before: startDate }} initialFocus />
                            </PopoverContent>
                        </Popover>
                      </div>
                      <Button onClick={handleApplyCustomRange}>Apply Custom Range</Button>
                    </div>
                  </PopoverContent>
                </Popover>
            </div>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Live Statistics</CardTitle>
              <div className="flex items-center space-x-2">
                  <Switch id="realtime-switch" checked={realtime} onCheckedChange={setRealtime} />
                  <Label htmlFor="realtime-switch">Real-time</Label>
              </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pt-4">
                    {Object.entries(liveStats).map(([status, count]) => {
                        const details = statusDetails[status];
                        const Icon = details?.icon;
                        if (!Icon) return null; // Don't render if no icon details
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Permission Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-[250px] w-full" /> : 
                    permissionChartData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie data={permissionChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = 25 + innerRadius + (outerRadius - innerRadius);
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    return <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-xs fill-foreground">{value}</text>
                                }}/>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] text-muted-foreground">No data for this period.</div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Overall Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-[250px] w-full" /> : 
                    overallChartData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie data={overallChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = 25 + innerRadius + (outerRadius - innerRadius);
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    return <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-xs fill-foreground">{value}</text>
                                }}/>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] text-muted-foreground">No data for this period.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
