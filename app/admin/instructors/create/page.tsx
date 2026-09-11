"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { MultiSelect, Option } from "@/app/components/MultiSelect";

export default function CreateInstructorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    courseIds: [] as string[],
    batchIds: [] as string[],
    moduleIds: [] as string[],
  });

  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [allBatches, setAllBatches] = useState<any[]>([]);
  // courseId -> modules returned by GET /courses/:id/modules
  const [courseModulesMap, setCourseModulesMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, batchesRes] = await Promise.all([
          apiFetch("/courses"),
          apiFetch("/batches"),
        ]);
        if (coursesRes.success) setAllCourses(coursesRes.data);
        if (batchesRes.success) setAllBatches(batchesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  // Fetch modules for any newly selected course that isn't cached yet
  useEffect(() => {
    const idsToFetch = formData.courseIds.filter((id) => !(id in courseModulesMap));
    if (idsToFetch.length === 0) return;

    let cancelled = false;
    const loadModules = async () => {
      setModulesLoading(true);
      try {
        const results = await Promise.all(
          idsToFetch.map((id) => apiFetch(`/courses/${id}/modules`))
        );
        if (cancelled) return;
        setCourseModulesMap((prev) => {
          const next = { ...prev };
          idsToFetch.forEach((id, idx) => {
            const res = results[idx];
            next[id] = res.success && res.data ? res.data : [];
          });
          return next;
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setModulesLoading(false);
      }
    };
    loadModules();

    return () => {
      cancelled = true;
    };
  }, [formData.courseIds, courseModulesMap]);

  const courseOptions: Option[] = useMemo(() => {
    return allCourses.map((c) => ({ id: c.id, label: c.title }));
  }, [allCourses]);

  // Batches are restricted to the selected courses (Batch.courseId is a direct column)
  const batchOptions: Option[] = useMemo(() => {
    if (formData.courseIds.length === 0) return [];
    const selectedCourseIds = new Set(formData.courseIds);
    return allBatches
      .filter((b) => selectedCourseIds.has(b.courseId))
      .map((b) => ({ id: b.id, label: b.batchTitle, group: b.course?.title }));
  }, [allBatches, formData.courseIds]);

  // Modules are combined across all selected courses (via CourseModule mapping fetched per course)
  const availableModulesOptions: Option[] = useMemo(() => {
    if (formData.courseIds.length === 0) return [];
    const seen = new Map<string, Option>();
    formData.courseIds.forEach((courseId) => {
      const courseTitle = allCourses.find((c) => c.id === courseId)?.title;
      const mods = courseModulesMap[courseId] || [];
      mods.forEach((m: any) => {
        if (!seen.has(m.moduleId)) {
          seen.set(m.moduleId, { id: m.moduleId, label: m.moduleName, group: courseTitle });
        }
      });
    });
    return Array.from(seen.values());
  }, [formData.courseIds, courseModulesMap, allCourses]);

  // Clear batches that are no longer valid when the selected courses change
  useEffect(() => {
    const validBatchIds = new Set(batchOptions.map((o) => o.id));
    setFormData((prev) => {
      const newBatchIds = prev.batchIds.filter((id) => validBatchIds.has(id));
      if (newBatchIds.length === prev.batchIds.length) return prev;
      return { ...prev, batchIds: newBatchIds };
    });
  }, [batchOptions]);

  // Clear modules that are no longer valid when the selected courses change
  useEffect(() => {
    const validModuleIds = new Set(availableModulesOptions.map((o) => o.id));
    setFormData((prev) => {
      const newModuleIds = prev.moduleIds.filter((id) => validModuleIds.has(id));
      if (newModuleIds.length === prev.moduleIds.length) return prev;
      return { ...prev, moduleIds: newModuleIds };
    });
  }, [availableModulesOptions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.courseIds.length === 0) return window.alert("Please select at least one course.");
    if (formData.batchIds.length === 0) return window.alert("Please select at least one batch.");
    if (formData.moduleIds.length === 0) return window.alert("Please select at least one module.");

    setLoading(true);

    try {
      const res = await apiFetch("/instructors", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.success) {
        window.alert("Instructor created and credentials sent via email!");
        router.push("/admin/instructors");
      } else {
        window.alert(res.message || "Failed to create instructor");
      }
    } catch (err: any) {
      window.alert(err.message || "Failed to create instructor");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-slate-500">Loading form data...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Instructor</h1>
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
              Assigned Courses <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              options={courseOptions}
              selectedIds={formData.courseIds}
              onChange={(ids) => setFormData({ ...formData, courseIds: ids })}
              placeholder={courseOptions.length === 0 ? "No courses available" : "Select courses..."}
            />
            <p className="text-xs text-slate-500 mt-1">
              Select the courses this instructor will be responsible for. Available batches and modules depend on this selection.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Assigned Batches <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              options={batchOptions}
              selectedIds={formData.batchIds}
              onChange={(ids) => setFormData({ ...formData, batchIds: ids })}
              placeholder={
                formData.courseIds.length === 0
                  ? "Select courses first"
                  : batchOptions.length === 0
                  ? "No batches available for selected courses"
                  : "Select batches..."
              }
              disabled={formData.courseIds.length === 0}
            />
            <p className="text-xs text-slate-500 mt-1">
              Only batches belonging to the selected courses are shown. Instructor will only have access to learners within these batches.
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
              placeholder={
                formData.courseIds.length === 0
                  ? "Select courses first"
                  : modulesLoading
                  ? "Loading modules..."
                  : availableModulesOptions.length === 0
                  ? "No modules available for selected courses"
                  : "Select modules..."
              }
              disabled={formData.courseIds.length === 0 || modulesLoading}
            />
            <p className="text-xs text-slate-500 mt-1">
              Only modules belonging to the selected courses are shown. Instructor will only see these modules within their assigned batches.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Instructor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
