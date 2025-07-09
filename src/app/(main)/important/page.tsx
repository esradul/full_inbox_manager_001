"use client";

import { ContentWorkflow } from '@/components/workflows/content-workflow';
import { ImportantCard } from '@/components/workflows/important-card';

export default function ImportantPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Important</h1>
      <ContentWorkflow
        filter={{ important: true, Important_replied: false }}
        noItemsMessage="There are no important items."
        renderItem={(item: any, refresh) => <ImportantCard item={item} onAction={refresh} />}
      />
    </div>
  );
}
