# Agents and Skills

## Custom Agent: The Forensic Auditor
* **Description:** A multimodal AI agent powered by Gemini 3.6 Flash.
* **Function:** It acts as an automated security layer, intercepting receipts before they reach the database. Instead of just performing OCR, it cross-references item logic with timestamps and scans for pixel-level visual manipulation.

## Custom Skill: Automated Threat Escalation
* **Description:** An integrated escalation webhook skill.
* **Function:** When the Forensic Auditor calculates a fraud risk score above 50, this skill automatically bypasses the standard approval database flow and triggers an emergency webhook via the Resend API to notify department managers with the AI's forensic reasoning.
