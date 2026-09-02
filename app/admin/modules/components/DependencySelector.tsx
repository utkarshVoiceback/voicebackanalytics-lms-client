"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

interface Module {
  id: string;
  title: string;
}

interface Props {
  courseId: string;
  currentModuleId?: string; // the module being created/edited
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function DependencySelector({ courseId, currentModuleId, selectedIds, onChange }: Props) {
  const [modules, setModules] = useState<Module[]>([]);
  const [forbiddenIds, setForbiddenIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_auth_token") : null;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch all course modules
  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/modules?courseId=${courseId}`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setModules(data.data as Module[]);
        }
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  // Fetch forbidden IDs (circular protection) whenever currentModuleId is known
  useEffect(() => {
    if (!currentModuleId) {
      // For new module creation: only self is forbidden
      setForbiddenIds(new Set());
      return;
    }
    fetch(`${API_BASE_URL}/modules/${currentModuleId}/forbidden-dependencies`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.forbiddenIds) {
          setForbiddenIds(new Set(data.data.forbiddenIds));
        }
      })
      .catch(() => {
        // Graceful fallback: at minimum exclude self
        if (currentModuleId) setForbiddenIds(new Set([currentModuleId]));
      });
  }, [currentModuleId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = modules
    .filter((m) => m.id !== currentModuleId && !forbiddenIds.has(m.id))
    .filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const remove = (id: string) => onChange(selectedIds.filter((x) => x !== id));

  const selectedModules = modules.filter((m) => selectedIds.includes(m.id));

  return (
    <div className="space-y-3" ref={dropRef}>
      {/* Selected chips */}
      {selectedModules.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedModules.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full border border-blue-200 dark:border-blue-700"
            >
              {m.title}
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="text-blue-500 hover:text-blue-800 dark:hover:text-blue-100"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm hover:border-blue-500 transition-colors"
        >
          <span>
            {selectedModules.length === 0
              ? "Select prerequisite modules..."
              : `${selectedModules.length} module${selectedModules.length > 1 ? "s" : ""} selected`}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search modules..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {loading ? (
                <div className="py-6 text-center text-sm text-slate-400">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">No modules found.</div>
              ) : (
                filtered.map((m) => {
                  const checked = selectedIds.includes(m.id);

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggle(m.id)}
                      className={[
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                        checked
                          ? "bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800",
                      ].join(" ")}
                    >
                      {/* Checkbox indicator */}
                      <span
                        className={[
                          "flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center",
                          checked
                            ? "bg-blue-600 border-blue-600"
                            : "border-slate-400 dark:border-slate-500",
                        ].join(" ")}
                      >
                        {checked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </span>

                      {/* Module title */}
                      <span className="text-slate-800 dark:text-slate-200">
                        {m.title}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
