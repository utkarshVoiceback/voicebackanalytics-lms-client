"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { apiFetch } from "@/lib/api";

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

export default function HeroSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/home/banners");
      if (res.success && res.data) {
        setBanners(res.data);
        if (res.data.length > 0) {
          setCurrentIndex(0);
        }
      } else {
        setError(res.message || "Failed to fetch banners");
      }
    } catch (err: any) {
      setError("Failed to load banners");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (loading) {
    return (
      <div className="w-full bg-slate-800 aspect-video flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || banners.length === 0) {
    return (
      <div className="w-full bg-gradient-to-b from-slate-800 to-slate-900 aspect-video flex items-center justify-center text-center">
        <div>
          <p className="text-slate-300 text-lg">No banners available</p>
          <p className="text-slate-500 text-sm mt-1">Check back soon for updates</p>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full bg-slate-900 overflow-hidden">
      <div className="aspect-video relative">
        {/* Slide background */}
        {currentBanner.imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={currentBanner.imageUrl}
              alt={currentBanner.title || "Banner"}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-slate-700 to-slate-900" />
        )}

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          {currentBanner.title && (
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg max-w-2xl">
              {currentBanner.title}
            </h1>
          )}

          {currentBanner.description && (
            <p className="text-base md:text-xl text-slate-100 mb-8 drop-shadow-md max-w-xl">
              {currentBanner.description}
            </p>
          )}

          {currentBanner.buttonText && currentBanner.buttonUrl && (
            <a
              href={currentBanner.buttonUrl}
              target={currentBanner.buttonUrl.startsWith("http") ? "_blank" : undefined}
              rel={currentBanner.buttonUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors drop-shadow-md"
            >
              {currentBanner.buttonText}
            </a>
          )}
        </div>

        {/* Previous button */}
        {banners.length > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {banners.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Indicator dots */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-2 py-4">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-blue-500 w-8"
                  : "bg-slate-500 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
