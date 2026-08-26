"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { apiFetch, getImageUrl } from "@/lib/api";

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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

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
        setCurrentIndex(0);
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

  // Auto-advance slider
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goToSlide = (index: number) => setCurrentIndex(index);
  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  const goToNext = () =>
    setCurrentIndex((prev) => (prev + 1) % banners.length);

  if (loading) {
    return (
      <div className="w-full bg-slate-800/50 flex items-center justify-center" style={{ minHeight: "300px" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-slate-400 text-sm">Loading banner...</p>
        </div>
      </div>
    );
  }

  if (error || banners.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-center"
        style={{
          minHeight: "300px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        }}
      >
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
          <p className="text-slate-300 text-lg font-medium">Welcome to Skilvo</p>
          <p className="text-slate-500 text-sm mt-1">Your professional learning platform</p>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];
  const imageUrl = currentBanner.imageUrl ? getImageUrl(currentBanner.imageUrl) : null;
  const hasImageError = imageUrl ? imageErrors[imageUrl] : false;

  return (
    <div className="relative w-full overflow-hidden bg-slate-900">
      {/* Main slide area */}
      <div
        className="relative w-full"
        style={{ minHeight: "300px", maxHeight: "450px", height: "clamp(300px, 40vw, 450px)" }}
      >
        {/* Image */}
        {imageUrl && !hasImageError ? (
          <div className="absolute inset-0">
            <Image
              key={currentBanner.id}
              src={imageUrl}
              alt={currentBanner.title || "Banner"}
              fill
              className="w-full h-full object-fill"
              priority
              sizes="100vw"
              onError={() => setImageErrors((prev) => ({ ...prev, [imageUrl]: true }))}
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
            }}
          />
        )}

        {/* Content overlay */}
        {(currentBanner.title || currentBanner.description || currentBanner.buttonText) && (
          <div className="absolute inset-0 flex flex-col items-center justify-end text-center px-4 pb-12 sm:pb-16">
            <div className="max-w-2xl w-full">
              {currentBanner.title && (
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg leading-tight">
                  {currentBanner.title}
                </h1>
              )}
              {currentBanner.description && (
                <p className="text-sm sm:text-base md:text-lg text-slate-200 mb-6 drop-shadow-md max-w-xl mx-auto leading-relaxed">
                  {currentBanner.description}
                </p>
              )}
              {currentBanner.buttonText && currentBanner.buttonUrl && (
                <a
                  href={currentBanner.buttonUrl}
                  target={currentBanner.buttonUrl.startsWith("http") ? "_blank" : undefined}
                  rel={currentBanner.buttonUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base shadow-lg"
                >
                  {currentBanner.buttonText}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Prev/Next buttons */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors border border-white/10 hover:border-white/30"
              aria-label="Previous slide"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors border border-white/10 hover:border-white/30"
              aria-label="Next slide"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Slide number */}
        {banners.length > 1 && (
          <div className="absolute top-4 right-4 z-20 bg-black/40 text-white/80 text-xs px-2.5 py-1 rounded-full border border-white/10">
            {currentIndex + 1} / {banners.length}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="flex justify-center items-center gap-2 py-3 bg-slate-950/70">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-6 h-2 bg-blue-500"
                  : "w-2 h-2 bg-slate-600 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
