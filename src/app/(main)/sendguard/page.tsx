"use client";

import { ContentWorkflow } from '@/components/workflows/content-workflow';
import { SendGuardCard } from '@/components/workflows/sendguard-card';

export default function SendGuardPage() {
  const sendGuardFilter = 'and(permission.eq.Waiting,removed.eq.false),and(permission.eq.Objection,Objection_nai.eq.true,removed.eq.false)';

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">SendGuard - Content Approval</h1>
      <ContentWorkflow
        filter={sendGuardFilter}
        noItemsMessage="There are no items awaiting moderation."
        renderItem={(item: any, refresh) => <SendGuardCard item={item} onAction={refresh} />}
      />
    </div>
  );
}
