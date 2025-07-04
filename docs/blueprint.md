# **App Name**: SendVision

## Core Features:

- Monitoring Dashboard: Display a real-time dashboard with pie charts reflecting the status of content (Approval, Objection, Manual Handle, Escalation, Cancel, Important, Bookcall, Waiting) using data from the connected Supabase table, filtered by a selected time range.
- SendGuard Workflow: Present a content approval workflow, displaying records from the Supabase table that are waiting for permission, and allow moderators to approve, object, or manually handle the content. Moderators can also 'cancel' content.
- Manual Reply Management: Enable the management of content that requires manual reply. The interface displays the relevant content and a text field for inputting a human response, which is then saved back to the Supabase table.
- Escalation Handling: Provide an interface to handle escalated content, showing the content that has been flagged for escalation and providing a text field for an appropriate response.
- Important Content Management: Offer a dedicated space for handling important content, ensuring these high-priority items are addressed promptly.
- Live Number View: Display number vertically for each category( Approval,Objection, Manual Handle, Escalation, Cancel, Important column,Bookcall column,Waiting ) above the chart .

## Style Guidelines:

- Primary color: A moderate blue (#5DADE2) suggesting trust and efficiency, essential for a moderation tool.
- Background color: A very light blue (#EBF5FB) for a clean and unobtrusive workspace.
- Accent color: A vibrant orange (#F39C12) for calls to action like approving or escalating content, drawing user attention effectively.
- Body and headline font: 'Inter' (sans-serif) for a modern, readable, and neutral appearance, suitable for both headlines and body text within the app.
- Use simple, clear icons to represent different content statuses and actions (e.g., approval, objection, escalation). Consider using a consistent style from a library like Font Awesome.
- Implement a clean and intuitive layout with clear visual hierarchy. The dashboard should be easily scannable, and action items should be immediately apparent.
- Use subtle animations to provide feedback on user actions (e.g., a loading animation when data is being fetched, a subtle highlight when content is approved).