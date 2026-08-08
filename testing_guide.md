# Testing Guide: Expense Flow AI

Welcome to the live testing environment for **Expense Flow AI**, the Enterprise AI Reimbursement Engine.

## 🔗 Live Application
**Access the live app here:** [https://expense-flow-ai-sand.vercel.app/](https://expense-flow-ai-sand.vercel.app/)

---

## 🔑 Test Accounts
To fully experience the dual-portal architecture and role-based access control, please use the following test accounts:

### 1. The Employee Experience
* **Login ID:** `Sannwoy_employee`
* **Purpose:** Use this account to experience the frictionless, Next.js UI. You can drag and drop the provided sample receipts here to see the real-time AI extraction and database syncing in action.

### 2. The HR Command Center
* **Login ID:** `Sannwoy_HR`
* **Purpose:** Use this account to view the HR Management Hub. Here you can see the enterprise-wide ledger, verify claims, and observe how the AI flags fraudulent uploads.

---

## 🧪 Recommended Testing Flow

We have provided a suite of both **Genuine** and **Fraudulent** sample receipts for you to test the AI's forensic capabilities.

1. **Test the Happy Path (Clean Data)**
   * Log in as `Sannwoy_employee`.
   * Upload the `01_clean_legit.pdf` receipt.
   * Watch the AI instantly extract the merchant, date, and amount without manual data entry.

2. **Test the Intelligent Fraud Matrix (Anomalies)**
   * While still logged in as `Sannwoy_employee`, upload one of the fraudulent test cases (e.g., `06_temporal_mismatch_only.pdf` or `07_all_flags_combined.pdf`).
   * Watch as Gemini 3.6 Flash detects the logical anomalies or visual tampering and automatically intercepts the claim.

3. **Verify the HR Audit Trail**
   * Log out and log back in as `Sannwoy_HR`.
   * Open the HR Verification Portal.
   * Notice that the genuine receipt is ready for 1-click approval, while the fraudulent receipt has been automatically locked to an **Escalated** status before a human ever had to review it.
