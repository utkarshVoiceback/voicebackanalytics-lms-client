"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface DynamicField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "email" | "file" | "select" | "radio";
  required: boolean;
  value: string | number | null;
  options?: string[];
}

interface Props {
  fields: DynamicField[];
  onClose: () => void;
  onSaved: (fields: DynamicField[]) => void;
}

export default function EditEnrollmentFieldsModal({ fields, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      if (field.type !== "file") {
        initial[field.key] = field.value !== null && field.value !== undefined ? String(field.value) : "";
      }
    }
    return initial;
  });
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClasses =
    "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const formData = new FormData();
    for (const field of fields) {
      if (field.type === "file") {
        if (files[field.key]) {
          formData.append(field.key, files[field.key] as File);
        }
      } else {
        formData.append(field.key, values[field.key] ?? "");
      }
    }

    const res = await apiFetch("/learner/profile/fields", {
      method: "PUT",
      body: formData,
    });

    if (res.success && res.data) {
      onSaved(res.data.dynamicFields);
    } else {
      setError(res.message || "Failed to update your details");
    }
    setSaving(false);
  };

  const renderField = (field: DynamicField) => {
    if (field.type === "file") {
      const currentUrl = typeof field.value === "string" ? field.value : null;
      return (
        <div>
          {currentUrl && !files[field.key] && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mb-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              View current file
            </a>
          )}
          <input
            type="file"
            onChange={(e) => setFiles({ ...files, [field.key]: e.target.files?.[0] || null })}
            className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-sm file:font-semibold hover:file:bg-blue-500"
          />
        </div>
      );
    }

    if (field.type === "select" || field.type === "radio") {
      return (
        <select
          value={values[field.key] || ""}
          onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
          required={field.required}
          className={inputClasses}
        >
          <option value="">Select {field.label}</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type}
        value={values[field.key] || ""}
        onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
        required={field.required}
        className={inputClasses}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Update Enrollment Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                {field.label}
                {field.required && <span className="text-red-600 dark:text-red-400"> *</span>}
              </label>
              {renderField(field)}
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
