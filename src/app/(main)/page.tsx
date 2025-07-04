"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '@/contexts/supabase-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { addDays, format } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { Skeleton } from '@/components/ui/skeleton';

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

const permissionStatusColors = {
  'Approval': 'hsl(var(--chart-1))',
  'Objection': 'hsl(var(--destructive))',
  'Manual Handle': 'hsl(var(--chart-2))',
};

const overallStatusColors = {
  'Approval': 'hsl(var(--chart-1))',
  'Objection': 'hsl(var(--destructive))',
  'Manual Handle': 'hsl(var(--chart-2))',
  'Escalation': 'hsl(var(--chart-3))',
  'Cancel': 'hsl(var(--muted-foreground))',
  'Important': 'hsl(var(--chart-4))',
  'Bookcall': 'hsl(var(--chart-5))',
};

export default function DashboardPage() {
  const { supabase, credentials, isLoading: isSupabaseLoading } = useSupabase();
  const [data, setData] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtime, setIsRealtime] = useState(true);
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [preset, setPreset] = useState<string>("7");

  const fetchData = async () => {
    if (!supabase || !credentials?.table) return;
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
      console.error("Error fetching data:", error);
    } else if (records) {
      setData(records as Record[]);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchData();
  }, [supabase, credentials?.table, date]);

  useEffect(() => {
    if (!supabase || !credentials?.table || !isRealtime) return;

    const channel = supabase.channel(`realtime-dashboard`)
      .on('postgres_changes', { event: '*', schema: 'public', table: credentials.table }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, credentials?.table, isRealtime, date]);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const now = new Date();
    if (value === "custom") return;
    const days = parseInt(value);
    setDate({ from: addDays(now, -days), to: now });
  };
  
  const { permissionStatusData, overallStatusData, liveStats } = useMemo(() => {
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

    const permissionChartData = Object.entries(permissionCounts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
    const overallChartData = [...permissionChartData, ...Object.entries(overallCounts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0)];

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

    return { permissionStatusData: permissionChartData, overallStatusData: overallChartData, liveStats: stats };
  }, [data]);

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
        <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div></CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                 <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                 <CardContent className="h-[350px]"><Skeleton className="h-full w-full rounded-lg" /></CardContent>
            </Card>
            <Card className="lg:col-span-3">
                 <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                 <CardContent className="h-[350px]"><Skeleton className="h-full w-full rounded-lg" /></CardContent>
            </Card>
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
    <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-semibold">Monitoring Dashboard</h1>
            <div className="ml-auto flex items-center gap-2">
                <Select value={preset} onValueChange={handlePresetChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Last 24 hours</SelectItem>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                </Select>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className="w-[300px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? ( date.to ? (<> {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")} </>) : (format(date.from, "LLL dd, y"))) : (<span>Pick a date</span>)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={(range) => { setDate(range); setPreset("custom"); }} numberOfMonths={2}/>
                    </PopoverContent>
                </Popover>
                 <Button variant={isRealtime ? "default" : "outline"} size="icon" onClick={() => setIsRealtime(!isRealtime)} title={isRealtime ? "Disable real-time updates" : "Enable real-time updates"}>
                    <RefreshCw className={`h-4 w-4 ${isRealtime ? 'animate-spin' : ''}`} />
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader><CardTitle>Live Status</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 text-center">
                    {Object.entries(liveStats).map(([status, count]) => (
                        <div key={status} className="flex flex-col p-2 rounded-lg bg-background">
                            <span className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-10 mx-auto" /> : count}</span>
                            <span className="text-sm text-muted-foreground mt-1">{status}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader><CardTitle>Permission Status</CardTitle></CardHeader>
                <CardContent className="h-[350px]">
                    {isLoading ? <Skeleton className="h-full w-full rounded-lg" /> : 
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={permissionStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => { const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180)); const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180)); return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"> {`${(percent * 100).toFixed(0)}%`} </text> ); }}>
                                {permissionStatusData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={permissionStatusColors[entry.name as keyof typeof permissionStatusColors]} /> ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>}
                </CardContent>
            </Card>

            <Card className="lg:col-span-3">
                <CardHeader><CardTitle>Overall Status</CardTitle></CardHeader>
                <CardContent className="h-[350px]">
                     {isLoading ? <Skeleton className="h-full w-full rounded-lg" /> : 
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={overallStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => { const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180)); const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180)); return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"> {`${(percent * 100).toFixed(0)}%`} </text> ); }}>
                                {overallStatusData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={overallStatusColors[entry.name as keyof typeof overallStatusColors]} /> ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
