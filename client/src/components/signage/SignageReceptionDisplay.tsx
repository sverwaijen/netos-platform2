import SignageLayout from "./SignageLayout";
import { useState, useEffect } from "react";
import { Phone, Mail, MessageCircle, QrCode } from "lucide-react";
import { BRAND } from "@/lib/brand";

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
  isDemo?: boolean;
}

const DEMO_SLIDES = [
  { type: "welcome", title: "Welcome to", subtitle: "Mr. Green", tagline: "Work like a boss", bg: BRAND.images.ede },
  { type: "card", category: "Community", title: "Choose Your\nNeighbour!", body: "Ken je iemand die perfect past bij Mr. Green? Verwijs ze door en ontvang een beloning van \u20ac500.", accent: "#627653" },
  { type: "card", category: "Kitchen", title: "Recipe Against\nLoneliness", body: "Oma's Soup \u2014 een warm gebaar voor iedereen. Elke woensdag verse soep in de keuken.", accent: "#c4a68a" },
  { type: "card", category: "Vitality", title: "Vitality\nMade Easy", body: "Ergonomisch werken, regelmatig bewegen en gezond eten. Ontdek onze tips op het vitality board.", accent: "#c9a08e" },
  { type: "card", category: "Support", title: "Your Boss\nHas Back-up", body: "Hulp nodig? Bel 055-799 87 65 of mail support@mrgreenoffices.nl. We staan voor je klaar.", accent: "#627653" },
];

export default function SignageReceptionDisplay({ config, time, locationId, onRefresh, isDemo }: Props) {
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
    <SignageLayout theme="green" locationName={config.location?.name} time={time} footerText="Work like a boss" isDemo={isDemo}>
      <div className="h-full flex flex-col">
        <div className={`flex-1 flex flex-col transition-all duration-500 ${fadeState === "in" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          {total === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] tracking-[6px] uppercase text-[#627653]/50 mb-6">Welcome to</div>
              <img src={BRAND.logo} alt="Mr. Green" className="h-14 mb-8 opacity-90" />
              <div className="text-[10px] tracking-[5px] uppercase text-white/25">Work like a boss</div>
            </div>
          ) : isDemo || !slide?.contentType ? (
            <div className="flex-1 flex flex-col">
              {slide?.type === "welcome" ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center relative">
                  {slide.bg && (
                    <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-15">
                      <img src={slide.bg} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="relative z-10">
                    <div className="text-[10px] tracking-[6px] uppercase text-[#627653]/50 mb-6">{slide.title}</div>
                    <img src={BRAND.logo} alt="Mr. Green" className="h-16 mb-8 opacity-90 mx-auto" />
                    <div className="text-[10px] tracking-[5px] uppercase text-white/25">{slide.tagline}</div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center px-4">
                  <div className="text-[9px] tracking-[5px] uppercase font-semibold mb-5" style={{ color: slide?.accent || "#627653" }}>
                    {slide?.category || "Mr. Green"}
                  </div>
                  <h2 className="text-[clamp(32px,6vw,56px)] font-black uppercase tracking-tight leading-[0.92] mb-6 text-white whitespace-pre-line">
                    {slide?.title || slide?.contentTitle || "Mr. Green"}
                  </h2>
                  <div className="w-16 h-0.5 rounded-full mb-6" style={{ background: slide?.accent || "#627653" }} />
                  <p className="text-[15px] font-light leading-relaxed text-white/60 max-w-md">
                    {slide?.body || ""}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              {slide.contentType === "image" && slide.mediaUrl && (
                <div className="flex-1 flex items-center justify-center p-2 relative">
                  <img src={slide.mediaUrl} alt={slide.title} className="max-w-full max-h-full object-contain rounded-2xl" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl">
                    <h3 className="text-xl font-light">{slide.title}</h3>
                  </div>
                </div>
              )}
              {slide.contentType === "video" && slide.mediaUrl && (
                <video src={slide.mediaUrl} autoPlay muted loop className="flex-1 w-full object-contain rounded-2xl" />
              )}
              {slide.contentType === "html" && slide.htmlContent && (
                <div className="flex-1 p-6 bg-white/[0.03] rounded-2xl overflow-hidden" dangerouslySetInnerHTML={{ __html: slide.htmlContent }} />
              )}
              {slide.contentType === "url" && slide.externalUrl && (
                <iframe src={slide.externalUrl} className="flex-1 w-full rounded-2xl" />
              )}
              {slide.contentType === "announcement" && (
                <div className="flex-1 flex flex-col justify-center px-4">
                  <div className="text-[9px] tracking-[5px] uppercase font-semibold text-[#627653] mb-5">Aankondiging</div>
                  <h2 className="text-4xl font-black uppercase tracking-tight leading-[0.92] mb-6">{slide.title}</h2>
                  <div className="w-16 h-0.5 rounded-full bg-[#627653] mb-6" />
                  <p className="text-[15px] font-light leading-relaxed text-white/60">{slide.templateData?.message || slide.htmlContent || ""}</p>
                </div>
              )}
              {slide.contentType === "welcome_screen" && (
                <div className="flex-1 flex items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #627653dd, #3a4a34ee)" }}>
                  <div className="text-center">
                    <img src={BRAND.logo} alt="Mr. Green" className="h-16 mx-auto mb-8 opacity-90" />
                    <h3 className="text-4xl font-extralight mb-3">{slide.title}</h3>
                    <p className="text-lg text-white/50">Your next level office</p>
                  </div>
                </div>
              )}
              {!["image", "video", "html", "url", "announcement", "welcome_screen"].includes(slide.contentType) && (
                <div className="flex-1 flex flex-col justify-center px-4">
                  <div className="text-[9px] tracking-[5px] uppercase font-semibold text-[#627653] mb-5">{slide.contentType}</div>
                  <h2 className="text-4xl font-black uppercase tracking-tight leading-[0.92]">{slide.title}</h2>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Slide dots */}
        {total > 1 && (
          <div className="flex justify-center gap-2 py-2 shrink-0">
            {slides.map((_: any, i: number) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === slideIndex ? "w-6 bg-[#627653]" : "w-1.5 bg-white/15"}`} />
            ))}
          </div>
        )}

        {/* Contact Bar */}
        <div className="grid grid-cols-4 gap-2 shrink-0 pt-2">
          {[
            { icon: Phone, label: "Bel de BOSS", value: "055-799 87 65" },
            { icon: Mail, label: "Email", value: "support@mrgreenoffices.nl" },
            { icon: MessageCircle, label: "WhatsApp", value: "Direct contact" },
            { icon: QrCode, label: "Scan", value: "QR Code" },
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 text-center">
              <item.icon className="w-3.5 h-3.5 text-[#627653]/50 mx-auto mb-1" />
              <p className="text-[8px] text-[#627653]/50 tracking-[1px] uppercase">{item.label}</p>
              <p className="text-[10px] text-white/40 font-light mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </SignageLayout>
  );
}
