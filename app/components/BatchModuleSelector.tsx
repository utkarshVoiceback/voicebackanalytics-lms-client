"use client";

import { useState, useMemo } from "react";

interface Module {
  id: string;
  title: string;
}

interface Batch {
  id: string;
  batchTitle: string;
}

interface BatchModuleSelectorProps {
  batches: Batch[];
  modules: Module[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function BatchModuleSelector({
  batches,
  modules,
  selectedIds,
  onChange,
  disabled = false,
}: BatchModuleSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>(batches[0]?.id || "");

  // All modules for this batch (simplified - all modules shown for selected batches)
  const batchModules = useMemo(() => {
    return modules;
  }, [modules]);

  const handleToggle = (moduleId: string) => {
    if (disabled) return;
    if (selectedIds.includes(moduleId)) {
      onChange(selectedIds.filter((id) => id !== moduleId));
    } else {
      onChange([...selectedIds, moduleId]);
    }
  };

  const selectedCount = selectedIds.length;

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-2">
        {batches.map((batch) => (
          <button
            key={batch.id}
            onClick={() => setActiveTab(batch.id)}
            disabled={disabled}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === batch.id
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
                : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {batch.batchTitle}
          </button>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="space-y-2">
        {batchModules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
            {batchModules.map((module) => {
              const isSelected = selectedIds.includes(module.id);
              return (
                <button
                  key={module.id}
                  onClick={() => handleToggle(module.id)}
                  disabled={disabled}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600/50"
                      : "bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600/50"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    disabled={disabled}
                    className="w-5 h-5 rounded border-2 cursor-pointer"
                  />
                  <span className={`text-sm font-medium ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>
                    {module.title}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
            No modules available for selected batches
          </div>
        )}
      </div>

      {/* Selected Count */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600/30">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedCount} module{selectedCount !== 1 ? "s" : ""} selected
          </span>
        </div>
      )}
    </div>
  );
}
