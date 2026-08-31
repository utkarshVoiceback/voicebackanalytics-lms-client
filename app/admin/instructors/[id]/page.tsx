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
    moduleIds: [] as string[],
  });

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
          setFormData({
            name: instructor.name,
            mobile: instructor.mobile,
            email: instructor.email,
            batchIds: instructor.instructorBatches?.map((ib: any) => ib.batchId) || [],
            moduleIds: instructor.instructorModules?.map((im: any) => im.moduleId) || [],
          });
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

  // Whenever selected batches change, we must remove moduleIds that are no longer valid
  useEffect(() => {
    if (formData.moduleIds.length > 0 && availableModulesOptions.length > 0 && !loading) {
      const validModuleIds = new Set(availableModulesOptions.map(m => m.id));
      const newModuleIds = formData.moduleIds.filter(moduleId => validModuleIds.has(moduleId));
      if (newModuleIds.length !== formData.moduleIds.length) {
        setFormData(prev => ({ ...prev, moduleIds: newModuleIds }));
      }
    }
  }, [availableModulesOptions, loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.batchIds.length === 0) return window.alert("Please select at least one batch.");
    if (formData.moduleIds.length === 0) return window.alert("Please select at least one module.");
    
    setSaving(true);

    try {
      const res = await apiFetch(`/instructors/${id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Assigned Modules <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              options={availableModulesOptions}
              selectedIds={formData.moduleIds}
              onChange={(ids) => setFormData({ ...formData, moduleIds: ids })}
              placeholder={formData.batchIds.length === 0 ? "Select batches first" : (availableModulesOptions.length === 0 ? "No modules available for selected batches" : "Select modules...")}
              disabled={formData.batchIds.length === 0}
            />
            <p className="text-xs text-slate-500 mt-1">
              Select batches above to see available modules. Instructor will only see these modules within their assigned batches.
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
