import { useCallback, useState } from "react";
import { apiFetch } from "../api";

export interface Banner {
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

export const useHomeBanners = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getActiveBanners = useCallback(async (): Promise<Banner[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/home/banners");
      if (res.success && res.data) {
        return res.data;
      } else {
        throw new Error(res.message || "Failed to fetch banners");
      }
    } catch (err: any) {
      const message = err.message || "Failed to fetch banners";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllBanners = useCallback(async (): Promise<Banner[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/home-banners");
      if (res.success && res.data) {
        return res.data;
      } else {
        throw new Error(res.message || "Failed to fetch banners");
      }
    } catch (err: any) {
      const message = err.message || "Failed to fetch banners";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBannerById = useCallback(async (id: string): Promise<Banner> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/admin/home-banners/${id}`);
      if (res.success && res.data) {
        return res.data;
      } else {
        throw new Error(res.message || "Failed to fetch banner");
      }
    } catch (err: any) {
      const message = err.message || "Failed to fetch banner";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBanner = useCallback(
    async (data: Partial<Banner>): Promise<Banner> => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch("/admin/home-banners", {
          method: "POST",
          body: JSON.stringify(data),
        });
        if (res.success && res.data) {
          return res.data;
        } else {
          throw new Error(res.message || "Failed to create banner");
        }
      } catch (err: any) {
        const message = err.message || "Failed to create banner";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateBanner = useCallback(
    async (id: string, data: Partial<Banner>): Promise<Banner> => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/admin/home-banners/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        if (res.success && res.data) {
          return res.data;
        } else {
          throw new Error(res.message || "Failed to update banner");
        }
      } catch (err: any) {
        const message = err.message || "Failed to update banner";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const uploadBannerImage = useCallback(
    async (id: string, file: File): Promise<Banner> => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await apiFetch(`/admin/home-banners/${id}/upload-image`, {
          method: "POST",
          body: formData,
        });
        if (res.success && res.data) {
          return res.data;
        } else {
          throw new Error(res.message || "Failed to upload image");
        }
      } catch (err: any) {
        const message = err.message || "Failed to upload image";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const replaceBannerImage = useCallback(
    async (id: string, file: File): Promise<Banner> => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await apiFetch(`/admin/home-banners/${id}/replace-image`, {
          method: "PUT",
          body: formData,
        });
        if (res.success && res.data) {
          return res.data;
        } else {
          throw new Error(res.message || "Failed to replace image");
        }
      } catch (err: any) {
        const message = err.message || "Failed to replace image";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const toggleBannerStatus = useCallback(
    async (id: string, isActive: boolean): Promise<Banner> => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/admin/home-banners/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        });
        if (res.success && res.data) {
          return res.data;
        } else {
          throw new Error(res.message || "Failed to update status");
        }
      } catch (err: any) {
        const message = err.message || "Failed to update status";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteBanner = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/admin/home-banners/${id}`, {
        method: "DELETE",
      });
      if (!res.success) {
        throw new Error(res.message || "Failed to delete banner");
      }
    } catch (err: any) {
      const message = err.message || "Failed to delete banner";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderBanners = useCallback(
    async (bannerIds: string[]): Promise<Banner[]> => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch("/admin/home-banners/reorder", {
          method: "POST",
          body: JSON.stringify({ bannerIds }),
        });
        if (res.success && res.data) {
          return res.data;
        } else {
          throw new Error(res.message || "Failed to reorder banners");
        }
      } catch (err: any) {
        const message = err.message || "Failed to reorder banners";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    getActiveBanners,
    getAllBanners,
    getBannerById,
    createBanner,
    updateBanner,
    uploadBannerImage,
    replaceBannerImage,
    toggleBannerStatus,
    deleteBanner,
    reorderBanners,
  };
};
