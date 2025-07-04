"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/contexts/supabase-context";
import { useEffect } from "react";

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid Supabase URL." }),
  key: z.string().min(1, { message: "Please enter your Supabase secret key." }),
  table: z.string().min(1, { message: "Please enter the table name." }),
});

interface SupabaseConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupabaseConfigDialog({ open, onOpenChange }: SupabaseConfigDialogProps) {
  const { setSupabaseCredentials, credentials } = useSupabase();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      key: "",
      table: "",
    },
  });

  useEffect(() => {
    if (credentials) {
      form.reset({
        url: credentials.url,
        key: credentials.key,
        table: credentials.table,
      });
    }
  }, [credentials, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setSupabaseCredentials(values.url, values.key, values.table);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Supabase Configuration</DialogTitle>
          <DialogDescription>
            Enter your Supabase credentials to connect your data. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supabase Host URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://<project-ref>.supabase.co" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supabase Secret Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Supabase anon or service_role key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="table"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., your_table_name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
