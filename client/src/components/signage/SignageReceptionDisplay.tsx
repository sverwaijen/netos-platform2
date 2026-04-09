import { trpc } from "@/lib/trpc";
import SignageLayout from "./SignageLayout";
import { useState, useEffect } from "react";
import { Building2, Phone, Mail, MessageCircle, QrCode } from "lucide-react";
import { BRAND } from "@/lib/brand";

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
}

export default function SignageReceptionDisplay({ config, time, locationId, onRefresh }: Props) {
  const [slideIndex, setSlideIndex] = useState(0);

  // Playlist content rotation
  const items = config.items || [];
  const totalItems = items.length;

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
      footerText="Work like a boss"
    >
      <div className="h-full flex flex-col gap-5">
        {/* Welcome Header */}
        <div className="text-center py-4">
          <div className="text-[10px] tracking-[4px] uppercase text-[#627653]/60 font-semibold mb-3">
            Welkom bij
          </div>
          <h1 className="text-4xl font-extralight mb-2">
            Mr. Green <strong className="font-semibold">Offices</strong>
          </h1>
          <p className="text-sm text-white/30">{config.location?.name || "Your next level office"}</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden rounded-2xl relative">
          {currentItem ? (
            <div className="h-full w-full">
              {/* Image content */}
              {currentItem.contentType === "image" && currentItem.mediaUrl && (
                <div className="h-full w-full relative">
                  <img
                    src={currentItem.mediaUrl}
                    alt={currentItem.title}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h3 className="text-2xl font-light">{currentItem.title}</h3>
                  </div>
                </div>
              )}

              {/* HTML content */}
              {currentItem.contentType === "html" && currentItem.htmlContent && (
                <div
                  className="h-full w-full p-8 bg-white/[0.03] rounded-2xl overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: currentItem.htmlContent }}
                />
              )}

              {/* Announcement */}
              {currentItem.contentType === "announcement" && (
                <div className="h-full w-full flex items-center justify-center bg-[#627653]/10 rounded-2xl p-12">
                  <div className="text-center max-w-2xl">
                    <h3 className="text-3xl font-extralight mb-4">{currentItem.title}</h3>
                    {currentItem.templateData && (
                      <p className="text-lg text-white/50 font-light">
                        {(currentItem.templateData as any).message || ""}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Welcome screen */}
              {currentItem.contentType === "welcome_screen" && (
                <div className="h-full w-full flex items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #627653ee, #627653aa)" }}>
                  <div className="text-center">
                    <img src={BRAND.logo} alt="Mr. Green" className="h-16 mx-auto mb-8 opacity-90" />
                    <h3 className="text-4xl font-extralight mb-3">{currentItem.title}</h3>
                    <p className="text-lg text-white/60">Your next level office</p>
                  </div>
                </div>
              )}

              {/* Fallback for other types */}
              {!["image", "html", "announcement", "welcome_screen"].includes(currentItem.contentType) && (
                <div className="h-full w-full flex items-center justify-center bg-white/[0.03] rounded-2xl">
                  <div className="text-center">
                    <h3 className="text-2xl font-light">{currentItem.title}</h3>
                    <p className="text-sm text-white/30 mt-2">{currentItem.contentType}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Default Mr. Green welcome when no playlist content */
            <div className="h-full w-full flex items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #627653dd, #3a4a34ee)" }}>
              <div className="text-center">
                <img src={BRAND.logo} alt="Mr. Green" className="h-16 mx-auto mb-8 opacity-90" />
                <h3 className="text-4xl font-extralight mb-3">Welcome</h3>
                <p className="text-lg text-white/60">Your next level office</p>
              </div>
            </div>
          )}

          {/* Slide indicator */}
          {totalItems > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {items.map((_: any, i: number) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === slideIndex ? 24 : 8,
                    background: i === slideIndex ? "#627653" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Contact Bar */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          {[
            { icon: Phone, label: "Bel de BOSS", value: "055-799 87 65" },
            { icon: Mail, label: "Email", value: "support@mrgreenoffices.nl" },
            { icon: MessageCircle, label: "WhatsApp", value: "Direct contact" },
            { icon: QrCode, label: "Scan voor hulp", value: "QR Code" },
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
              <item.icon className="w-4 h-4 text-[#627653]/60 mx-auto mb-1.5" />
              <p className="text-[10px] text-[#627653]/60 tracking-[1px] uppercase mb-0.5">{item.label}</p>
              <p className="text-[11px] text-white/50 font-light">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </SignageLayout>
  );
}
