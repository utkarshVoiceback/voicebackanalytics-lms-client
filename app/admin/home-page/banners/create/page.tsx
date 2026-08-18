"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAppSelector } from "@/store";
import { apiFetch, getImageUrl } from "@/lib/api";

export default function CreateBannerPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    buttonText: "",
    buttonUrl: "",
    displayOrder: 0,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create banner
      const bannerRes = await apiFetch("/admin/home-banners", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (!bannerRes.success || !bannerRes.data) {
        throw new Error(bannerRes.message || "Failed to create banner");
      }

      const bannerId = bannerRes.data.id;

      // Step 2: Upload image if selected
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", selectedFile);

        setUploadingImage(true);
        const uploadRes = await apiFetch(`/admin/home-banners/${bannerId}/upload-image`, {
          method: "POST",
          body: uploadFormData,
        });

        setUploadingImage(false);

        if (!uploadRes.success) {
          console.error("Image upload failed, but banner was created");
        }
      }

      router.push("/admin/home-page/banners");
    } catch (err: any) {
      setError(err.message || "Failed to create banner");
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/home-page/banners"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors mb-2 inline-block"
        >
          ← Back to Banners
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Create New Banner</h1>
        <p className="text-slate-400">Add a new banner to the home page slider</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                Title (Optional)
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Learn New Skills"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Banner description or call-to-action text"
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Button Text */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="buttonText" className="block text-sm font-medium text-slate-300 mb-2">
                  Button Text (Optional)
                </label>
                <input
                  id="buttonText"
                  name="buttonText"
                  type="text"
                  value={formData.buttonText}
                  onChange={handleInputChange}
                  placeholder="e.g., Get Started"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Button URL */}
              <div>
                <label htmlFor="buttonUrl" className="block text-sm font-medium text-slate-300 mb-2">
                  Button URL (Optional)
                </label>
                <input
                  id="buttonUrl"
                  name="buttonUrl"
                  type="text"
                  value={formData.buttonUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Display Order */}
            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-slate-300 mb-2">
                Display Order
              </label>
              <input
                id="displayOrder"
                name="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Lower numbers appear first</p>
            </div>

            {/* Dates */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-2">
                  End Date (Optional)
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || uploadingImage ? "Creating..." : "Create Banner"}
              </button>
              <Link
                href="/admin/home-page/banners"
                className="px-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Image Upload Preview */}
        <div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Banner Image</h3>

            {/* Upload Area */}
            <div className="mb-4">
              <label htmlFor="image" className="block">
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-colors text-center">
                  <svg className="mx-auto h-12 w-12 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
                  </svg>
                  <p className="text-sm text-slate-400">
                    <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG or WebP (max 5MB)</p>
                </div>
                <input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Preview</p>
                <div className="relative w-full aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700 mb-4">
                  <Image
                    src={getImageUrl(previewUrl)}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-emerald-400">✓ Image ready to upload</p>
              </div>
            )}

            {!previewUrl && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No image selected</p>
                <p className="text-xs text-slate-600 mt-1">Image is optional</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
