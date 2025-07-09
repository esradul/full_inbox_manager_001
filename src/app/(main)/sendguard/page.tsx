"use client";

import { ContentWorkflow } from '@/components/workflows/content-workflow';
import { SendGuardCard } from '@/components/workflows/sendguard-card';

export default function SendGuardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">SendGuard - Content Approval</h1>
      <ContentWorkflow
        filter={{ permission: 'Waiting', removed: false }}
        noItemsMessage="There are no items awaiting moderation."
        renderItem={(item: any, refresh) => <SendGuardCard item={item} onAction={refresh} />}
      />
    </div>
  );
}
