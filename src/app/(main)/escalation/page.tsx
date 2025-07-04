"use client";

import { ContentWorkflow } from '@/components/workflows/content-workflow';
import { EscalationCard } from '@/components/workflows/escalation-card';

export default function EscalationPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Escalation</h1>
      <ContentWorkflow
        filter={{ escalation: true }}
        noItemsMessage="There are no escalated items."
        renderItem={(item: any, refresh) => <EscalationCard item={item} onAction={refresh} />}
      />
    </div>
  );
}
