import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function AppConfigSection() {
  const [organisationName, setOrganisationName] = useState("");
  const [useCustomLogo, setUseCustomLogo] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/app-config");
      if (res.success && res.data) {
        setOrganisationName(res.data.ORGANISATION_NAME || "");
        setUseCustomLogo(res.data.USE_CUSTOM_LOGO === "true");
        setCustomLogoUrl(res.data.CUSTOM_LOGO_URL || "");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch app configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate logo requirement
      if (useCustomLogo && !logoFile && !customLogoUrl) {
        throw new Error("Please upload a logo image before enabling custom logo");
      }

      // 1. Upload logo if there is a new file
      if (logoFile && useCustomLogo) {
        const formData = new FormData();
        formData.append("logo", logoFile);

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
        const uploadRes = await fetch(`${apiBaseUrl}/app-config/upload-logo`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("lms_auth_token")}`,
          },
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.data) {
          setCustomLogoUrl(uploadData.data.url);
        } else {
          throw new Error(uploadData.message || "Failed to upload custom logo");
        }
      }

      // 2. Save organisation name and boolean flags
      const res = await apiFetch("/app-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ORGANISATION_NAME: organisationName,
          USE_CUSTOM_LOGO: useCustomLogo && (logoFile || customLogoUrl) ? "true" : "false"
        })
      });

      if (res.success) {
        setSuccess("Application configuration saved successfully!");
        setLogoFile(null);
      } else {
        throw new Error(res.message || "Failed to save configuration");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mt-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Application Config & Branding</h2>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        {/* Organisation Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Organisation Name
          </label>
          <input
            type="text"
            value={organisationName}
            onChange={(e) => setOrganisationName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your organisation name..."
          />
        </div>

        {/* Custom Logo Switch */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setUseCustomLogo(!useCustomLogo)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              useCustomLogo ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useCustomLogo ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Enable Custom Logo
          </span>
        </div>

        {/* Custom Logo Upload */}
        {useCustomLogo && (
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 bg-slate-50 dark:bg-slate-800/30">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Upload Logo Image (PNG, JPG, WebP)
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
              />
            </div>
            
            {(logoFile || customLogoUrl) && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Current/Preview Logo:</p>
                <div className="h-16 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 overflow-hidden w-fit">
                  {logoFile ? (
                    <img src={URL.createObjectURL(logoFile)} alt="Preview" className="max-h-full max-w-[200px] object-contain" />
                  ) : (
                    <img src={customLogoUrl} alt="Custom Logo" className="max-h-full max-w-[200px] object-contain" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
