"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Instructor {
  id: string;
  name: string;
  mobile: string;
  email: string;
  instructorModules: { batchId: string; module: { title: string } }[];
  instructorBatches: { batch: { batchTitle: string; courseId: string; course?: { id: string; title: string } } }[];
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const filteredInstructors = instructors.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.instructorBatches?.some((ib) => ib.batch.batchTitle.toLowerCase().includes(q))
    );
  });

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
            placeholder="Search instructors by name, email, or batch..."
            className="w-full max-w-md px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="px-6 py-8 text-center text-slate-500">
              Loading instructors...
            </div>
          ) : filteredInstructors.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              No instructors found.
            </div>
          ) : (
            filteredInstructors.map((instructor) => (
              <div key={instructor.id}>
                {/* Collapsed Row - Table Header Style */}
                {expandedId !== instructor.id && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div
                      className="px-6 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => setExpandedId(instructor.id)}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
                          aria-label="Toggle instructor details"
                        >
                          {expandedId !== instructor.id ? (
                            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                          )}
                        </button>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{instructor.name}</div>
                        </div>
                      </div>

                      <div className="text-sm text-slate-600 dark:text-slate-400 min-w-max mx-4">
                        {instructor.email}<br/><span className="text-xs">{instructor.mobile}</span>
                      </div>

                      <div className="text-sm text-slate-500 dark:text-slate-400 min-w-max mx-4">
                        {(() => {
                          const courseSet = new Set(
                            instructor.instructorBatches?.map((ib) => ib.batch.course?.id || "") || []
                          );
                          return courseSet.size || 0;
                        })()} courses
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/instructors/${instructor.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(instructor.id);
                          }}
                          className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded Row - Card Style */}
                {expandedId === instructor.id && (
                  <div
                    onClick={() => setExpandedId(null)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                      {/* Left: Instructor Info */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4 mb-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(null);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer mt-0.5"
                            aria-label="Collapse instructor details"
                          >
                            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                          </button>
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-500 text-white text-xl font-bold">
                              {instructor.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{instructor.name}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{instructor.email}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{instructor.mobile}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Assigned Courses</h4>
                            <div className="space-y-1">
                              {(() => {
                                const courseSet = new Set(
                                  instructor.instructorBatches?.map((ib) => ib.batch.course?.title || "Unknown") || []
                                );
                                return Array.from(courseSet).map((course) => (
                                  <p key={course} className="text-sm text-slate-600 dark:text-slate-400">
                                    • {course}
                                  </p>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                          <Link
                            href={`/admin/instructors/${instructor.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(instructor.id);
                            }}
                            className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Right: Batch / Module Assignments */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-slate-900 dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 3a1 1 0 011 1v1.22l3.941 1.227A1 1 0 0116 7v5a4 4 0 01-8 0V7a1 1 0 01.059-.468L9 5.22V4a1 1 0 011-1h0zm-5 8.025V7h2v3.025A6 6 0 005 11.025zm8 0V11a6 6 0 00-2-4.975V7h2v4.025z" />
                          </svg>
                          <h4 className="font-semibold text-slate-900 dark:text-white">Batch / Module Assignments</h4>
                        </div>

                        {instructor.instructorBatches && instructor.instructorBatches.length > 0 ? (
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {(() => {
                              const courseMap = new Map<string, { courseTitle: string; batches: any[] }>();

                              instructor.instructorBatches.forEach((ib) => {
                                const courseId = ib.batch.courseId;
                                const courseTitle = ib.batch.course?.title || "Unknown";

                                if (!courseMap.has(courseId)) {
                                  courseMap.set(courseId, { courseTitle, batches: [] });
                                }
                                courseMap.get(courseId)!.batches.push(ib);
                              });

                              const sortedEntries = Array.from(courseMap.entries()).sort((a, b) =>
                                a[1].courseTitle.localeCompare(b[1].courseTitle)
                              );

                              return sortedEntries.map(([courseId, { courseTitle, batches }]) => (
                                <div key={courseId} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                                  <div className="bg-slate-50 dark:bg-slate-800/50 -m-3 mb-3 p-3 rounded-t">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">📚 {courseTitle}</p>
                                  </div>

                                  <div className="space-y-2">
                                    {batches.sort((a, b) => a.batch.batchTitle.localeCompare(b.batch.batchTitle)).map((ib, batchIdx) => (
                                      <div key={batchIdx}>
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">├─ {ib.batch.batchTitle}</p>

                                        {(() => {
                                          const batchModules = instructor.instructorModules?.filter((im) => im.batchId === ib.batchId) || [];

                                          return batchModules.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {batchModules.map((im, modIdx) => (
                                                <span
                                                  key={modIdx}
                                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                >
                                                  {im.module.title}
                                                </span>
                                              ))}
                                            </div>
                                          ) : null;
                                        })()}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400">No batch/module assignments.</p>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
