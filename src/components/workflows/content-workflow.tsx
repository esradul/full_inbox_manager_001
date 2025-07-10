"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/contexts/supabase-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';

interface ContentWorkflowProps<T> {
  filter: Record<string, any> | string;
  renderItem: (item: T, refresh: () => void) => React.ReactNode;
  noItemsMessage: string;
  timeRange?: string;
  startDate?: Date;
  endDate?: Date;
}

export function ContentWorkflow<T extends { id: any;[key: string]: any; }>({ filter, renderItem, noItemsMessage, timeRange, startDate, endDate }: ContentWorkflowProps<T>) {
  const { supabase, credentials } = useSupabase();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!supabase || !credentials?.table) {
      if (supabase) setIsLoading(false);
      return;
    }
    setIsLoading(true);

    let query = supabase.from(credentials.table).select('*').order('created_at', { ascending: false });

    if (typeof filter === 'string') {
      query = query.or(filter);
    } else {
      Object.entries(filter).forEach(([key, value]) => {
        if (value === null) {
          query = query.is(key, value);
        } else {
          query = query.eq(key, value);
        }
      });
    }

    if (timeRange) {
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
              default: fromDate = addDays(toDate, -7);
            }
            query = query.gte('created_at', fromDate.toISOString());
        }
    }


    const { data, error } = await query;
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to fetch workflow items',
        description: error.message,
      });
    } else {
      setItems(data as T[]);
    }
    setIsLoading(false);
  }, [supabase, credentials, filter, toast, timeRange, startDate, endDate]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!supabase || !credentials?.table) return;

    const channel = supabase
      .channel(`workflow-channel-${JSON.stringify(filter)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: credentials.table },
        () => {
            fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, credentials, filter, fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!credentials) {
    return (
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Not Connected</AlertTitle>
        <AlertDescription>Please configure your Supabase connection to view this content.</AlertDescription>
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Queue Empty</AlertTitle>
        <AlertDescription>{noItemsMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id}>
            {renderItem(item, fetchData)}
        </div>
      ))}
    </div>
  );
}
