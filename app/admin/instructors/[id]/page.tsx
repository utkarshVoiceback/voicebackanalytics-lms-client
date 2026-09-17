"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { HierarchicalInstructorSelector } from "@/app/components/HierarchicalInstructorSelector";

export default function EditInstructorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const [instructorRes, coursesRes, batchesRes] = await Promise.all([
          apiFetch(`/instructors/${id}`),
          apiFetch("/courses"),
          apiFetch("/batches"),
        ]);

        if (coursesRes.success) setAllCourses(coursesRes.data);
        if (batchesRes.success) setAllBatches(batchesRes.data);

        if (instructorRes.success && instructorRes.data) {
          const instructor = instructorRes.data;
          
          const batchIds = instructor.instructorBatches?.map((ib: any) => ib.batchId) || [];
          const moduleIds = instructor.instructorModules?.map((im: any) => im.moduleId) || [];
          
          // Determine courseIds based on the instructor's batches
          const coursesSet = new Set<string>();
          instructor.instructorBatches?.forEach((ib: any) => {
            if (ib.batch?.courseId) {
              coursesSet.add(ib.batch.courseId);
            }
          });
          const courseIds = Array.from(coursesSet);

          setFormData({
            name: instructor.name || "",
            mobile: instructor.mobile || "",
            email: instructor.email || "",
            courseIds,
            batchIds,
            moduleIds,
          });
        } else {
          window.alert(instructorRes.message || "Failed to load instructor");
          router.push("/admin/instructors");
        }
      } catch (err: any) {
        console.error(err);
        window.alert(err.message || "Failed to load instructor");
        router.push("/admin/instructors");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  // Fetch modules for any newly selected course that isn't cached yet
  useEffect(() => {
    const idsToFetch = formData.courseIds.filter((courseId) => !(courseId in courseModulesMap));
    if (idsToFetch.length === 0) return;

    let cancelled = false;
    const loadModules = async () => {
      setModulesLoading(true);
      try {
        const results = await Promise.all(
          idsToFetch.map((courseId) => apiFetch(`/courses/${courseId}/modules`))
        );
        if (cancelled) return;
        setCourseModulesMap((prev) => {
          const next = { ...prev };
          idsToFetch.forEach((courseId, idx) => {
            const res = results[idx];
            next[courseId] = res.success && res.data ? res.data : [];
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.batchIds.length === 0) return window.alert("Please select at least one batch.");
    if (formData.moduleIds.length === 0) return window.alert("Please select at least one module.");

    // Derive course IDs from selected batches
    const courseIds = Array.from(new Set(
      formData.batchIds
        .map(batchId => allBatches.find(b => b.id === batchId)?.courseId)
        .filter(Boolean)
    ));

    setSaving(true);

    try {
      const res = await apiFetch(`/instructors/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          courseIds,
          batchIds: formData.batchIds,
          moduleIds: formData.moduleIds,
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

          <HierarchicalInstructorSelector
            courses={allCourses}
            batches={allBatches}
            courseModulesMap={courseModulesMap}
            selectedCourses={formData.courseIds}
            selectedBatches={formData.batchIds}
            selectedModules={formData.moduleIds}
            onCoursesChange={(ids) => setFormData(prev => ({ ...prev, courseIds: ids }))}
            onBatchesChange={(ids) => setFormData(prev => ({ ...prev, batchIds: ids }))}
            onModulesChange={(ids) => setFormData(prev => ({ ...prev, moduleIds: ids }))}
            disabled={modulesLoading}
          />

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



