"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Module {
  courseModuleId: string;
  moduleId: string;
  moduleName: string;
  sequenceOrder: number;
  isSequential: boolean;
  status: string;
  contentsCount: number;
  dependencies?: { courseModuleId: string; moduleName: string }[];
}

interface CourseModule {
  courseModuleId: string;
  moduleName: string;
  sequenceOrder: number;
  isSequential: boolean;
}

interface EditModuleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: Module;
  courseId: string;
  onUpdate: (module: Module) => void;
}

export default function EditModuleSettingsModal({
  isOpen,
  onClose,
  module,
  courseId,
  onUpdate,
}: EditModuleSettingsModalProps) {
  const [isSequential, setIsSequential] = useState(module.isSequential);
  const [displaySequenceOrder, setDisplaySequenceOrder] = useState(true);
  const [dependencyCourseModuleIds, setDependencyCourseModuleIds] = useState<string[]>([]);
  const [availableModules, setAvailableModules] = useState<CourseModule[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsSequential(module.isSequential);
      setDisplaySequenceOrder(true);
      setError(null);
      setDependencyCourseModuleIds(
        module.dependencies?.map((d) => d.courseModuleId) || []
      );
      fetchAvailableModules();
    }
  }, [isOpen, module]);

  const fetchAvailableModules = async () => {
    const res = await apiFetch(`/courses/${courseId}/modules`);
    if (res.success && res.data) {
      const modules = res.data.filter(
        (m: CourseModule) => m.courseModuleId !== module.courseModuleId
      );
      setAvailableModules(modules);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Update module settings
      const settingsRes = await apiFetch(
        `/courses/${courseId}/modules/${module.courseModuleId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            isSequential,
          }),
        }
      );

      if (!settingsRes.success) {
        throw new Error(settingsRes.message || "Failed to update module settings");
      }

      // Update dependencies if sequential is enabled
      if (isSequential) {
        const depsRes = await apiFetch(
          `/courses/${courseId}/modules/${module.courseModuleId}/dependencies`,
          {
            method: "PUT",
            body: JSON.stringify({
              dependencyCourseModuleIds,
            }),
          }
        );

        if (!depsRes.success) {
          throw new Error(depsRes.message || "Failed to update dependencies");
        }
      }

      onUpdate({
        ...module,
        isSequential,
        dependencies: isSequential
          ? dependencyCourseModuleIds.map((id) => {
              const depModule = availableModules.find(
                (m) => m.courseModuleId === id
              );
              return {
                courseModuleId: id,
                moduleName: depModule?.moduleName || "",
              };
            })
          : [],
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    }

    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-8 text-left align-middle shadow-2xl transition-all m-4 border border-slate-200 dark:border-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Edit Course Dependencies
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {module.moduleName}
          </p>
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
        <div className="space-y-6 mb-8">
          {/* Prerequisite Dependencies Toggle */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Prerequisite Dependencies
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Learners must complete selected modules before this one.
                </p>
              </div>
              <button
                onClick={() => setIsSequential(!isSequential)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  isSequential
                    ? "bg-blue-600"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isSequential ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Dependency Selector - Show when Sequential is ON */}
            {isSequential && (
              <div className="border-l-2 border-blue-400 dark:border-blue-600 pl-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select prerequisite modules
                </label>
                <div className="space-y-2">
                  {/* Selected dependencies chips */}
                  {dependencyCourseModuleIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {dependencyCourseModuleIds.map((depId) => {
                        const depModule = availableModules.find(
                          (m) => m.courseModuleId === depId
                        );
                        return (
                          <span
                            key={depId}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full border border-blue-200 dark:border-blue-700"
                          >
                            {depModule?.moduleName || "Unknown"}
                            <button
                              type="button"
                              onClick={() =>
                                setDependencyCourseModuleIds(
                                  dependencyCourseModuleIds.filter(
                                    (id) => id !== depId
                                  )
                                )
                              }
                              className="text-blue-500 hover:text-blue-800 dark:hover:text-blue-100"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18 18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom multi-select list with checkboxes */}
                  <div className="space-y-2 border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 max-h-64 overflow-y-auto">
                    {availableModules.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 text-sm py-4 text-center">
                        No other modules available
                      </p>
                    ) : (
                      availableModules
                        .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                        .map((m) => {
                          const isSelected = dependencyCourseModuleIds.includes(m.courseModuleId);
                          return (
                            <button
                              key={m.courseModuleId}
                              type="button"
                              onClick={() => {
                                setDependencyCourseModuleIds(
                                  isSelected
                                    ? dependencyCourseModuleIds.filter((id) => id !== m.courseModuleId)
                                    : [...dependencyCourseModuleIds, m.courseModuleId]
                                );
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                                isSelected
                                  ? "bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/30"
                                  : "bg-slate-50 dark:bg-slate-700/50 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              <span
                                className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-slate-300 dark:border-slate-600"
                                }`}
                              >
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                )}
                              </span>
                              <span className={`text-sm font-medium ${isSelected ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-slate-300"}`}>
                                {m.sequenceOrder}. {m.moduleName}
                              </span>
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Display Sequence Order Option */}
          {/* <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Display Sequence Order
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Show module sequence numbers to learners.
                </p>
              </div>
              <button
                onClick={() => setDisplaySequenceOrder(!displaySequenceOrder)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  displaySequenceOrder
                    ? "bg-blue-600"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    displaySequenceOrder ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div> */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {saving && (
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {saving ? "Saving..." : "Save Course Config"}
          </button>
        </div>
      </div>
    </div>
  );
}
