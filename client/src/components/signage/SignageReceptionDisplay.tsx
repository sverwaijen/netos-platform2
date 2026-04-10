/**
 * SignageReceptionDisplay — Reception screen with branded templates.
 * In demo mode: cycles through presentation-accurate templates.
 * In production: renders playlist items with template support.
 */
import { useState, useEffect } from "react";
import { Phone, Mail, MessageCircle, QrCode } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { renderTemplate, TEMPLATE_REGISTRY, type TemplateData } from "./SignageTemplates";

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
  isDemo?: boolean;
}

// Demo slides using the template system
const DEMO_SLIDES = [
  {
    contentType: "template", duration: 12,
    templateData: {
      template: "welcome",
      title: "Welcome to\nMr. Green",
      subtitle: "Your next level office",
      ctaText: "Work like a boss",
    },
  },
  {
    contentType: "template", duration: 10,
    templateData: {
      template: "hero_image",
      category: "Community",
      title: "Choose Your\nNeighbour!",
      body: "Ken je iemand die perfect past bij Mr. Green? Verwijs ze door en ontvang een beloning van €500.",
      ctaText: "Vraag je BOSS",
      accent: "#627653",
    },
  },
  {
    contentType: "template", duration: 10,
    templateData: {
      template: "grid_cards",
      category: "Your Boss Has Back-up",
      title: "Contact\nYour Boss",
      phone: "088 - 20 10 100",
      email: "ede@mrgreen.nl",
      helpText: "Heb je hulp nodig? Je BOSS staat altijd voor je klaar. Geen vraag is te gek!",
    },
  },
  {
    contentType: "template", duration: 10,
    templateData: {
      template: "feedback",
      category: "Brand New But Already Improving",
      title: "Give Us Your\nFeedback",
      body: "We willen graag weten wat je vindt. Scan de QR code of spreek je BOSS aan.",
    },
  },
  {
    contentType: "template", duration: 10,
    templateData: {
      template: "geometric",
      subtitle: "A little story about a big change",
      title: "How Hosts\nBecame Bosses",
      body: "**Why?** Because we believe in empowerment.\n\n**What's changing?** Our hosts are now your personal BOSS.\n\n**What's new?** Direct contact, faster service, better experience.",
    },
  },
  {
    contentType: "template", duration: 10,
    templateData: {
      template: "stats_vitality",
      category: "Vitality",
      title: "Stay\nHealthy",
      body: "Drink minimaal 2 liter water per dag. Water stations vind je op elke verdieping.",
    },
  },
  {
    contentType: "template", duration: 8,
    templateData: {
      template: "quote",
      quote: "The best way to predict the future is to create it.",
      author: "Mr. Green",
    },
  },
];

export default function SignageReceptionDisplay({ config, time, locationId, onRefresh, isDemo }: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");
  const [clock, setClock] = useState(time);

  const playlistItems = config.items || [];
  const slides = playlistItems.length > 0 ? playlistItems : (isDemo ? DEMO_SLIDES : []);
  const total = slides.length;

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
  const isTemplate = slide?.contentType === "template" || (slide?.templateData?.template && TEMPLATE_REGISTRY[slide.templateData.template]);

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col" style={{ background: "#1a2614", fontFamily: "'Montserrat', 'Inter', sans-serif" }}>
      {/* ═══ MAIN CONTENT ═══ */}
      <div className={`flex-1 min-h-0 transition-all duration-500 ${fadeState === "in" ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"}`}>
        {total === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-[10px] tracking-[6px] uppercase text-[#627653]/50 mb-6">Welcome to</div>
            <img src={BRAND.logo} alt="Mr. Green" className="h-14 mb-8 opacity-90" />
            <div className="text-[10px] tracking-[5px] uppercase text-white/25">Work like a boss</div>
          </div>
        ) : isTemplate ? (
          /* ─── Template rendering (full-bleed) ─── */
          <div className="h-full">
            {renderTemplate(slide.templateData?.template || "welcome", slide.templateData as TemplateData)}
          </div>
        ) : (
          /* ─── Standard content types ─── */
          <div className="h-full flex flex-col justify-center p-4">
            {slide.contentType === "image" && slide.mediaUrl && (
              <div className="flex-1 flex items-center justify-center relative">
                <img src={slide.mediaUrl} alt={slide.title} className="max-w-full max-h-full object-contain rounded-2xl" />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl">
                  <h3 className="text-xl font-light">{slide.title}</h3>
                </div>
              </div>
            )}
            {slide.contentType === "video" && slide.mediaUrl && (
              <video src={slide.mediaUrl} autoPlay muted loop className="flex-1 w-full object-contain rounded-2xl" />
            )}
            {slide.contentType === "pdf" && slide.mediaUrl && (
              <iframe src={`${slide.mediaUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="flex-1 w-full rounded-2xl border-0 bg-white" />
            )}
            {slide.contentType === "html" && slide.htmlContent && (
              <div className="flex-1 p-6 bg-white/[0.03] rounded-2xl overflow-hidden" dangerouslySetInnerHTML={{ __html: slide.htmlContent }} />
            )}
            {slide.contentType === "url" && slide.externalUrl && (
              <iframe src={slide.externalUrl} className="flex-1 w-full rounded-2xl border-0" />
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
          </div>
        )}
      </div>

      {/* ═══ BOTTOM BAR ═══ */}
      <div className="shrink-0 px-4 pb-3 pt-1">
        {/* Slide dots */}
        {total > 1 && (
          <div className="flex justify-center gap-1.5 mb-2">
            {slides.map((_: any, i: number) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === slideIndex ? "w-6 bg-[#627653]" : "w-1.5 bg-white/15"}`} />
            ))}
          </div>
        )}
        {/* Contact Bar */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { icon: Phone, label: "Bel de BOSS", value: "088-20 10 100" },
            { icon: Mail, label: "Email", value: "ede@mrgreen.nl" },
            { icon: MessageCircle, label: "WhatsApp", value: "Direct contact" },
            { icon: QrCode, label: "Scan", value: "QR Code" },
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-2 text-center">
              <item.icon className="w-3 h-3 text-[#627653]/50 mx-auto mb-0.5" />
              <p className="text-[7px] text-[#627653]/50 tracking-[1px] uppercase">{item.label}</p>
              <p className="text-[9px] text-white/40 font-light mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Time overlay */}
      <div className="absolute top-3 left-4 text-sm text-white/15 tabular-nums">{timeStr}</div>

      {/* Demo badge */}
      {isDemo && (
        <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-300 text-[8px] px-2 py-0.5 rounded-full border border-amber-500/20">
          Demo modus
        </div>
      )}
    </div>
  );
}
