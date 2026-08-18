"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAppSelector } from "@/store";

interface Batch {
  id: string;
  batchTitle: string;
}

interface ModuleData {
  id: string;
  title: string;
  sequenceOrder: number;
  status: string;
  questions?: any[];
}



export default function AdminAssessmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user && user.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      fetchBatches();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchModules(selectedBatchId);
    }
  }, [selectedBatchId]);

  const fetchBatches = async () => {
    const res = await apiFetch("/batches");
    if (res.success && res.data) {
      setBatches(res.data);
      if (res.data.length > 0) {
        setSelectedBatchId(res.data[0].id);
      }
    }
  };

  const fetchModules = async (batchId: string) => {
    setLoading(true);
    const res = await apiFetch(`/modules?batchId=${batchId}`);
    if (res.success && res.data) {
      // Fetch questions for each module to get the count
      const modulesWithQuestions = await Promise.all(
        res.data.map(async (mod: any) => {
          const qRes = await apiFetch(`/modules/${mod.id}/questions`);
          return {
            ...mod,
            questions: qRes.success && qRes.data ? qRes.data : []
          };
        })
      );
      setModules(modulesWithQuestions);
    }
    setLoading(false);
  };

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Assessments</h1>
            <p className="text-slate-400 mt-1">Manage module-level MCQs and passing criteria</p>
          </div>
        </div>

        {/* Batch Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-2">Select Batch to View Assessments</label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            <option value="">-- Select a Batch --</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batchTitle}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : !selectedBatchId ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-slate-500">Please select a batch to view its module assessments.</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-slate-500">No modules found for this batch. Create modules first to add assessments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => (
              <div key={mod.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded mb-2 inline-block">
                      Module {mod.sequenceOrder}
                    </span>
                    <h3 className="text-lg font-semibold text-white leading-tight">{mod.title}</h3>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-slate-400">Total Questions</span>
                    <span className="text-base font-bold text-white">{mod.questions?.length || 0}</span>
                  </div>
                  
                  <button
                    onClick={() => router.push(`/admin/modules/${mod.id}`)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-sm font-medium text-white transition-colors"
                  >
                    Manage Assessment
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}