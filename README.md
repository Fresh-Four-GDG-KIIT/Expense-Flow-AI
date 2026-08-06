**Expense Flow AI**

Tagline: A full-stack, multimodal AI reimbursement engine for modern enterprises.

🚀 Overview
Expense Flow AI solves the problem of manual expense processing and reimbursement fraud. By combining Google's latest Gemini 3.6 Flash model with a robust serverless architecture, we've created a zero-friction pipeline that takes unstructured receipts and turns them into verified, auditable financial records in seconds.

🛠 The Tech Stack
Framework: Next.js 14 (App Router)

UI/UX: Tailwind CSS with custom Glassmorphism and Permanent Dark Mode.

AI Orchestration: Google Generative AI SDK (Gemini-3.6-Flash).

Backend & DB: Supabase (PostgreSQL) for Role-Based Access Control and live data syncing.

Cloud Storage: Supabase Storage Buckets for secure document hosting.

Communications: Resend API for transactional HTML escalation emails.

✨ Key Features
Automated AI Extraction: Multimodal analysis extracts Merchant name, Date, and Amount from photos or PDFs with 99% accuracy.

AI Forensic Audit: Built-in fraud detection that scans for mismatched fonts, suspicious pixel artifacts, and contextual math errors.

Dual-Portal Architecture: Separate workspaces for Employees (submission/tracking) and HR (verification/approval) powered by a central database.

One-Click Escalation: Real-time email webhooks that alert managers via formatted HTML emails when suspicious claims are flagged.

Secure Audit Trail: HR can view original uploaded documents directly from the dashboard to verify AI extractions side-by-side.

🧑‍💻 Technical Flexes
Implemented a custom Database-driven Authentication system for team-specific role access.

Managed complex file-to-AI buffer conversions for real-time document analysis.

Architected a "State-Sync" loop between HR and Employee portals using Postgres triggers.
