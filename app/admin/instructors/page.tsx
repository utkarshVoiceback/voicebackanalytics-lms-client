"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Instructor {
  id: string;
  name: string;
  mobile: string;
  email: string;
  instructorModules: { module: { title: string } }[];
  instructorBatches: { batch: { batchTitle: string } }[];
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/instructors");
      if (res.success) {
        setInstructors(res.data);
      } else {
        window.alert(res.message || "Failed to fetch instructors");
      }
    } catch (err: any) {
      window.alert(err.message || "Failed to fetch instructors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this instructor? This will also disable their login.")) return;
    try {
      const res = await apiFetch(`/instructors/${id}`, { method: "DELETE" });
      if (res.success) {
        window.alert("Instructor deleted successfully");
        fetchInstructors();
      } else {
        window.alert(res.message || "Failed to delete instructor");
      }
    } catch (err: any) {
      window.alert(err.message || "Failed to delete instructor");
    }
  };

  const filteredInstructors = instructors.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Instructors</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage instructors and their batch/module assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/instructors/upload"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Bulk Upload
          </Link>
          <Link
            href="/admin/instructors/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Instructor
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <input
            type="text"
            placeholder="Search instructors by name or email..."
            className="w-full max-w-md px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email / Mobile</th>
                <th className="px-6 py-4">Batches</th>
                <th className="px-6 py-4">Modules</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading instructors...
                  </td>
                </tr>
              ) : filteredInstructors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No instructors found.
                  </td>
                </tr>
              ) : (
                filteredInstructors.map((instructor) => (
                  <tr
                    key={instructor.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {instructor.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 dark:text-slate-300">{instructor.email}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {instructor.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px] overflow-hidden">
                        {instructor.instructorBatches?.map((ib, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {ib.batch.batchTitle}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px] overflow-hidden">
                        {instructor.instructorModules?.map((im, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          >
                            {im.module.title}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link
                        href={`/admin/instructors/${instructor.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(instructor.id)}
                        className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
