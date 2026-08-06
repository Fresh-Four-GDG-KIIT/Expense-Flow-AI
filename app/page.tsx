"use client";

import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import EmployeePortal from "./components/EmployeePortal";
import HrDashboard from "./components/HrDashboard";
import { LogOut, Receipt, Lock, User as UserIcon, Loader2, Sparkles, ArrowRight } from "lucide-react";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [role, setRole] = useState<"none" | "employee" | "hr">("none");
  const [userEmail, setUserEmail] = useState("");
  
  // Login Form State
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', loginId)
        .eq('password', password)
        .single();

      if (error || !data) {
        alert("Invalid credentials! Please check your ID and password.");
        setIsLoggingIn(false);
        return;
      }

      setUserEmail(data.email);
      setRole(data.role as "employee" | "hr");
      
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong connecting to the database.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setRole("none");
    setLoginId("");
    setPassword("");
    setUserEmail("");
  };

  // ==========================================
  // 1. DYNAMIC & FLASHY LOGIN SCREEN (Clean)
  // ==========================================
  if (role === "none") {
    return (
      <main className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden font-sans">
        
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full mix-blend-screen filter blur-[150px]"></div>

        {/* Glassmorphism Login Card */}
        <div className="relative z-10 max-w-md w-full bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] text-center space-y-8 transform transition-all hover:scale-[1.01] duration-500">
          
          {/* Logo & Header */}
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20 transform rotate-3 hover:rotate-6 transition-transform">
              <Receipt className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight flex items-center justify-center gap-2">
                Expense Flow <Sparkles className="w-5 h-5 text-indigo-400" />
              </h1>
              <p className="text-sm text-slate-400 mt-2 font-medium">Enterprise AI Reimbursement Engine</p>
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5 text-left">
            <div className="space-y-2 group">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-indigo-400 transition-colors">Portal ID</label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-slate-500 absolute left-4 top-3.5 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter your enterprise ID"
                  disabled={isLoggingIn}
                  className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600 disabled:opacity-50 shadow-inner"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2 group">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-purple-400 transition-colors">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-3.5 group-focus-within:text-purple-400 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  disabled={isLoggingIn}
                  className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-slate-600 disabled:opacity-50 shadow-inner"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-indigo-800 disabled:to-purple-900 text-white font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/25 mt-4 flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Access Terminal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ==========================================
  // 2. ACTIVE PORTAL VIEW
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-900 transition-colors duration-200">
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Expense Flow AI</span>
            <span className="text-xs px-3 py-1 bg-slate-800/80 text-slate-300 border border-slate-700 rounded-full font-medium ml-2 shadow-inner">
              {role === "employee" ? "Employee Workspace" : "HR Workspace"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 font-medium hidden sm:block bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-all hover:shadow-md"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        {role === "employee" ? (
          <div className="bg-slate-900 rounded-3xl shadow-2xl shadow-indigo-900/10 border border-slate-800 overflow-hidden">
            <EmployeePortal userEmail={userEmail} />
          </div>
        ) : (
          <div className="bg-slate-900 rounded-3xl shadow-2xl shadow-purple-900/10 border border-slate-800 overflow-hidden">
            <HrDashboard />
          </div>
        )}
      </div>
    </main>
  );
}