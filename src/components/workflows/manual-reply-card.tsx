"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useSupabase } from '@/contexts/supabase-context';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

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
      .update({ human_reply: values.reply, human_name: values.name, permission: 'Replied' }) // Mark as replied
      .eq('id', item.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit reply.' });
    } else {
      toast({ title: 'Success', description: 'Reply submitted.' });
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
        <div className="grid md:grid-cols-2 gap-x-6">
          <div>
            {renderField('Required Feedback', item.feedback)}
            {renderField('Thread Context', item.Previous_Emails_Summary)}
            {renderField('Current Customer Message', item.Customer_Email)}
            {renderField('CRM Notes', item.CRM_notes)}
          </div>
          <div>
            {renderField('Thought Process', item.reasoning)}
            {item.bookcall && renderField('Availabilities', item.Availabilities)}
            {renderField('Original Draft Reply', item.draft_reply)}
          </div>
        </div>
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
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <Input placeholder="Your Name (Optional)" {...field} className="bg-background" disabled={isSubmitting}/>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>Submit Reply</Button>
            </div>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
