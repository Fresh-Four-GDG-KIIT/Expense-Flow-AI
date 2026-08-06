"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { UploadCloud, FileText, CheckCircle2, XCircle, Clock, Receipt, Loader2, AlertTriangle, Eye, Trash2 } from "lucide-react";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EmployeePortal({ userEmail }: { userEmail: string }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [recentUploads, setRecentUploads] = useState<any[]>([]);

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
        .eq("employee_email", userEmail)
        .order("id", { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData = data.map((item) => ({
          id: item.id.toString(),
          merchant: item.merchant,
          amount: `$${Number(item.amount).toFixed(2)}`,
          date: new Date(item.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: item.status,
          receiptUrl: item.receipt_url, 
        }));
        setRecentUploads(formattedData);
      }
    } catch (error) {
      console.error("Error fetching employee expenses:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 👇 THE NEW CANCEL FUNCTION 👇
  const handleCancelRequest = async (id: string) => {
    // Add a quick confirmation so they don't misclick
    if (!confirm("Are you sure you want to cancel this expense request?")) return;
    
    try {
      const { error } = await supabase
        .from("expenses")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
      
      // Refresh the UI immediately
      await fetchMyExpenses();
    } catch (err) {
      console.error("Error cancelling request:", err);
      alert("Failed to cancel the request. Please try again.");
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
      formData.append("employeeEmail", userEmail);

      const response = await fetch("/api/extract-receipt", { method: "POST", body: formData });
      const result = await response.json();

      if (result.success) {
        await fetchMyExpenses();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 rounded-full border border-emerald-400/20"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case "declined": return <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-400 bg-rose-400/10 rounded-full border border-rose-400/20"><XCircle className="w-3.5 h-3.5" /> Declined</span>;
      case "escalated": return <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-700 rounded-full border border-slate-500"><AlertTriangle className="w-3.5 h-3.5" /> Escalated</span>;
      case "cancelled": return <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-400 bg-slate-800 rounded-full border border-slate-600"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
      default: return <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-400 bg-amber-400/10 rounded-full border border-amber-400/20"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans bg-slate-900 text-white rounded-3xl h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <UploadCloud className="w-8 h-8 text-indigo-400" />
          Submit Expense
        </h1>
        <p className="text-slate-400 mt-2">Upload your receipt and our AI will automatically process the details.</p>
      </div>

      <div 
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all duration-300 ${
          isDragging ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]" : "border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600"
        }`}
      >
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-full shadow-lg mb-4">
          {isUploading ? <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" /> : <UploadCloud className={`w-10 h-10 ${isDragging ? "text-indigo-400" : "text-slate-500"}`} />}
        </div>
        <h3 className="text-lg font-semibold text-slate-200">
          {isUploading ? "Analyzing receipt..." : "Click to upload or drag and drop"}
        </h3>
        <p className="text-sm text-slate-500 mt-1 font-medium">PNG, JPG, or PDF (max. 5MB)</p>
        <input type="file" disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,application/pdf" onChange={handleFileChange} />
      </div>

      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-800/30 shadow-inner">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/80 backdrop-blur-md flex items-center gap-2">
          <Receipt className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Your Expense History</h2>
        </div>
        
        <div className="divide-y divide-slate-800/50">
          {isLoadingData ? (
             <div className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" /> Syncing secure database...</div>
          ) : recentUploads.length === 0 ? (
             <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
               <FileText className="w-8 h-8 text-slate-700" />
               No expenses found for {userEmail}. Upload your first receipt above!
             </div>
          ) : (
            recentUploads.map((expense) => (
              <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-800/60 transition-colors group">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`font-semibold text-lg ${expense.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {expense.merchant}
                    </p>
                    <p className="text-sm text-slate-400 font-medium">{expense.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                  <span className={`font-bold tracking-wide text-lg ${expense.status === 'cancelled' ? 'text-slate-500' : 'text-white'}`}>
                    {expense.amount}
                  </span>
                  
                  {getStatusBadge(expense.status)}
                  
                  <div className="flex items-center gap-2">
                    {expense.receiptUrl && (
                      <button 
                        onClick={() => window.open(expense.receiptUrl, '_blank')}
                        className="p-2.5 text-slate-400 hover:text-indigo-400 bg-slate-800/50 hover:bg-indigo-500/10 border border-slate-700 hover:border-indigo-500/30 rounded-lg transition-all shadow-sm"
                        title="Preview Uploaded Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* 👇 THE CANCEL BUTTON (ONLY SHOWS IF PENDING) 👇 */}
                    {expense.status === "pending" && (
                      <button 
                        onClick={() => handleCancelRequest(expense.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 rounded-lg transition-all shadow-sm"
                        title="Cancel Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
