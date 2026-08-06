"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { UploadCloud, FileText, CheckCircle2, XCircle, Clock, Receipt, Loader2, AlertTriangle } from "lucide-react";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// We now accept the userEmail passed down from the login page
export default function EmployeePortal({ userEmail }: { userEmail: string }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [recentUploads, setRecentUploads] = useState<any[]>([]);

  // 1. Fetch data from Supabase on load
  useEffect(() => {
    if (userEmail) {
      fetchMyExpenses();
    }
  }, [userEmail]);

  const fetchMyExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("employee_email", userEmail) // Only get THIS employee's expenses
        .order("id", { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData = data.map((item) => ({
          id: item.id.toString(),
          merchant: item.merchant,
          amount: `$${Number(item.amount).toFixed(2)}`,
          date: new Date(item.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: item.status,
        }));
        setRecentUploads(formattedData);
      }
    } catch (error) {
      console.error("Error fetching employee expenses:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const uploadAndExtractReceipt = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("employeeEmail", userEmail); // Send the real logged-in email to the API

      const response = await fetch("/api/extract-receipt", { method: "POST", body: formData });
      const result = await response.json();

      if (result.success) {
        // Refetch everything from DB to ensure sync
        await fetchMyExpenses();
        alert(`Success! AI Extracted: ${result.expense.merchant} for $${result.expense.amount}`);
      } else {
        alert(`Error processing receipt: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload and extract receipt.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadAndExtractReceipt(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAndExtractReceipt(file);
  };

  // Syncing colors with HR view
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 rounded-full border border-emerald-400/20"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case "declined": return <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-400 bg-rose-400/10 rounded-full border border-rose-400/20"><XCircle className="w-3.5 h-3.5" /> Declined</span>;
      case "escalated": return <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-700 rounded-full border border-slate-500"><AlertTriangle className="w-3.5 h-3.5" /> Escalated</span>;
      default: return <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-400 bg-amber-400/10 rounded-full border border-amber-400/20"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans bg-slate-800 text-white rounded-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submit Expense</h1>
        <p className="text-slate-400 mt-2">Upload your receipt and our AI will automatically process the details.</p>
      </div>

      <div 
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-colors ${
          isDragging ? "border-indigo-500 bg-indigo-500/10" : "border-slate-600 bg-slate-700/50 hover:bg-slate-700"
        }`}
      >
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-full shadow-sm mb-4">
          {isUploading ? <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" /> : <UploadCloud className={`w-10 h-10 ${isDragging ? "text-indigo-400" : "text-slate-400"}`} />}
        </div>
        <h3 className="text-lg font-semibold">{isUploading ? "Analyzing Receipt..." : "Click to upload or drag and drop"}</h3>
        <p className="text-sm text-slate-400 mt-1">PNG, JPG, or PDF (max. 5MB)</p>
        <input type="file" disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,application/pdf" onChange={handleFileChange} />
      </div>

      <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800/50">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-700/30 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold">Your Expense History</h2>
        </div>
        
        <div className="divide-y divide-slate-700">
          {isLoadingData ? (
             <div className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" /> Syncing data...</div>
          ) : recentUploads.length === 0 ? (
             <div className="p-8 text-center text-slate-500">No expenses found for {userEmail}. Upload your first receipt above!</div>
          ) : (
            recentUploads.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-6 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{expense.merchant}</p>
                    <p className="text-sm text-slate-400">{expense.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-bold text-white">{expense.amount}</span>
                  {getStatusBadge(expense.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}