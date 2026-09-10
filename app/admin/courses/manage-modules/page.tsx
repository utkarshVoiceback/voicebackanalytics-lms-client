"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import EditModuleSettingsModal from "./components/EditModuleSettingsModal";

interface Module {
  courseModuleId: string;
  moduleId: string;
  moduleName: string;
  sequenceOrder: number;
  isSequential: boolean;
  status: string;
  contentsCount: number;
}

export default function ManageModulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "";
  const courseName = searchParams.get("courseName") || "Course";

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchModules();
    }
  }, [courseId]);

  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch(`/courses/${courseId}/modules`);
    if (res.success && res.data) {
      const sorted = [...res.data].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
      setModules(sorted);
    } else {
      setError(res.message || "Failed to load modules");
    }
    setLoading(false);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, moduleId: string) => {
    setDraggedItem(moduleId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetModuleId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetModuleId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = modules.findIndex((m) => m.courseModuleId === draggedItem);
    const targetIndex = modules.findIndex((m) => m.courseModuleId === targetModuleId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const newModules = [...modules];
    [newModules[draggedIndex], newModules[targetIndex]] = [
      newModules[targetIndex],
      newModules[draggedIndex],
    ];

    setModules(newModules);
    setDraggedItem(null);
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    setError(null);

    const orderedCourseModuleIds = modules.map((m) => m.courseModuleId);

    const res = await apiFetch(`/courses/${courseId}/modules/reorder`, {
      method: "PUT",
      body: JSON.stringify({ orderedCourseModuleIds }),
    });

    if (res.success) {
      setError(null);
    } else {
      setError(res.message || "Failed to save module order");
    }

    setSaving(false);
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setShowEditModal(true);
  };

  const handleUpdateModule = (updatedModule: Module) => {
    setModules(
      modules.map((m) =>
        m.courseModuleId === updatedModule.courseModuleId ? updatedModule : m
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Modules</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{courseName}</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">No modules found for this course</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Drag and drop to reorder modules
            </p>

            {modules.map((module, index) => (
              <div
                key={module.courseModuleId}
                draggable
                onDragStart={(e) => handleDragStart(e, module.courseModuleId)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, module.courseModuleId)}
                className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all cursor-move bg-white dark:bg-slate-900 ${
                  draggedItem === module.courseModuleId
                    ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10 opacity-70"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Drag Handle */}
                <div className="flex-shrink-0 text-slate-400 dark:text-slate-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm4-8h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2z" />
                  </svg>
                </div>

                {/* Sequence Number */}
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-lg">
                  {index + 1}
                </div>

                {/* Module Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {module.moduleName}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        module.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                          : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30"
                      }`}
                    >
                      {module.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {module.contentsCount} content item(s)
                    </span>
                    {module.isSequential && (
                      <span className="inline-flex items-center text-xs text-amber-600 dark:text-amber-400">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                          />
                        </svg>
                        Sequential
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => handleEdit(module)}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-200 dark:border-blue-500/30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 20.25h3.75a4.5 4.5 0 001.13-1.897l9.856-9.856z"
                    />
                  </svg>
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer with Save Button */}
        {!loading && modules.length > 0 && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSaveOrder}
              disabled={saving}
              className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {saving ? "Saving Order..." : "Save Module Order"}
            </button>
          </div>
        )}
      </div>

      {/* Edit Settings Modal */}
      {editingModule && (
        <EditModuleSettingsModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingModule(null);
          }}
          module={editingModule}
          courseId={courseId}
          onUpdate={handleUpdateModule}
        />
      )}
    </div>
  );
}
