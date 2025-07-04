"use client";

import { ContentWorkflow } from '@/components/workflows/content-workflow';
import { ManualReplyCard } from '@/components/workflows/manual-reply-card';

export default function ManualReplyPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Manual Reply</h1>
      <ContentWorkflow
        filter={{ permission: 'Manual Handle' }}
        noItemsMessage="No items are awaiting manual reply."
        renderItem={(item: any, refresh) => <ManualReplyCard item={item} onAction={refresh} />}
      />
    </div>
  );
}
