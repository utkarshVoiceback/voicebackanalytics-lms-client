"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAppSelector } from "@/store";
import { apiFetch, getImageUrl } from "@/lib/api";
import AppConfigSection from "./AppConfigSection";

interface Banner {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export default function BannersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "ADMIN") {
      router.push("/");
    } else {
      fetchBanners();
    }
  }, [isAuthenticated, user, router]);

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/home-banners");
      if (res.success && res.data) {
        setBanners(res.data);
      } else {
        setError(res.message || "Failed to fetch banners");
      }
    } catch (err: any) {
      setError("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    setDeleting(id);
    try {
      const res = await apiFetch(`/admin/home-banners/${id}`, {
        method: "DELETE",
      });
      if (res.success) {
        setBanners(banners.filter((b) => b.id !== id));
      } else {
        setError(res.message || "Failed to delete banner");
      }
    } catch (err: any) {
      setError("Failed to delete banner");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    try {
      const res = await apiFetch(`/admin/home-banners/${banner.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (res.success) {
        setBanners(
          banners.map((b) =>
            b.id === banner.id ? { ...b, isActive: !b.isActive } : b
          )
        );
      } else {
        setError(res.message || "Failed to update status");
      }
    } catch (err: any) {
      setError("Failed to update status");
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Home Page Banners</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage banners displayed on the public home page</p>
        </div>
        <Link
          href="/admin/home-page/banners/create"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
        >
          + Add Banner
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Banners Table */}
      {!loading && banners.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      {banner.imageUrl ? (
                        <div className="relative w-20 h-12 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <Image
                            src={getImageUrl(banner.imageUrl)}
                            alt={banner.title || "Banner"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-12 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400 dark:text-slate-500">
                          No image
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{banner.title || "—"}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">
                        {banner.description || "No description"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{banner.displayOrder}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(banner)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          banner.isActive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-slate-200/50 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400"
                        }`}
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {banner.startDate || banner.endDate ? (
                        <div className="space-y-1">
                          {banner.startDate && (
                            <div>Start: {new Date(banner.startDate).toLocaleDateString()}</div>
                          )}
                          {banner.endDate && (
                            <div>End: {new Date(banner.endDate).toLocaleDateString()}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Always active</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/home-page/banners/${banner.id}`}
                          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          disabled={deleting === banner.id}
                          className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          {deleting === banner.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && banners.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No banners yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first banner to get started</p>
          <Link
            href="/admin/home-page/banners/create"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create First Banner
          </Link>
        </div>
      )}

      {/* App Config Section */}
      <AppConfigSection />
    </div>
  );
}
