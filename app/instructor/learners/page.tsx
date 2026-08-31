"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { apiFetch, API_BASE_URL } from "@/lib/api";

export default function InstructorLearnersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [learners, setLearners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("ALL");

  useEffect(() => {
    const fetchLearners = async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/instructor-panel/learners");
        if (res.success && res.data) {
          let learnersData = res.data;
          // Fetch instructor accessible resumes
          const resumeRes = await apiFetch("/resumes/instructor/all");
          if (resumeRes.success && resumeRes.data) {
            const resumeMap = new Map(resumeRes.data.map((r: any) => [r.learnerProfileId, r]));
            learnersData = learnersData.map((l: any) => {
              // Note: instructor-panel/learners returns User entity directly. 
              // We need to map it carefully.
              // Actually, since instructor resume API uses learnerProfileId, we match via some identifier.
              // Let's attach raw resume array and find match by email as fallback or userId.
              const rInfo = resumeRes.data.find((r:any) => r.email === l.email);
              return {
                ...l,
                resumeStatus: rInfo?.resumeStatus || "NOT_UPLOADED",
                resumeFileName: rInfo?.resume?.fileName || "",
                learnerProfileId: rInfo?.learnerProfileId
              };
            });
          }
          setLearners(learnersData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLearners();
  }, []);

  const batches = Array.from(
    new Set(learners.flatMap((l) => l.batches?.map((b: any) => b.batchTitle) || []))
  ).sort();

  const [selectedResumeStatus, setSelectedResumeStatus] = useState("ALL");

  const filteredLearners = learners.filter((l) => {
    const matchesSearch =
      l.fullName.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.batches?.some((b: any) => b.batchTitle.toLowerCase().includes(search.toLowerCase())));

    const matchesBatch =
      selectedBatch === "ALL" || l.batches?.some((b: any) => b.batchTitle === selectedBatch);

    const matchesResume = 
      selectedResumeStatus === "ALL" || (l.resumeStatus || "NOT_UPLOADED") === selectedResumeStatus;

    return matchesSearch && matchesBatch && matchesResume;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Learners
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and view all enrolled learners in your assigned batches
          </p>
        </div>
        {/* Intentionally omitting "Upload Learners" since instructors shouldn't upload them */}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or batch..."
          className="w-full sm:max-w-md rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        {/* Batch Filter */}
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">All Batches</option>
          {batches.map((batch: any) => (
            <option key={batch} value={batch}>
              {batch}
            </option>
          ))}
        </select>

        {/* Resume Status Filter */}
        <select
          value={selectedResumeStatus}
          onChange={(e) => setSelectedResumeStatus(e.target.value)}
          className="w-full sm:w-48 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">All Resumes</option>
          <option value="APPROVED">Approved</option>
          <option value="EDITED">Pending Review</option>
          <option value="UPLOADED">Uploaded</option>
          <option value="NOT_UPLOADED">Not Uploaded</option>
        </select>
      </div>

      {/* Learners Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="px-6 py-10 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading learners...</p>
          </div>
        ) : filteredLearners.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">No learners found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {search || selectedBatch !== "ALL"
                ? "Try adjusting your search or filters."
                : "No learners are currently assigned to your batches."}
            </p>
            {(search || selectedBatch !== "ALL") && (
              <button
                onClick={() => { setSearch(""); setSelectedBatch("ALL"); }}
                className="mt-4 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">Name</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Contact</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Batch</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Resume</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLearners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {learner.fullName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          {learner.email}
                        </span>
                        {learner.mobile && (
                          <span className="flex items-center gap-1.5 text-xs">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.54-4.24-7.136-7.136l1.292-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            {learner.mobile}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {learner.batches?.map((b: any) => (
                          <span key={b.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                            {b.batchTitle}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        learner.isActive
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30"
                          : "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}>
                        {learner.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          learner.resumeStatus === "APPROVED" ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30"
                          : learner.resumeStatus === "EDITED" ? "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30"
                          : learner.resumeStatus === "UPLOADED" ? "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30"
                          : "text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800"
                        }`}>
                          {learner.resumeStatus?.replace("_", " ") || "NOT UPLOADED"}
                        </span>
                        {learner.resumeStatus && learner.resumeStatus !== "NOT_UPLOADED" && learner.learnerProfileId && (
                          <button
                            onClick={() => {
                              const token = typeof window !== "undefined" ? localStorage.getItem("lms_auth_token") : null;
                              const url = `${API_BASE_URL}/resumes/instructor/${learner.learnerProfileId}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`;
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = learner.fullName || "resume";
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            Download
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/instructor/learners/${learner.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
