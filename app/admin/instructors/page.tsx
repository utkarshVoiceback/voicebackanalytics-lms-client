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
  instructorBatches: { batch: { batchTitle: string; courseId: string; course?: { id: string; title: string } } }[];
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
                <th className="px-6 py-4">Course • Batch • Module</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Loading instructors...
                  </td>
                </tr>
              ) : filteredInstructors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
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
                      <div className="space-y-3">
                        {(() => {
                          const courseMap = new Map<string, { courseTitle: string; batches: any[] }>();

                          instructor.instructorBatches?.forEach((ib) => {
                            const courseId = ib.batch.courseId;
                            const courseTitle = ib.batch.course?.title || "Unknown";

                            if (!courseMap.has(courseId)) {
                              courseMap.set(courseId, { courseTitle, batches: [] });
                            }
                            courseMap.get(courseId)!.batches.push(ib);
                          });

                          return Array.from(courseMap.entries()).map(([courseId, { courseTitle, batches }]) => (
                            <div key={courseId} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">📚 {courseTitle}</p>
                              </div>

                              <div className="space-y-2 p-3">
                                {batches.map((ib, batchIdx) => (
                                  <div key={batchIdx}>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">├─ {ib.batch.batchTitle}</p>

                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {(() => {
                                        const batchModules = instructor.instructorModules?.filter((im) => {
                                          return instructor.instructorBatches?.some(
                                            (b) => b.batch.courseId === ib.batch.courseId
                                          );
                                        }) || [];

                                        return batchModules.length > 0 ? (
                                          batchModules.map((im, modIdx) => (
                                            <span
                                              key={modIdx}
                                              className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium"
                                            >
                                              {im.module.title}
                                            </span>
                                          ))
                                        ) : null;
                                      })()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
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
