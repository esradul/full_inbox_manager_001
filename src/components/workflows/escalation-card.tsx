"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useSupabase } from '@/contexts/supabase-context';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const responseSchema = z.object({
  reply: z.string().min(1, "Response cannot be empty."),
});

export function EscalationCard({ item, onAction }: { item: any, onAction: () => void }) {
  const { supabase, credentials } = useSupabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof responseSchema>>({
    resolver: zodResolver(responseSchema),
    defaultValues: { reply: '' },
  });

  const onSubmit = async (values: z.infer<typeof responseSchema>) => {
    if (!supabase || !credentials?.table) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from(credentials.table)
      .update({ Escalated_reply: values.reply, escalation: false }) // Mark as handled
      .eq('id', item.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit response.' });
    } else {
      toast({ title: 'Success', description: 'Escalation handled.' });
      onAction();
    }
    setIsSubmitting(false);
  };

  const renderField = (label: string, value: any) => value ? (
    <div className="mb-4">
      <h4 className="font-semibold text-sm text-muted-foreground">{label}</h4>
      <div className="p-3 rounded-md bg-muted/50 text-sm whitespace-pre-wrap">{value}</div>
    </div>
  ) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escalation Details</CardTitle>
      </CardHeader>
      <CardContent>
        {renderField('Thread Context', item.Previous_Emails_Summary)}
        {renderField('Why I’m not able to do it', item.reasoning)}
        {renderField('Current Customer Message', item.Customer_Email)}
        
        {item.CRM_notes && (
          <div className="mb-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="crm-notes" className="border-b-0">
                <AccordionTrigger className="py-2 font-semibold text-sm text-muted-foreground hover:no-underline">
                  <span className="flex-1 text-left">CRM Notes</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-3 rounded-md bg-muted/50 text-sm whitespace-pre-wrap">
                    {item.CRM_notes}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 rounded-b-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
            <FormField
              control={form.control}
              name="reply"
              render={({ field }) => (
                <FormItem>
                  <Textarea placeholder="Write your response..." {...field} className="bg-background" disabled={isSubmitting}/>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>Submit Response</Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
