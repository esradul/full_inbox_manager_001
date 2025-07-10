"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSupabase } from '@/contexts/supabase-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
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
import { format } from 'date-fns';

export function RecoveryCard({ item, onAction }: { item: any, onAction: () => void }) {
  const { supabase, credentials } = useSupabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!supabase || !credentials?.table) return;
    setIsSubmitting(true);

    const { error } = await supabase.from(credentials.table).delete().eq('id', item.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to permanently delete item.' });
    } else {
      toast({ title: 'Success', description: 'Item has been permanently deleted.' });
      onAction(); // Refresh the list
    }
    setIsSubmitting(false);
  };
  
  const handleRestore = async () => {
    if (!supabase || !credentials?.table) return;
    setIsSubmitting(true);

    // This logic restores the item to a "Waiting" state for re-moderation
    const { error } = await supabase
        .from(credentials.table)
        .update({ removed: false, permission: 'Waiting' })
        .eq('id', item.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to restore item.' });
    } else {
      toast({ title: 'Success', description: 'Item restored to SendGuard queue.' });
      onAction(); // Refresh the list
    }
    setIsSubmitting(false);
  }

  const renderField = (label: string, value: any) => value ? (
    <div className="mb-2">
      <h4 className="font-semibold text-sm text-muted-foreground">{label}</h4>
      <div className="p-2 rounded-md bg-muted/50 text-sm whitespace-pre-wrap">{value}</div>
    </div>
  ) : null;

  const status = item.removed ? 'Removed' : 'Canceled';
  const statusVariant = item.removed ? 'destructive' : 'secondary';
  const date = new Date(item.created_at);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{item.email_subject || 'No Subject'}</CardTitle>
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{format(date, "MMM d, yyyy 'at' h:mm a")}</span>
            <Badge variant={statusVariant}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {renderField('Customer Message', item.Customer_Email)}
        {renderField('Draft Reply', item.draft_reply)}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleRestore} disabled={isSubmitting}>
          Restore
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isSubmitting}>Delete Permanently</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this item from your database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className={buttonVariants({ variant: "destructive" })}
              >
                Yes, delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
