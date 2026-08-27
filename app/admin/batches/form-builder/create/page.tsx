"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { apiFetch } from "@/lib/api";

interface Batch {
  id: string;
  batchTitle: string;
}

interface FormField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "email" | "file" | "select" | "radio";
  required: boolean;
  isStandard: boolean;
  options?: string[];
}

const STANDARD_FIELDS: FormField[] = [
  { key: "fullName", label: "Full Name", type: "text", required: true, isStandard: true },
  { key: "email", label: "Email", type: "email", required: true, isStandard: true },
  { key: "mobile", label: "Mobile", type: "text", required: true, isStandard: true },
  { key: "profilePic", label: "Profile Picture", type: "file", required: false, isStandard: true },
  { key: "address", label: "Address", type: "text", required: false, isStandard: true },
  { key: "dob", label: "Date of Birth", type: "date", required: false, isStandard: true },
  { key: "city", label: "City", type: "text", required: false, isStandard: true },
  { key: "gender", label: "Gender", type: "select", required: false, isStandard: true, options: ["Male", "Female", "Other"] },
  { key: "highestEducation", label: "Highest Education", type: "select", required: false, isStandard: true, options: ["High School", "Associate's Degree", "Bachelor's Degree", "Master's Degree", "PhD", "Other"] },
];

export default function CreateFormPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [formName, setFormName] = useState("");
  const [customFields, setCustomFields] = useState<FormField[]>([]);
  const [removedStandardFields, setRemovedStandardFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user && user.role !== "ADMIN") {
      router.push("/");
    } else {
      fetchBatches();
    }
  }, [isAuthenticated, user, router]);

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/batches");
      if (res.success && res.data) {
        setBatches(res.data);
      } else {
        setError(res.message || "Failed to fetch batches");
      }
    } catch (err: any) {
      setError("Failed to fetch batches: " + (err.message || "Network error"));
    }
    setLoading(false);
  };

  const addCustomField = () => {
    const newField: FormField = {
      key: `custom_${Date.now()}`,
      label: "",
      type: "text",
      required: false,
      isStandard: false,
    };
    setCustomFields([...customFields, newField]);
  };

  const updateCustomField = (index: number, field: Partial<FormField>) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], ...field };
    // If type changes away from select/radio, clear options
    if (field.type && field.type !== "select" && field.type !== "radio") {
      updated[index].options = undefined;
    }
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const removeStandardField = (fieldKey: string) => {
    const updated = new Set(removedStandardFields);
    updated.add(fieldKey);
    setRemovedStandardFields(updated);
  };

  const moveFieldUp = (index: number) => {
    if (index === 0) return;
    const updated = [...customFields];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setCustomFields(updated);
  };

  const moveFieldDown = (index: number) => {
    if (index === customFields.length - 1) return;
    const updated = [...customFields];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setCustomFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBatchId) {
      setError("Please select a batch");
      return;
    }

    if (!formName.trim()) {
      setError("Please enter a form name");
      return;
    }

    // Validate custom fields
    for (const field of customFields) {
      if (!field.label.trim()) {
        setError("All custom fields must have a label");
        return;
      }
      if ((field.type === "select" || field.type === "radio") && (!field.options || field.options.length === 0)) {
        setError(`Field "${field.label}" requires at least one option`);
        return;
      }
    }

    setSaving(true);

    // Filter out removed standard fields
    const activeStandardFields = STANDARD_FIELDS.filter((field) => !removedStandardFields.has(field.key));
    const fields = [...activeStandardFields, ...customFields];

    const res = await apiFetch("/form-templates", {
      method: "POST",
      body: JSON.stringify({
        batchId: selectedBatchId,
        name: formName,
        fields,
      }),
    });

    if (res.success && res.data) {
      setTemplateId(res.data.id);
      setSuccess(true);
    } else {
      setError(res.message || "Failed to create form template");
    }

    setSaving(false);
  };

  const downloadTemplate = async () => {
    if (!templateId) return;

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
      const downloadUrl = `${apiBaseUrl}/form-templates/${templateId}/download`;

      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("lms_auth_token")}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(`Failed to download template: ${response.status} ${response.statusText}`);
        console.error("Download error:", errorText);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `form-template.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Failed to download template: " + (err.message || "Network error"));
      console.error("Download error:", err);
    }
  };

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/admin/batches" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-4 inline-block">
        ← Back to Batches
      </Link>

      {success && templateId ? (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-4">Form Created Successfully!</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">Your form template has been created and is ready for use.</p>

          <div className="flex gap-3 mb-8">
            <button
              onClick={downloadTemplate}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
            >
              Download Excel Template
            </button>
            <Link
              href="/admin/batches"
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors inline-block"
            >
              Back to Batches
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              <strong>Next steps:</strong> Download the template above, fill it with your learner data, and upload it from the Active Learners page to create accounts in bulk.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create Form Template</h1>
            <p className="text-slate-500 dark:text-slate-400">Design a custom form for your batch. Standard fields are always included.</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              Select Batch <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Choose a batch...</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Form Name */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              Form Name <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g., Batch A Enrollment Form"
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Standard Fields */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Standard Fields</h3>
            <div className="space-y-3">
              {STANDARD_FIELDS.filter((field) => !removedStandardFields.has(field.key)).map((field) => {
                const isRequired = ["fullName", "email", "mobile"].includes(field.key);

                return (
                  <div key={field.key} className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-slate-900 dark:text-white font-medium">{field.label}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Type: {field.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isRequired && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 text-xs font-semibold">
                            Required
                          </span>
                        )}
                        {!isRequired && (
                          <button
                            type="button"
                            onClick={() => removeStandardField(field.key)}
                            className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Custom Fields (Optional)</h3>
              <button
                type="button"
                onClick={addCustomField}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                + Add Field
              </button>
            </div>

            {customFields.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No custom fields added yet. Click &quot;Add Field&quot; to add one.</p>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={field.key} className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateCustomField(index, { label: e.target.value })}
                        placeholder="Field label (e.g., Qualification)"
                        className="rounded border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateCustomField(index, { type: e.target.value as any })}
                        className="rounded border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="file">File Upload</option>
                        <option value="select">Dropdown (Select)</option>
                        <option value="radio">Radio Buttons</option>
                      </select>
                    </div>

                    {/* Options input for select/radio */}
                    {(field.type === "select" || field.type === "radio") && (
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Options (comma-separated) <span className="text-red-600 dark:text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={(field.options || []).join(", ")}
                          onChange={(e) =>
                            updateCustomField(index, {
                              options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                            })
                          }
                          placeholder="e.g., Option A, Option B, Option C"
                          className="w-full rounded border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateCustomField(index, { required: e.target.checked })}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-sm">Required</span>
                      </label>

                      {/* Reorder buttons */}
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => moveFieldUp(index)}
                          disabled={index === 0}
                          className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFieldDown(index)}
                          disabled={index === customFields.length - 1}
                          className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving || loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? "Creating..." : "Create Form"}
            </button>
            <Link
              href="/admin/batches"
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors inline-flex items-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
