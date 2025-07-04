"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/contexts/supabase-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentWorkflowProps<T> {
  filter: Record<string, any>;
  renderItem: (item: T, refresh: () => void) => React.ReactNode;
  noItemsMessage: string;
}

export function ContentWorkflow<T extends { id: any;[key: string]: any; }>({ filter, renderItem, noItemsMessage }: ContentWorkflowProps<T>) {
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

    let query = supabase.from(credentials.table).select('*').order('created_at', { ascending: true });

    Object.entries(filter).forEach(([key, value]) => {
      if (value === null) {
        query = query.is(key, value);
      } else {
        query = query.eq(key, value);
      }
    });

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
  }, [supabase, credentials, filter, toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!supabase || !credentials?.table) return;

    const channel = supabase
      .channel(`workflow-channel-${Object.values(filter).join('-')}`)
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
  }, [supabase, credentials, fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
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
        <AlertTitle>Queue Clear!</AlertTitle>
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
