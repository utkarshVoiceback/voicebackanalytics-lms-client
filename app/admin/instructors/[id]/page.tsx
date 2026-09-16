"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { MultiSelect, Option } from "@/app/components/MultiSelect";

export default function EditInstructorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    batchIds: [] as string[],
  });
  const [batchModuleSelections, setBatchModuleSelections] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState<string>("");

  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [allModules, setAllModules] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instructorRes, batchesRes, modulesRes] = await Promise.all([
          apiFetch(`/instructors/${id}`),
          apiFetch("/batches"),
          apiFetch("/modules/all")
        ]);

        if (batchesRes.success) setAllBatches(batchesRes.data);
        if (modulesRes.success) setAllModules(modulesRes.data);

        if (instructorRes.success) {
          const instructor = instructorRes.data;
          const batchIds = instructor.instructorBatches?.map((ib: any) => ib.batchId) || [];

          setFormData({
            name: instructor.name,
            mobile: instructor.mobile,
            email: instructor.email,
            batchIds,
          });

          // Initialize per-batch module selections
          const selections: Record<string, string[]> = {};
          for (const batchId of batchIds) {
            selections[batchId] = [];
          }

          if (instructor.instructorModules && instructor.instructorModules.length > 0) {
            // Get modules for each batch
            const batchesData = batchesRes.data as any[];
            const modulesByBatch: Record<string, string[]> = {};

            for (const batch of batchesData) {
              if (batchIds.includes(batch.id)) {
                modulesByBatch[batch.id] = [];
              }
            }

            // Map each selected module to its batches
            for (const moduleId of instructor.instructorModules.map((im: any) => im.moduleId)) {
              for (const batch of batchesData) {
                if (batchIds.includes(batch.id)) {
                  // A module can belong to multiple batches if they share the same course
                  const batchModules = modulesRes.data?.filter((m: any) => m.courseId === batch.courseId).map((m: any) => m.id) || [];
                  if (batchModules.includes(moduleId)) {
                    if (!modulesByBatch[batch.id].includes(moduleId)) {
                      modulesByBatch[batch.id].push(moduleId);
                    }
                  }
                }
              }
            }

            setBatchModuleSelections(modulesByBatch);
          }

          if (batchIds.length > 0) {
            setActiveTab(batchIds[0]);
          }
        } else {
          window.alert(instructorRes.message || "Failed to load instructor");
          router.push("/admin/instructors");
        }
      } catch (err: any) {
        window.alert(err.message || "Failed to load instructor");
        router.push("/admin/instructors");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const batchOptions: Option[] = useMemo(() => {
    return allBatches.map(b => ({
      id: b.id,
      label: b.batchTitle,
      group: b.course?.title
    }));
  }, [allBatches]);

  // Context-aware modules: only modules belonging to courses of selected batches
  const availableModulesOptions: Option[] = useMemo(() => {
    if (formData.batchIds.length === 0) return [];
    
    const selectedCourseIds = new Set(
      allBatches
        .filter(b => formData.batchIds.includes(b.id))
        .map(b => b.courseId)
    );

    return allModules
      .filter(m => selectedCourseIds.has(m.courseId))
      .map(m => ({
        id: m.id,
        label: m.title,
        group: m.course?.title
      }));
  }, [formData.batchIds, allBatches, allModules]);

  // Whenever selected batches change, update per-batch module selections
  useEffect(() => {
    if (!loading) {
      const newSelections: Record<string, string[]> = {};
      const validModuleIds = new Set(availableModulesOptions.map(m => m.id));

      for (const batchId of formData.batchIds) {
        const current = batchModuleSelections[batchId] || [];
        newSelections[batchId] = current.filter(moduleId => validModuleIds.has(moduleId));
      }

      // Remove selections for deselected batches
      setBatchModuleSelections(newSelections);

      // Update active tab if current tab is deselected
      if (formData.batchIds.length > 0 && !formData.batchIds.includes(activeTab)) {
        setActiveTab(formData.batchIds[0]);
      }
    }
  }, [formData.batchIds, availableModulesOptions, loading, activeTab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.batchIds.length === 0) return window.alert("Please select at least one batch.");

    const allModuleIds = new Set<string>();
    for (const batchId of formData.batchIds) {
      const modules = batchModuleSelections[batchId] || [];
      modules.forEach(m => allModuleIds.add(m));
    }

    if (allModuleIds.size === 0) return window.alert("Please select at least one module.");

    setSaving(true);

    try {
      const res = await apiFetch(`/instructors/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...formData,
          moduleIds: Array.from(allModuleIds),
        }),
      });

      if (res.success) {
        window.alert("Instructor updated successfully!");
        router.push("/admin/instructors");
      } else {
        window.alert(res.message || "Failed to update instructor");
      }
    } catch (err: any) {
      window.alert(err.message || "Failed to update instructor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading instructor details...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Instructor</h1>
        <Link
          href="/admin/instructors"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          &larr; Back to Instructors
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Assigned Batches <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              options={batchOptions}
              selectedIds={formData.batchIds}
              onChange={(ids) => setFormData({ ...formData, batchIds: ids })}
              placeholder={batchOptions.length === 0 ? "No batches available" : "Select batches..."}
            />
            <p className="text-xs text-slate-500 mt-1">
              Instructor will only have access to learners within these batches.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Assigned Modules <span className="text-red-500">*</span>
            </label>
            {formData.batchIds.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                Select batches first to see available modules
              </div>
            ) : (
              <div className="space-y-4">
                {/* Batch Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-2">
                  {allBatches.filter((b) => formData.batchIds.includes(b.id)).map((batch) => (
                    <button
                      key={batch.id}
                      onClick={() => setActiveTab(batch.id)}
                      className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors ${
                        activeTab === batch.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
                          : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                      }`}
                    >
                      {batch.batchTitle}
                    </button>
                  ))}
                </div>

                {/* Modules for Active Batch */}
                {(() => {
                  const activeBatch = allBatches.find(b => b.id === activeTab && formData.batchIds.includes(b.id));
                  if (!activeBatch) return null;

                  const batchModules = availableModulesOptions.filter(m => {
                    return m.group === activeBatch.course?.title;
                  });
                  const selectedForBatch = batchModuleSelections[activeBatch.id] || [];

                  return (
                    <div className="space-y-2">
                      {batchModules.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                          No modules available for this batch
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                          {batchModules.map((module) => {
                            const isSelected = selectedForBatch.includes(module.id);
                            return (
                              <button
                                key={module.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setBatchModuleSelections(prev => ({
                                      ...prev,
                                      [activeBatch.id]: prev[activeBatch.id].filter(id => id !== module.id),
                                    }));
                                  } else {
                                    setBatchModuleSelections(prev => ({
                                      ...prev,
                                      [activeBatch.id]: [...(prev[activeBatch.id] || []), module.id],
                                    }));
                                  }
                                }}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                                  isSelected
                                    ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600/50"
                                    : "bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600/50"
                                } cursor-pointer`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="w-5 h-5 rounded border-2 cursor-pointer"
                                />
                                <span className={`text-sm font-medium ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>
                                  {module.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Selected Count */}
                {(() => {
                  const selectedCount = Object.values(batchModuleSelections).flat().length;
                  return selectedCount > 0 ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600/30">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {selectedCount} module{selectedCount !== 1 ? "s" : ""} selected
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-3">
              Use tabs to switch between batches. Select modules for each batch separately.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
