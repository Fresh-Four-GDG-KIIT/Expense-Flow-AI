# Architecture Document: Expense Flow AI

## Tech Stack
* **Frontend:** Next.js 14 (React), Tailwind CSS, Lucide Icons.
* **Backend:** Next.js API Routes (Serverless).
* **Database & Storage:** Supabase (PostgreSQL) with Row-Level Security (RLS) and Supabase Storage Buckets.
* **AI / ML:** Google Gemini 3.6 Flash (Multimodal AI).
* **Notifications:** Resend API.

## Data Model
**Table:** `expenses`
* `id` (uuid, primary key)
* `created_at` (timestamp)
* `employee_email` (text)
* `merchant` (text)
* `amount` (numeric)
* `date` (text)
* `status` (text) - e.g., 'pending', 'approved', 'escalated', 'cancelled'
* `receipt_url` (text)
* `fraud_reason` (text)

## High-Level Design
1.  **Client:** The Next.js frontend allows employees to upload receipts.
2.  **Storage:** The file is immediately securely uploaded to a Supabase Storage bucket.
3.  **Processing:** A Next.js API route passes the image buffer to Gemini 3.6 Flash, prompted to act as a forensic accountant.
4.  **Database Sync:** Extracted data and the calculated `fraudRiskScore` are pushed to Supabase.
5.  **Event Trigger:** If fraud is detected, the Next.js backend triggers the Resend API to alert HR.
