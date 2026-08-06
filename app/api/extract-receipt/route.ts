import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Initialize Gemini & Supabase
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const employeeEmail = formData.get("employeeEmail") as string || "employee@company.com";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 1. Upload File to Supabase Storage Bucket
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const receiptUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${fileName}`;

    // 2. Convert File to Buffer for Gemini API
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const prompt = `Analyze this receipt image and return ONLY a valid JSON object with two fields:
    - "merchant": string (the name of the store/company)
    - "amount": number (the total dollar value as a float)
    Do not wrap in markdown or backticks. Additionally, act as a forensic accountant. Look for mismatched fonts, blurred text that indicates photoshopping, or missing standard tax IDs. Return a fraud_risk score from 0-100 and a fraud_reason if the score is above 50.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type,
        },
      },
    ]);

    const text = result.response.text();
    const extractedData = JSON.parse(text);

    // 3. Insert Record into Supabase Database
    const { data: dbData, error: dbError } = await supabase
      .from("expenses")
      .insert([
        {
          employee_email: employeeEmail,
          receipt_url: receiptUrl,
          merchant: extractedData.merchant,
          amount: extractedData.amount,
          status: "pending",
        },
      ])
      .select();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, expense: dbData[0] });
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}