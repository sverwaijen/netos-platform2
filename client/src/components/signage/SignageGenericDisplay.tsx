import { useState, useEffect } from "react";
import SignageLayout from "./SignageLayout";
import { BRAND } from "@/lib/brand";

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
}

export default function SignageGenericDisplay({ config, time, locationId, onRefresh }: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const items = config.items || [];
  const totalItems = items.length;

  // Auto-rotate slides
  useEffect(() => {
    if (totalItems <= 1) return;
    const currentItem = items[slideIndex];
    const duration = (currentItem?.durationOverride || currentItem?.duration || 15) * 1000;
    const timer = setTimeout(() => {
      setSlideIndex((prev) => (prev + 1) % totalItems);
    }, duration);
    return () => clearTimeout(timer);
  }, [slideIndex, totalItems, items]);

  const currentItem = items[slideIndex];

  return (
    <SignageLayout
      theme="green"
      locationName={config.location?.name}
      time={time}
    >
      <div className="h-full flex items-center justify-center">
        {currentItem ? (
          <div className="w-full h-full relative">
            {/* Image */}
            {currentItem.contentType === "image" && currentItem.mediaUrl && (
              <div className="h-full w-full relative rounded-2xl overflow-hidden">
                <img
                  src={currentItem.mediaUrl}
                  alt={currentItem.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-10">
                  <h3 className="text-3xl font-extralight">{currentItem.title}</h3>
                </div>
              </div>
            )}

            {/* Video */}
            {currentItem.contentType === "video" && currentItem.mediaUrl && (
              <video
                src={currentItem.mediaUrl}
                autoPlay
                muted
                loop
                className="w-full h-full object-cover rounded-2xl"
              />
            )}

            {/* HTML */}
            {currentItem.contentType === "html" && currentItem.htmlContent && (
              <div
                className="h-full w-full p-10 bg-white/[0.03] rounded-2xl overflow-hidden"
                dangerouslySetInnerHTML={{ __html: currentItem.htmlContent }}
              />
            )}

            {/* URL / iframe */}
            {currentItem.contentType === "url" && currentItem.externalUrl && (
              <iframe
                src={currentItem.externalUrl}
                className="w-full h-full rounded-2xl border-0"
                allow="autoplay"
              />
            )}

            {/* Announcement */}
            {currentItem.contentType === "announcement" && (
              <div className="h-full w-full flex items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #627653dd, #3a4a34ee)" }}>
                <div className="text-center max-w-3xl px-12">
                  <h3 className="text-4xl font-extralight mb-6">{currentItem.title}</h3>
                  {currentItem.templateData && (
                    <p className="text-xl text-white/60 font-light leading-relaxed">
                      {(currentItem.templateData as any).message || ""}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Welcome */}
            {currentItem.contentType === "welcome_screen" && (
              <div className="h-full w-full flex items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #627653ee, #627653aa)" }}>
                <div className="text-center">
                  <img src={BRAND.logo} alt="Mr. Green" className="h-20 mx-auto mb-10 opacity-90" />
                  <h3 className="text-5xl font-extralight mb-4">{currentItem.title}</h3>
                  <p className="text-xl text-white/60">Your next level office</p>
                </div>
              </div>
            )}

            {/* Fallback */}
            {!["image", "video", "html", "url", "announcement", "welcome_screen"].includes(currentItem.contentType) && (
              <div className="h-full w-full flex items-center justify-center bg-white/[0.03] rounded-2xl">
                <div className="text-center">
                  <h3 className="text-3xl font-light">{currentItem.title}</h3>
                  <p className="text-sm text-white/30 mt-3">{currentItem.contentType}</p>
                </div>
              </div>
            )}

            {/* Slide indicators */}
            {totalItems > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {items.map((_: any, i: number) => (
                  <div
                    key={i}
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: i === slideIndex ? 32 : 8,
                      background: i === slideIndex ? "#627653" : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Default display when no content */
          <div className="text-center">
            <img src={BRAND.logo} alt="Mr. Green" className="h-16 mx-auto mb-8 opacity-60" />
            <h2 className="text-4xl font-extralight mb-3">
              Mr. Green <strong className="font-semibold">Offices</strong>
            </h2>
            <p className="text-lg text-white/30">Your next level office</p>
          </div>
        )}
      </div>
    </SignageLayout>
  );
}
