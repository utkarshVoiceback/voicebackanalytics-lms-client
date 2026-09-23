"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { HierarchicalInstructorSelector, BatchModuleSelection } from "@/app/components/HierarchicalInstructorSelector";

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
    batchModules: [] as BatchModuleSelection[],
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

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  // ref holds the current blob URL so the unmount cleanup can revoke it safely
  const photoPreviewUrlRef = useRef<string | null>(null);

  // Revoke blob URL only on component unmount (avoids Strict Mode double-revoke bug)
  useEffect(() => {
    return () => {
      if (photoPreviewUrlRef.current) {
        URL.revokeObjectURL(photoPreviewUrlRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Revoke previous blob URL before creating a new one
      if (photoPreviewUrlRef.current) {
        URL.revokeObjectURL(photoPreviewUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      photoPreviewUrlRef.current = url;
      setPhoto(file);
      setPhotoPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.courseIds.length === 0) return window.alert("Please select at least one course.");
    if (formData.batchIds.length === 0) return window.alert("Please select at least one batch.");
    if (formData.batchModules.length === 0) return window.alert("Please select at least one module.");

    setLoading(true);

    try {
      const res = await apiFetch("/instructors", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.success && res.data) {
        // Upload photo if selected
        if (photo) {
          const photoData = new FormData();
          photoData.append("photo", photo);
          await apiFetch(`/instructors/${res.data.id}/upload-photo`, {
            method: "POST",
            body: photoData,
          });
        }

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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              {/* Preview Circle */}
              <div className="flex-shrink-0">
                {photoPreviewUrl ? (
                  <img
                    src={photoPreviewUrl}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400">
                    <svg className="w-6 h-6 mb-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    <span className="text-xs">No photo</span>
                  </div>
                )}
              </div>

              {/* File Input + Clear */}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handlePhotoChange}
                  className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 cursor-pointer"
                />
                {photoPreviewUrl && (
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreviewUrl(null); }}
                    className="mt-1.5 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    ✕ Remove photo
                  </button>
                )}
                <p className="mt-1 text-xs text-slate-400">JPG, PNG, WEBP · Max 5 MB</p>
              </div>
            </div>
          </div>

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
            selectedModules={formData.batchModules}
            onCoursesChange={(ids) => setFormData((prev) => ({ ...prev, courseIds: ids }))}
            onBatchesChange={(ids) => setFormData((prev) => ({ ...prev, batchIds: ids }))}
            onModulesChange={(selections) => setFormData((prev) => ({ ...prev, batchModules: selections }))}
            disabled={modulesLoading}
          />

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
