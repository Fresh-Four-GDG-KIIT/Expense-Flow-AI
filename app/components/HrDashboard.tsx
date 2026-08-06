"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Check, X, Send, DollarSign, Clock, AlertTriangle, Filter, Users, Loader2, Eye } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Expense {
  id: string; 
  date: string; 
  employeeEmail: string; 
  merchant: string; 
  amount: number; 
  status: "pending" | "approved" | "declined" | "escalated";
  receiptUrl?: string;
}

export default function HrDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase.from("expenses").select("*").order("id", { ascending: false });
      if (error) throw error;
      if (data) {
        const formattedData: Expense[] = data.map((item) => ({
          id: item.id.toString(),
          date: new Date(item.created_at || Date.now()).toLocaleDateString(),
          employeeEmail: item.employee_email,
          merchant: item.merchant,
          amount: item.amount,
          status: item.status,
          receiptUrl: item.receipt_url,
        }));
        setExpenses(formattedData);
      }
    } catch (error) { console.error("Error:", error); } finally { setIsLoading(false); }
  };

  const handleAction = async (id: string, newStatus: "approved" | "declined" | "escalated") => {
    setExpenses((prev) => prev.map((exp) => (exp.id === id ? { ...exp, status: newStatus } : exp)));
    try { await supabase.from("expenses").update({ status: newStatus }).eq("id", id); } catch (dbError) { console.error("DB Error", dbError); }
    if (newStatus === "escalated") {
      const expenseToEscalate = expenses.find(e => e.id === id);
      if (expenseToEscalate) {
        try {
          await fetch("/api/escalate", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expenseId: expenseToEscalate.id, employeeEmail: expenseToEscalate.employeeEmail, merchant: expenseToEscalate.merchant, amount: expenseToEscalate.amount }),
          });
          alert(`Escalation email sent for ${expenseToEscalate.merchant}!`);
        } catch (error) { alert("Failed to send email. Check console."); }
      }
    }
  };

  const totalPending = expenses.filter((exp) => exp.status === "pending").reduce((sum, exp) => sum + exp.amount, 0);
  const filteredExpenses = expenses.filter((exp) => { if (filterStatus === "all") return true; return exp.status === filterStatus; });

  const getStatusBadge = (status: Expense["status"]) => {
    switch (status) {
      case "approved": return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"><Check className="w-3.5 h-3.5" /> Approved</span>;
      case "declined": return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-400/10 text-rose-400 border border-rose-400/20"><X className="w-3.5 h-3.5" /> Declined</span>;
      case "escalated": return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-500"><AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> Escalated</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 font-sans bg-slate-900 text-white rounded-3xl h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-7 h-7 text-purple-400" /> HR Verification Portal</h1>
          <p className="text-sm text-slate-400 mt-1">Review AI-extracted data against original documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-slate-700 rounded-lg text-sm px-3 py-2 bg-slate-800 text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all">
            <option value="all">All Expenses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>
      </div>

      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-800/30 shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 border-collapse">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-xs backdrop-blur-md">
              <tr>
                <th className="py-4 px-6">Date</th><th className="py-4 px-6">Employee</th><th className="py-4 px-6">Merchant</th><th className="py-4 px-6">Amount</th><th className="py-4 px-6">Status</th><th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-2" /> Syncing secure database...</td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">No expenses in the queue.</td></tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-800/60 transition-colors group">
                    <td className="py-4 px-6 font-medium text-white whitespace-nowrap">{expense.date}</td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-xs">{expense.employeeEmail}</td>
                    <td className="py-4 px-6 font-semibold text-white">{expense.merchant}</td>
                    <td className="py-4 px-6 font-bold text-white whitespace-nowrap">${expense.amount.toFixed(2)}</td>
                    <td className="py-4 px-6 whitespace-nowrap">{getStatusBadge(expense.status)}</td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        
                        {expense.receiptUrl && (
                          <button 
                            onClick={() => window.open(expense.receiptUrl, '_blank')} 
                            className="inline-flex items-center gap-1 bg-slate-700/50 hover:bg-slate-600 border border-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-md"
                            title="View Original Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        )}

                        {expense.status === "pending" && (
                          <>
                            <button onClick={() => handleAction(expense.id, "approved")} className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleAction(expense.id, "declined")} className="inline-flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"><X className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleAction(expense.id, "escalated")} className="inline-flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" title="Escalate & Email"><Send className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-900/80 text-white px-6 py-4 flex items-center justify-between border-t border-slate-800">
          <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-purple-400" /><span className="text-sm font-medium text-slate-300">Total Pending Resolution:</span></div>
          
          {/* HERE IS THE LINE THAT BROKE BEFORE - IT IS FULLY INTACT NOW */}
          <div className="text-xl font-bold text-purple-400 tracking-wide">${totalPending.toFixed(2)}</div>
          
        </div>
      </div>
    </div>
  );
}