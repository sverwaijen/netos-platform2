import { useState, useEffect } from "react";
import SignageLayout from "./SignageLayout";
import { BRAND } from "@/lib/brand";

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
  isDemo?: boolean;
}

const DEMO_SLIDES = [
  { type: "welcome", title: "Welcome to Mr. Green", tagline: "Your next level office" },
  { type: "card", category: "Brand New But Already Improving", title: "Give Us Your\nFeedback", body: "We willen graag weten wat je vindt. Scan de QR code of spreek je BOSS aan.", accent: "#627653" },
  { type: "card", category: "Vitality", title: "Stay\nHydrated", body: "Drink minimaal 2 liter water per dag. Water stations vind je op elke verdieping.", accent: "#c9a08e" },
  { type: "card", category: "Interior", title: "Detailed\nInterior Design", body: "Elk Mr. Green kantoor is uniek ingericht met duurzame materialen en planten.", accent: "#627653" },
];

export default function SignageGenericDisplay({ config, time, locationId, onRefresh, isDemo }: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  const playlistItems = config.items || [];
  const slides = playlistItems.length > 0 ? playlistItems : (isDemo ? DEMO_SLIDES : []);
  const total = slides.length;

  useEffect(() => {
    if (total <= 1) return;
    const dur = (slides[slideIndex]?.durationOverride || slides[slideIndex]?.duration || 12) * 1000;
    const timer = setTimeout(() => {
      setFadeState("out");
      setTimeout(() => {
        setSlideIndex((p) => (p + 1) % total);
        setFadeState("in");
      }, 600);
    }, dur);
    return () => clearTimeout(timer);
  }, [slideIndex, total]);

  const slide = slides[slideIndex];

  return (
    <SignageLayout theme="green" locationName={config.location?.name} time={time} isDemo={isDemo}>
      <div className={`h-full flex items-center justify-center transition-all duration-500 ${fadeState === "in" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        {total === 0 ? (
          <div className="text-center">
            <img src={BRAND.logo} alt="Mr. Green" className="h-14 mx-auto mb-8 opacity-70" />
            <h2 className="text-4xl font-extralight mb-3">Mr. Green <strong className="font-semibold">Offices</strong></h2>
            <p className="text-base text-white/25">Your next level office</p>
          </div>
        ) : isDemo || !slide?.contentType ? (
          <div className="w-full h-full flex flex-col justify-center px-4">
            {slide?.type === "welcome" ? (
              <div className="text-center">
                <img src={BRAND.logo} alt="Mr. Green" className="h-16 mx-auto mb-8 opacity-90" />
                <h3 className="text-4xl font-extralight mb-3">{slide.title}</h3>
                <p className="text-base text-white/40">{slide.tagline}</p>
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                <div className="text-[9px] tracking-[5px] uppercase font-semibold mb-5" style={{ color: slide?.accent || "#627653" }}>
                  {slide?.category || "Mr. Green"}
                </div>
                <h2 className="text-[clamp(32px,6vw,56px)] font-black uppercase tracking-tight leading-[0.92] mb-6 text-white whitespace-pre-line">
                  {slide?.title || "Mr. Green"}
                </h2>
                <div className="w-16 h-0.5 rounded-full mb-6" style={{ background: slide?.accent || "#627653" }} />
                <p className="text-[15px] font-light leading-relaxed text-white/60 max-w-md">{slide?.body || ""}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full relative">
            {slide.contentType === "image" && slide.mediaUrl && (
              <div className="h-full w-full relative rounded-2xl overflow-hidden">
                <img src={slide.mediaUrl} alt={slide.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8"><h3 className="text-2xl font-light">{slide.title}</h3></div>
              </div>
            )}
            {slide.contentType === "video" && slide.mediaUrl && (
              <video src={slide.mediaUrl} autoPlay muted loop className="w-full h-full object-cover rounded-2xl" />
            )}
            {slide.contentType === "html" && slide.htmlContent && (
              <div className="h-full w-full p-8 bg-white/[0.03] rounded-2xl overflow-hidden" dangerouslySetInnerHTML={{ __html: slide.htmlContent }} />
            )}
            {slide.contentType === "url" && slide.externalUrl && (
              <iframe src={slide.externalUrl} className="w-full h-full rounded-2xl border-0" allow="autoplay" />
            )}
            {slide.contentType === "announcement" && (
              <div className="h-full w-full flex items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #627653dd, #3a4a34ee)" }}>
                <div className="text-center max-w-3xl px-12">
                  <h3 className="text-4xl font-extralight mb-6">{slide.title}</h3>
                  <p className="text-xl text-white/60 font-light">{slide.templateData?.message || ""}</p>
                </div>
              </div>
            )}
            {slide.contentType === "welcome_screen" && (
              <div className="h-full w-full flex items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #627653ee, #627653aa)" }}>
                <div className="text-center">
                  <img src={BRAND.logo} alt="Mr. Green" className="h-16 mx-auto mb-8 opacity-90" />
                  <h3 className="text-4xl font-extralight mb-3">{slide.title}</h3>
                  <p className="text-lg text-white/50">Your next level office</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide dots */}
      {total > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_: any, i: number) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === slideIndex ? "w-6 bg-[#627653]" : "w-1.5 bg-white/15"}`} />
          ))}
        </div>
      )}
    </SignageLayout>
  );
}
