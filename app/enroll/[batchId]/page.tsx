"use client";

import { useEffect, useState, use, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface FormField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "email" | "file" | "select" | "radio";
  required: boolean;
  isStandard: boolean;
  options?: string[];
}

interface FormTemplateData {
  id: string;
  name: string;
  fields: FormField[];
}

interface BatchDetails {
  id: string;
  batchTitle: string;
  startDate: string;
  endDate: string;
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  status: string;
  formTemplate: FormTemplateData | null;
}

export default function EnrollmentPage({ params }: { params: Promise<{ batchId: string }> }) {
  const router = useRouter();
  const { batchId } = use(params);

  const [batchLoading, setBatchLoading] = useState(true);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batch, setBatch] = useState<BatchDetails | null>(null);

  // Password fields (not part of template, always present)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Dynamic fields state
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  const [dynamicFiles, setDynamicFiles] = useState<Record<string, File | null>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (batchId) {
      fetchBatchDetails();
    }
  }, [batchId]);

  const fetchBatchDetails = async () => {
    setBatchLoading(true);
    setBatchError(null);
    const res = await apiFetch<BatchDetails>(`/public-enrollments/batch/${batchId}`);
    if (res.success && res.data) {
      setBatch(res.data);
    } else {
      setBatchError("This enrollment link is invalid or no longer available.");
    }
    setBatchLoading(false);
  };

  const updateDynamicValue = (key: string, value: any) => {
    setDynamicValues((prev) => ({ ...prev, [key]: value }));
  };

  const updateDynamicFile = (key: string, file: File | null) => {
    setDynamicFiles((prev) => ({ ...prev, [key]: file }));
  };

  // Client-side validation of all template fields (standard + custom)
  const validateDynamic = (): string | null => {
    if (!batch?.formTemplate) return null;

    for (const field of batch.formTemplate.fields) {
      const value = dynamicValues[field.key];
      const file = dynamicFiles[field.key];

      if (field.type === "file") {
        if (field.required && !file) {
          return `"${field.label}" is required`;
        }
        continue;
      }

      if (field.required && (value === undefined || value === null || value === "")) {
        return `"${field.label}" is required`;
      }

      if (value !== undefined && value !== null && value !== "") {
        if (field.type === "number" && isNaN(Number(value))) {
          return `"${field.label}" must be a valid number`;
        }
        if (field.type === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return `"${field.label}" must be a valid email`;
          }
        }
        if ((field.type === "select" || field.type === "radio") && field.options) {
          if (!field.options.includes(value)) {
            return `Invalid value for "${field.label}"`;
          }
        }
      }
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match");
      return;
    }

    // Validate all template fields
    const dynamicError = validateDynamic();
    if (dynamicError) {
      setSubmitError(dynamicError);
      return;
    }

    setSubmitting(true);

    // Determine if we have file uploads
    const hasFiles = Object.values(dynamicFiles).some((f) => f !== null);

    let res;

    if (hasFiles) {
      // Use FormData for multipart upload
      const formData = new FormData();
      formData.append("password", password);

      // Add all template field values
      for (const [key, value] of Object.entries(dynamicValues)) {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, String(value));
        }
      }

      // Add files
      for (const [key, file] of Object.entries(dynamicFiles)) {
        if (file) {
          formData.append(key, file);
        }
      }

      res = await apiFetch(`/public-enrollments/batch/${batchId}`, {
        method: "POST",
        body: formData,
      });
    } else {
      // Standard JSON submission
      const body: Record<string, any> = { password };

      // Add all template field values
      for (const [key, value] of Object.entries(dynamicValues)) {
        if (value !== undefined && value !== null && value !== "") {
          body[key] = value;
        }
      }

      res = await apiFetch(`/public-enrollments/batch/${batchId}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    }

    if (res.success && res.data) {
      setSuccess(true);
    } else {
      setSubmitError(res.message || "Unable to submit your enrollment. Please try again.");
    }
    setSubmitting(false);
  };

  // Render a single dynamic field based on its type
  const renderDynamicField = (field: FormField) => {
    const inputClasses =
      "w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

    switch (field.type) {
      case "text":
      case "email":
      case "number":
      case "date":
        return (
          <input
            type={field.type}
            value={dynamicValues[field.key] || ""}
            onChange={(e) => updateDynamicValue(field.key, e.target.value)}
            required={field.required}
            className={inputClasses}
            placeholder={field.label}
          />
        );

      case "select":
        return (
          <select
            value={dynamicValues[field.key] || ""}
            onChange={(e) => updateDynamicValue(field.key, e.target.value)}
            required={field.required}
            className={inputClasses}
          >
            <option value="">-- Select --</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="flex flex-wrap gap-4 py-2">
            {(field.options || []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name={field.key}
                  value={opt}
                  checked={dynamicValues[field.key] === opt}
                  onChange={(e) => updateDynamicValue(field.key, e.target.value)}
                  required={field.required && !dynamicValues[field.key]}
                  className="accent-blue-500"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "file":
        return (
          <div>
            <input
              type="file"
              onChange={(e) => updateDynamicFile(field.key, e.target.files?.[0] || null)}
              required={field.required}
              accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
              className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer file:transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1">
              Allowed: JPG, PNG, WEBP, PDF, DOC (max 5MB)
            </p>
            {dynamicFiles[field.key] && (
              <p className="text-xs text-emerald-400 mt-1">
                Selected: {dynamicFiles[field.key]!.name}
              </p>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={dynamicValues[field.key] || ""}
            onChange={(e) => updateDynamicValue(field.key, e.target.value)}
            required={field.required}
            className={inputClasses}
            placeholder={field.label}
          />
        );
    }
  };

  if (batchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-slate-400 font-medium">Loading enrollment form...</p>
        </div>
      </div>
    );
  }

  if (batchError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Invalid Enrollment Link</h1>
          <p className="text-slate-400 mb-8">{batchError}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Enrollment Successful!</h1>
          <p className="text-slate-400 text-lg mb-8">
            Thank you for registering. You have successfully submitted your enrollment for:
          </p>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8 text-left space-y-3">
            <h2 className="text-xl font-bold text-white mb-2">{batch?.batchTitle}</h2>
            <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
              <span className="text-slate-400">Start Date</span>
              <span className="font-medium text-white">{batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
              <span className="text-slate-400">End Date</span>
              <span className="font-medium text-white">{batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          <button onClick={() => router.push("/login")} className="w-full rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Get fields from FormTemplate, or use standard hardcoded fields if no template
  const formTemplate = batch?.formTemplate;
  const standardFields = formTemplate
    ? formTemplate.fields.filter((f) => f.isStandard)
    : null;
  const customFields = formTemplate
    ? formTemplate.fields.filter((f) => !f.isStandard)
    : [];

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">Student Enrollment Form</h1>
          <p className="text-slate-400 text-lg">Please fill out the form below to register for the batch.</p>
        </div>

        {submitError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span className="font-medium">{submitError}</span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Batch Info Section */}
          <div className="bg-blue-900/20 border-b border-slate-800 p-8">
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Batch Information</h2>
            <div className="bg-slate-950/50 rounded-2xl border border-slate-800/80 p-6 space-y-3">
              <h3 className="text-2xl font-bold text-white">{batch?.batchTitle}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Start Date</p>
                    <p className="text-sm font-bold text-slate-300">{batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">End Date</p>
                    <p className="text-sm font-bold text-slate-300">{batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {/* Form Template Fields (from batch form configuration) */}
            {formTemplate && formTemplate.fields.length > 0 ? (
              <>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Personal Information</h2>
                <div className="space-y-6">
                  {formTemplate.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {field.label} {field.required && <span className="text-red-400">*</span>}
                      </label>
                      {renderDynamicField(field)}
                    </div>
                  ))}

                  {/* Password fields (not in template, always required) */}
                  <div className="mt-8 pt-6 border-t border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Account Security</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                          Password <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="password"
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          placeholder="Create a password"
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                          Confirm Password <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="confirmPassword"
                          type="password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          placeholder="Confirm password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Fallback when no template exists */
              <>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Personal Information</h2>
                <div className="space-y-6">
                  <p className="text-slate-400">Loading form fields...</p>
                </div>
              </>
            )}

            <div className="mt-10 pt-6 border-t border-slate-800">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Submitting Enrollment...
                  </span>
                ) : (
                  "Submit Enrollment"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
