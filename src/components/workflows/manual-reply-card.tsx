"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useSupabase } from '@/contexts/supabase-context';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const replySchema = z.object({
  reply: z.string().min(1, "Reply cannot be empty."),
  name: z.string().optional(),
});

export function ManualReplyCard({ item, onAction }: { item: any, onAction: () => void }) {
  const { supabase, credentials } = useSupabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { reply: '', name: '' },
  });

  const onSubmit = async (values: z.infer<typeof replySchema>) => {
    if (!supabase || !credentials?.table) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from(credentials.table)
      .update({ human_reply: values.reply, human_name: values.name, replied: true, permission: 'Approval' })
      .eq('id', item.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit reply.' });
    } else {
      toast({ title: 'Success', description: 'Reply submitted.' });
      onAction();
    }
    setIsSubmitting(false);
  };

  const handleRemove = async () => {
    if (!supabase || !credentials?.table) return;
    setIsSubmitting(true);
    const { error } = await supabase.from(credentials.table).delete().eq('id', item.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove item.' });
    } else {
      toast({ title: 'Success', description: 'Item removed.' });
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
        <CardTitle>Manual Reply Details</CardTitle>
      </CardHeader>
      <CardContent>
        {renderField('Required Feedback', item.feedback)}
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
        {renderField('Original Draft Reply', item.draft_reply)}
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 rounded-b-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
            <FormField
              control={form.control}
              name="reply"
              render={({ field }) => (
                <FormItem>
                  <Textarea placeholder="Write your reply..." {...field} className="bg-background" disabled={isSubmitting}/>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Input placeholder="Your Name (Optional)" {...field} className="bg-background" disabled={isSubmitting}/>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>Submit Response</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isSubmitting}>Remove</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this item.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleRemove} 
                      className={buttonVariants({ variant: "destructive" })}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
