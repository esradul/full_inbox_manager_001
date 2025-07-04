"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  setSupabaseCredentials: (url: string, key: string, table: string) => void;
  credentials: { url: string; key: string; table: string } | null;
  disconnect: () => void;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [credentials, setCredentials] = useState<{ url: string; key: string; table: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCreds = localStorage.getItem('supabaseCredentials');
      if (storedCreds) {
        const parsedCreds = JSON.parse(storedCreds);
        setCredentials(parsedCreds);
        const client = createClient(parsedCreds.url, parsedCreds.key);
        setSupabase(client);
      }
    } catch (error) {
      console.error("Failed to parse credentials from localStorage", error);
      localStorage.removeItem('supabaseCredentials');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSupabaseCredentials = (url: string, key: string, table: string) => {
    setIsLoading(true);
    try {
      const newCredentials = { url, key, table };
      const client = createClient(url, key);
      setSupabase(client);
      setCredentials(newCredentials);
      localStorage.setItem('supabaseCredentials', JSON.stringify(newCredentials));
      toast({
        title: "Success",
        description: "Supabase connection updated.",
      });
    } catch (error) {
      console.error("Failed to set Supabase credentials", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to Supabase. Please check your credentials.",
      });
      setSupabase(null);
      setCredentials(null);
      localStorage.removeItem('supabaseCredentials');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setIsLoading(true);
    setSupabase(null);
    setCredentials(null);
    localStorage.removeItem('supabaseCredentials');
    toast({
      title: "Disconnected",
      description: "Supabase connection has been removed.",
    });
    setIsLoading(false);
  };

  const value = useMemo(() => ({
    supabase,
    setSupabaseCredentials,
    credentials,
    disconnect,
    isLoading
  }), [supabase, credentials, isLoading]);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
