import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";

// Initialize all our cloud services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    // 1. Grab the file and user info from the frontend
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const employeeEmail = formData.get("employeeEmail") as string;

    if (!file) return NextResponse.json({ success: false, error: "No file provided" });

    // 2. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get the public URL to save in the DB
    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);
    const receiptUrl = publicUrlData.publicUrl;

    // 3. Prepare the image for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    
    // 4. THE PROMPT: Force Gemini to be a forensic accountant and return strict JSON
    const prompt = `
      Analyze this receipt. You are an expert forensic accountant and data extractor.
      Your job is to extract the data and evaluate the receipt for fraud.

      CRITICAL FRAUD CHECKS (Calculate a fraudRiskScore from 0 to 100):
      1. Math & Layout (Severe - +50 points): Does Subtotal + Tax = TOTAL? Are there compression halos, pixel blurring, or misaligned text blocks?
      2. Context & Time (Moderate - +30 points): Does the timestamp make logical sense for the items purchased? (e.g., A steakhouse dinner with wine timestamped at 8:43 AM is highly suspicious).
      3. Typography (Moderate - +30 points): Does the font style of the TOTAL match the rest of the receipt? Watch for Arial/Sans-serif totals mixed with monospace receipt items.
      4. Enterprise Identifiers (Minor - +15 points): Standard B2B receipts usually contain a Merchant ID, Tax ID, or GSTIN. 

      SCORING RULE: 
      - Do NOT be overly strict on minor visual noise like wrinkles, shadows, or bad lighting on genuine photos. 
      - A score > 50 will automatically escalate the claim. 
      - A missing Merchant ID alone should not fail a receipt (score it ~15), but a missing Merchant ID combined with a font mismatch or temporal anomaly should push the score over 50.

      Return ONLY a valid JSON object (no markdown formatting, no backticks) with these exact keys:
      {
        "merchant": "Name of the store",
        "amount": numeric total (e.g. 12.50),
        "date": "YYYY-MM-DD",
        "fraudRiskScore": a number from 0 to 100,
        "fraudReason": "A short, specific sentence explaining the score. Leave empty if score is below 50."
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: buffer.toString("base64"), mimeType: file.type } }
    ]);

    // Parse the JSON response from Gemini
    const rawText = result.response.text();
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}') + 1;
    const cleanJson = rawText.substring(jsonStart, jsonEnd);
    const aiData = JSON.parse(cleanJson);

    // 5. FRAUD LOGIC: Determine status based on the AI's score
    const isFraudulent = aiData.fraudRiskScore > 50;
    const finalStatus = isFraudulent ? "escalated" : "pending";

    // 6. Save everything to the database
    const { data: dbData, error: dbError } = await supabase
      .from("expenses")
      .insert([
        {
          employee_email: employeeEmail,
          merchant: aiData.merchant || "Unknown Vendor",
          amount: aiData.amount || 0,
          date: aiData.date || new Date().toISOString(),
          receipt_url: receiptUrl,
          status: finalStatus,
          fraud_reason: aiData.fraudReason || null
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // 7. FIRE THE ALARM: If fraud is detected, email HR automatically
    if (isFraudulent) {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: ["sannwoy.bandyopadhyay@gmail.com"], // Your Resend verified email
        subject: `🚨 AI FRAUD ALERT: Suspicious Receipt from ${employeeEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fef2f2; border-radius: 12px; border: 2px solid #f87171; max-width: 600px;">
            <h2 style="color: #dc2626; margin-top: 0;">🤖 AI Fraud Detection Triggered</h2>
            <p style="color: #450a0a; font-size: 16px;">Expense Flow AI has automatically intercepted a highly suspicious reimbursement claim.</p>
            
            <ul style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #fca5a5; font-size: 15px; color: #18181b;">
              <li style="margin-bottom: 10px;"><strong>Employee:</strong> ${employeeEmail}</li>
              <li style="margin-bottom: 10px;"><strong>Merchant:</strong> ${aiData.merchant}</li>
              <li style="margin-bottom: 10px;"><strong>Claim Amount:</strong> $${aiData.amount.toFixed(2)}</li>
              <li style="margin-bottom: 10px;"><strong>AI Threat Score:</strong> <span style="color: #dc2626; font-weight: bold;">${aiData.fraudRiskScore}/100</span></li>
              <li style="margin-bottom: 10px;"><strong>AI Reasoning:</strong> <em>"${aiData.fraudReason}"</em></li>
            </ul>
            
            <p style="margin-top: 20px;"><a href="${receiptUrl}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Original Document</a></p>
          </div>
        `,
      });
    }

    // 8. Return success to the frontend
    return NextResponse.json({ success: true, data: dbData });

  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json({ success: false, error: "Failed to process receipt" }, { status: 500 });
  }
}
