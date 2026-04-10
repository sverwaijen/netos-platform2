/**
 * SignageGenericDisplay — Universal content display with template support.
 * In demo mode: cycles through all 7 branded templates.
 * In production: renders playlist items (images, videos, PDFs, HTML, URLs, templates).
 */
import { useState, useEffect } from "react";
import { BRAND } from "@/lib/brand";
import { renderTemplate, TEMPLATE_REGISTRY, type TemplateData } from "./SignageTemplates";

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
  isDemo?: boolean;
}

// Demo: cycle through all templates with their default data
const DEMO_SLIDES = Object.entries(TEMPLATE_REGISTRY).map(([key, reg]) => ({
  contentType: "template" as const,
  title: reg.label,
  duration: 10,
  templateData: reg.defaultData,
}));

export default function SignageGenericDisplay({ config, time, locationId, onRefresh, isDemo }: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");
  const [clock, setClock] = useState(time);

  const playlistItems = config.items || [];
  const slides = playlistItems.length > 0 ? playlistItems : (isDemo ? DEMO_SLIDES : []);
  const total = slides.length;

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance slides
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
  const timeStr = clock.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  // ─── Empty state ───────────────────────────────────────────────────
  if (total === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "linear-gradient(160deg, #1a2614 0%, #0f1a0a 100%)" }}>
        <div className="text-center">
          <img src={BRAND.logo} alt="Mr. Green" className="h-14 mx-auto mb-8 opacity-70" />
          <h2 className="text-4xl font-extralight mb-3">Mr. Green <strong className="font-semibold">Offices</strong></h2>
          <p className="text-base text-white/25">Your next level office</p>
        </div>
      </div>
    );
  }

  // ─── Check if slide uses a template ────────────────────────────────
  const isTemplate = slide?.contentType === "template" || (slide?.templateData?.template && TEMPLATE_REGISTRY[slide.templateData.template]);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#1a2614" }}>
      {/* Main content area */}
      <div className={`w-full h-full transition-all duration-500 ${fadeState === "in" ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"}`}>
        {isTemplate ? (
          /* ─── Template rendering ─── */
          renderTemplate(
            slide.templateData?.template || "welcome",
            slide.templateData as TemplateData
          )
        ) : (
          /* ─── Standard content types ─── */
          <div className="w-full h-full">
            {slide.contentType === "image" && slide.mediaUrl && (
              <div className="h-full w-full relative">
                <img src={slide.mediaUrl} alt={slide.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-2xl font-light">{slide.title}</h3>
                </div>
              </div>
            )}
            {slide.contentType === "video" && slide.mediaUrl && (
              <video src={slide.mediaUrl} autoPlay muted loop className="w-full h-full object-cover" />
            )}
            {slide.contentType === "html" && slide.htmlContent && (
              <div className="h-full w-full p-8 bg-white/[0.03] overflow-hidden" dangerouslySetInnerHTML={{ __html: slide.htmlContent }} />
            )}
            {slide.contentType === "url" && slide.externalUrl && (
              <iframe src={slide.externalUrl} className="w-full h-full border-0" allow="autoplay" />
            )}
            {slide.contentType === "pdf" && slide.mediaUrl && (
              <iframe src={`${slide.mediaUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-0 bg-white" />
            )}
            {slide.contentType === "announcement" && (
              <div className="h-full w-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #627653dd, #3a4a34ee)" }}>
                <div className="text-center max-w-3xl px-12">
                  <h3 className="text-4xl font-extralight mb-6">{slide.title}</h3>
                  <p className="text-xl text-white/60 font-light">{slide.templateData?.message || ""}</p>
                </div>
              </div>
            )}
            {slide.contentType === "welcome_screen" && (
              <div className="h-full w-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #627653ee, #627653aa)" }}>
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

      {/* Overlay: time + slide dots */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20">
        <span className="text-sm text-white/20 tabular-nums">{timeStr}</span>
        {total > 1 && (
          <div className="flex gap-1.5">
            {slides.map((_: any, i: number) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === slideIndex ? "w-6 bg-[#627653]" : "w-1.5 bg-white/15"}`} />
            ))}
          </div>
        )}
        <span className="text-[9px] text-white/10 tracking-[3px] uppercase">
          {config.location?.name || "Mr. Green"}
        </span>
      </div>

      {/* Demo badge */}
      {isDemo && (
        <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-300 text-[8px] px-2 py-0.5 rounded-full border border-amber-500/20 z-20">
          Demo modus
        </div>
      )}
    </div>
  );
}
