"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabase } from '@/contexts/supabase-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const actionSchema = z.object({
  action: z.enum(['Approval', 'Objection', 'Manual Handle']),
  feedback: z.string().optional(),
}).refine(data => {
  if ((data.action === 'Objection' || data.action === 'Manual Handle') && (!data.feedback || data.feedback.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Feedback is required for this action.",
  path: ["feedback"],
});

export function SendGuardCard({ item, onAction }: { item: any, onAction: () => void }) {
  const { supabase, credentials } = useSupabase();
  const { toast } = useToast();
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof actionSchema>>({
    resolver: zodResolver(actionSchema),
    defaultValues: { feedback: '' },
  });

  const handleActionChange = (value: string) => {
    setSelectedAction(value);
    form.setValue('action', value as 'Approval' | 'Objection' | 'Manual Handle');
  };

  const onSubmit = async (values: z.infer<typeof actionSchema>) => {
    if (!supabase || !credentials?.table) return;
    setIsSubmitting(true);

    let updateData: any = { permission: values.action };
    if (values.action === 'Objection' || values.action === 'Manual Handle') {
      updateData.feedback = values.feedback;
    }
    
    if (values.action === 'Objection') {
      updateData.edited = (item.edited || 0) + 1;
    }

    const { error } = await supabase.from(credentials.table).update(updateData).eq('id', item.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update item.' });
    } else {
      toast({ title: 'Success', description: 'Item updated successfully.' });
      onAction();
    }
    setIsSubmitting(false);
  };
  
  const handleCancel = async () => {
    if (!supabase || !credentials?.table) return;
    setIsSubmitting(true);
    const { error } = await supabase.from(credentials.table).update({ permission: 'Cancel' }).eq('id', item.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to cancel item.' });
    } else {
      toast({ title: 'Success', description: 'Item cancelled.' });
      onAction();
    }
    setIsSubmitting(false);
  }

  const renderField = (label: string, value: any) => value ? (
    <div className="mb-4">
      <h4 className="font-semibold text-sm text-muted-foreground">{label}</h4>
      <div className="p-3 rounded-md bg-muted/50 text-sm whitespace-pre-wrap">{value}</div>
    </div>
  ) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Content Details</span>
          {item.edited > 0 && <Badge variant="destructive">Edited {item.edited} time(s)</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderField('Thread Context', item.Previous_Emails_Summary)}
        {renderField('Thought Process', item.reasoning)}
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
        
        {item.bookcall && renderField('Availabilities', item.Availabilities)}
        {renderField('Draft Reply', item.draft_reply)}
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 rounded-b-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Select onValueChange={handleActionChange} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approval">Approval</SelectItem>
                  <SelectItem value="Objection">Objection</SelectItem>
                  <SelectItem value="Manual Handle">Manual Handle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(selectedAction === 'Objection' || selectedAction === 'Manual Handle') && (
              <div className="w-full md:w-2/3">
                <Textarea {...form.register('feedback')} placeholder="Provide required feedback..." className="flex-1 bg-background" disabled={isSubmitting}/>
                 {form.formState.errors.feedback && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.feedback.message}</p>}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={!selectedAction || isSubmitting}>Submit Action</Button>
            <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}
