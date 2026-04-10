/**
 * SignageTemplates — Dynamic content templates matching exact PDF presentation slides.
 * Each template is a React component with editable fields via templateData JSON.
 *
 * Templates:
 * 1. hero_image    — Full-bleed photo + text card with organic wave divider
 * 2. grid_cards    — 2x2 card grid (contact, help, photo, QR)
 * 3. geometric     — Abstract green shapes + centered text card
 * 4. stats_vitality — Numbers/stats display with accent colors
 * 5. welcome       — Mr Green branded welcome screen
 * 6. feedback      — "Give Us Your Feedback" style card
 * 7. quote         — Large quote with attribution
 */
import { BRAND } from "@/lib/brand";
import { Phone, Mail, QrCode, MessageSquare, Heart, Droplets, Dumbbell, Leaf } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
export interface TemplateData {
  template: string;
  // Hero Image
  heroImageUrl?: string;
  category?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  ctaText?: string;
  accent?: string;
  // Grid Cards
  phone?: string;
  email?: string;
  helpText?: string;
  qrCodeUrl?: string;
  portraitUrl?: string;
  bossName?: string;
  // Stats
  stats?: { label: string; value: string; icon?: string }[];
  // Quote
  quote?: string;
  author?: string;
}

// ─── Wave SVG ────────────────────────────────────────────────────────
function WaveDivider({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1080 120"
      className={`w-full absolute left-0 ${flip ? "top-0 rotate-180" : "bottom-0"}`}
      style={{ height: "clamp(60px, 8vw, 120px)" }}
      preserveAspectRatio="none"
    >
      <path
        d="M0 60 C180 0, 360 120, 540 60 C720 0, 900 120, 1080 60 L1080 120 L0 120 Z"
        fill="#1a2614"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE 1: Hero Image + Text Card
// ═══════════════════════════════════════════════════════════════════════
export function TemplateHeroImage({ data }: { data: TemplateData }) {
  const accent = data.accent || "#627653";
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ background: "#1a2614" }}>
      {/* Hero photo top 55% */}
      <div className="relative" style={{ flex: "0 0 55%" }}>
        {data.heroImageUrl ? (
          <img src={data.heroImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#627653]/40 to-[#3a4a34]/60" />
        )}
        <WaveDivider />
      </div>
      {/* Text card bottom 45% */}
      <div className="flex-1 flex flex-col justify-center px-[8%] pb-[5%] relative z-10">
        {data.category && (
          <p className="text-[clamp(8px,1.2vw,11px)] tracking-[5px] uppercase font-semibold mb-3" style={{ color: `${accent}99` }}>
            {data.category}
          </p>
        )}
        <h2 className="text-[clamp(24px,5vw,52px)] font-black uppercase tracking-tight leading-[0.92] text-white mb-4 whitespace-pre-line">
          {data.title || "Mr. Green"}
        </h2>
        {data.body && (
          <>
            <div className="w-12 h-0.5 rounded-full mb-4" style={{ background: accent }} />
            <p className="text-[clamp(11px,1.6vw,16px)] font-light leading-relaxed text-white/60 max-w-[80%]">
              {data.body}
            </p>
          </>
        )}
        {data.ctaText && (
          <p className="mt-6 text-[clamp(12px,1.8vw,18px)] italic text-white/40" style={{ fontFamily: "'Georgia', serif" }}>
            {data.ctaText}
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE 2: Grid Cards (Your Boss Has Back-up)
// ═══════════════════════════════════════════════════════════════════════
export function TemplateGridCards({ data }: { data: TemplateData }) {
  return (
    <div className="w-full h-full flex flex-col p-[5%]" style={{ background: "#4a5a3f" }}>
      {/* Title */}
      <div className="mb-6">
        <p className="text-[clamp(8px,1vw,10px)] tracking-[5px] uppercase text-white/40 font-semibold mb-2">
          {data.category || "Your Boss Has Back-up"}
        </p>
        <h2 className="text-[clamp(20px,4vw,40px)] font-black uppercase tracking-tight text-white leading-none">
          {data.title || "Contact\nYour Boss"}
        </h2>
      </div>
      {/* 2x2 Grid */}
      <div className="flex-1 grid grid-cols-2 gap-3">
        {/* Contact card */}
        <div className="bg-[#f5f2ea] rounded-[20px] p-6 flex flex-col justify-center">
          <div className="space-y-4">
            {data.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#627653]/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#627653]" />
                </div>
                <span className="text-[#3a4a34] font-semibold text-[clamp(12px,1.8vw,18px)]">{data.phone}</span>
              </div>
            )}
            {data.email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#627653]/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#627653]" />
                </div>
                <span className="text-[#3a4a34] font-medium text-[clamp(10px,1.4vw,14px)]">{data.email}</span>
              </div>
            )}
          </div>
        </div>
        {/* Help card */}
        <div className="bg-[#627653] rounded-[20px] p-6 flex flex-col justify-center">
          <MessageSquare className="w-8 h-8 text-white/40 mb-3" />
          <p className="text-white text-[clamp(11px,1.5vw,15px)] font-light leading-relaxed">
            {data.helpText || "Heb je hulp nodig? Je BOSS staat altijd voor je klaar. Geen vraag is te gek!"}
          </p>
        </div>
        {/* Portrait card */}
        <div className="rounded-[20px] overflow-hidden">
          {data.portraitUrl ? (
            <img src={data.portraitUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#3a4a34] to-[#1a2614] flex items-center justify-center">
              <span className="text-white/20 text-sm">{data.bossName || "Your Boss"}</span>
            </div>
          )}
        </div>
        {/* QR card */}
        <div className="bg-[#627653] rounded-[20px] p-6 flex flex-col items-center justify-center">
          {data.qrCodeUrl ? (
            <img src={data.qrCodeUrl} alt="QR" className="w-[60%] aspect-square rounded-xl" />
          ) : (
            <QrCode className="w-16 h-16 text-white/30" />
          )}
          <p className="text-white/60 text-[clamp(9px,1.2vw,12px)] mt-3 text-center">Scan voor meer info</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE 3: Geometric Shapes + Text
// ═══════════════════════════════════════════════════════════════════════
export function TemplateGeometric({ data }: { data: TemplateData }) {
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: "#1a2614" }}>
      {/* Geometric shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-[5%] left-[-10%] w-[50%] aspect-square rounded-full bg-[#627653]/20" />
        <div className="absolute bottom-[10%] right-[-15%] w-[60%] aspect-square rounded-[40px] bg-[#8a9a7a]/15 rotate-12" />
        <div className="absolute top-[40%] left-[60%] w-[30%] aspect-square rounded-full bg-[#4a5a3f]/25" />
        <div className="absolute bottom-[50%] left-[10%] w-[20%] aspect-[2/3] rounded-[30px] bg-[#627653]/10 -rotate-6" />
      </div>
      {/* Central card */}
      <div className="absolute inset-0 flex items-center justify-center p-[8%]">
        <div className="bg-[#1a2614]/90 backdrop-blur-sm rounded-[24px] p-[6%] max-w-[90%] border border-white/[0.06]">
          {data.subtitle && (
            <p className="text-[clamp(10px,1.3vw,13px)] text-white/40 font-light mb-3">{data.subtitle}</p>
          )}
          <h2 className="text-[clamp(22px,4.5vw,48px)] font-black uppercase tracking-tight leading-[0.92] text-white mb-5 whitespace-pre-line">
            {data.title || "How Hosts\nBecame Bosses"}
          </h2>
          <div className="w-12 h-0.5 rounded-full bg-[#627653] mb-5" />
          {data.body && (
            <div className="text-[clamp(11px,1.4vw,14px)] font-light leading-relaxed text-white/50 space-y-3">
              {data.body.split("\n\n").map((p, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white/80 font-semibold">$1</strong>') }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE 4: Stats / Vitality
// ═══════════════════════════════════════════════════════════════════════
const STAT_ICONS: Record<string, any> = {
  heart: Heart, water: Droplets, fitness: Dumbbell, leaf: Leaf,
};

export function TemplateStats({ data }: { data: TemplateData }) {
  const stats = data.stats || [
    { label: "Stappen vandaag", value: "8.432", icon: "fitness" },
    { label: "Water gedronken", value: "1.8L", icon: "water" },
    { label: "Hartslag gem.", value: "72 bpm", icon: "heart" },
    { label: "Actieve minuten", value: "45 min", icon: "fitness" },
  ];

  return (
    <div className="w-full h-full flex flex-col p-[6%]" style={{ background: "linear-gradient(160deg, #1a2614 0%, #2a3a24 100%)" }}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[clamp(8px,1vw,10px)] tracking-[5px] uppercase text-[#627653]/60 font-semibold mb-2">
          {data.category || "Vitality"}
        </p>
        <h2 className="text-[clamp(24px,4.5vw,44px)] font-black uppercase tracking-tight text-white leading-none whitespace-pre-line">
          {data.title || "Stay\nHealthy"}
        </h2>
      </div>
      {/* Stats grid */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {stats.map((stat, i) => {
          const Icon = STAT_ICONS[stat.icon || "heart"] || Heart;
          return (
            <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-[20px] p-5 flex flex-col justify-center">
              <Icon className="w-6 h-6 text-[#627653] mb-3" />
              <p className="text-[clamp(24px,5vw,48px)] font-black text-white leading-none mb-1">{stat.value}</p>
              <p className="text-[clamp(9px,1.2vw,12px)] text-white/30 uppercase tracking-[2px]">{stat.label}</p>
            </div>
          );
        })}
      </div>
      {/* Body text */}
      {data.body && (
        <p className="mt-6 text-[clamp(11px,1.4vw,14px)] font-light text-white/40 leading-relaxed">{data.body}</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE 5: Welcome Screen
// ═══════════════════════════════════════════════════════════════════════
export function TemplateWelcome({ data }: { data: TemplateData }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1a2614 0%, #0f1a0a 50%, #1a2614 100%)" }}>
      {/* Decorative circles */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] aspect-square rounded-full border border-[#627653]/10" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[50%] aspect-square rounded-full border border-[#627653]/10" />
      <div className="absolute top-[30%] left-[10%] w-[15%] aspect-square rounded-full bg-[#627653]/5" />

      <img src={BRAND.logo} alt="Mr. Green" className="h-[clamp(40px,8vw,80px)] mb-8 opacity-90" />
      <h2 className="text-[clamp(28px,6vw,64px)] font-black uppercase tracking-tight text-white text-center leading-[0.92] mb-4 whitespace-pre-line">
        {data.title || "Welcome to\nMr. Green"}
      </h2>
      {data.subtitle && (
        <p className="text-[clamp(12px,2vw,20px)] font-light text-white/40 text-center">{data.subtitle}</p>
      )}
      {/* Bottom tagline */}
      <div className="absolute bottom-[6%] left-0 right-0 text-center">
        <p className="text-[clamp(9px,1.2vw,12px)] tracking-[6px] uppercase text-[#627653]/40 font-semibold">
          {data.ctaText || "Your next level office"}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE 6: Feedback Card
// ═══════════════════════════════════════════════════════════════════════
export function TemplateFeedback({ data }: { data: TemplateData }) {
  return (
    <div className="w-full h-full flex flex-col p-[6%]" style={{ background: "#1a2614" }}>
      <div className="mb-6">
        <p className="text-[clamp(8px,1vw,10px)] tracking-[5px] uppercase text-[#c9a08e]/60 font-semibold mb-2">
          {data.category || "Brand New But Already Improving"}
        </p>
        <h2 className="text-[clamp(28px,5.5vw,56px)] font-black uppercase tracking-tight text-white leading-[0.92] whitespace-pre-line">
          {data.title || "Give Us Your\nFeedback"}
        </h2>
      </div>
      <div className="w-16 h-0.5 rounded-full bg-[#c9a08e] mb-6" />
      <p className="text-[clamp(12px,1.6vw,16px)] font-light text-white/50 leading-relaxed max-w-[85%] mb-8">
        {data.body || "We willen graag weten wat je vindt. Scan de QR code of spreek je BOSS aan."}
      </p>
      <div className="flex-1 flex items-center justify-center">
        {data.qrCodeUrl ? (
          <div className="bg-white rounded-[20px] p-6">
            <img src={data.qrCodeUrl} alt="QR" className="w-[clamp(120px,20vw,200px)] aspect-square" />
          </div>
        ) : (
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-[20px] p-8 flex flex-col items-center">
            <QrCode className="w-20 h-20 text-white/15 mb-3" />
            <p className="text-white/20 text-sm">QR Code</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE 7: Quote
// ═══════════════════════════════════════════════════════════════════════
export function TemplateQuote({ data }: { data: TemplateData }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-[8%] relative"
      style={{ background: "linear-gradient(160deg, #627653 0%, #4a5a3f 100%)" }}>
      <div className="text-[120px] font-serif text-white/10 leading-none absolute top-[10%] left-[8%]">"</div>
      <blockquote className="text-[clamp(18px,3.5vw,36px)] font-light text-white text-center leading-relaxed max-w-[85%] mb-8">
        {data.quote || "The best way to predict the future is to create it."}
      </blockquote>
      <div className="w-12 h-0.5 rounded-full bg-white/20 mb-4" />
      <p className="text-[clamp(10px,1.4vw,14px)] text-white/50 uppercase tracking-[4px]">
        {data.author || "Mr. Green"}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Template Registry
// ═══════════════════════════════════════════════════════════════════════
export const TEMPLATE_REGISTRY: Record<string, {
  component: React.FC<{ data: TemplateData }>;
  label: string;
  description: string;
  defaultData: TemplateData;
}> = {
  hero_image: {
    component: TemplateHeroImage,
    label: "Hero Image + Tekst",
    description: "Grote foto met tekst overlay en wave divider",
    defaultData: {
      template: "hero_image",
      category: "Interior",
      title: "Detailed\nInterior Design",
      body: "Elk Mr. Green kantoor is uniek ingericht met duurzame materialen en planten.",
      ctaText: "Work like a boss",
      accent: "#627653",
    },
  },
  grid_cards: {
    component: TemplateGridCards,
    label: "Grid Cards",
    description: "2x2 kaarten met contact, hulp, foto en QR code",
    defaultData: {
      template: "grid_cards",
      category: "Your Boss Has Back-up",
      title: "Contact\nYour Boss",
      phone: "088 - 20 10 100",
      email: "ede@mrgreen.nl",
      helpText: "Heb je hulp nodig? Je BOSS staat altijd voor je klaar.",
    },
  },
  geometric: {
    component: TemplateGeometric,
    label: "Geometrisch",
    description: "Abstracte groene vormen met centraal tekstblok",
    defaultData: {
      template: "geometric",
      subtitle: "A little story about a big change",
      title: "How Hosts\nBecame Bosses",
      body: "**Why?** Because we believe in empowerment.\n\n**What's changing?** Our hosts are now your personal BOSS.\n\n**What's new?** Direct contact, faster service, better experience.",
    },
  },
  stats_vitality: {
    component: TemplateStats,
    label: "Stats / Vitality",
    description: "Statistieken en cijfers in een grid",
    defaultData: {
      template: "stats_vitality",
      category: "Vitality",
      title: "Stay\nHealthy",
      stats: [
        { label: "Stappen vandaag", value: "8.432", icon: "fitness" },
        { label: "Water gedronken", value: "1.8L", icon: "water" },
        { label: "Hartslag gem.", value: "72 bpm", icon: "heart" },
        { label: "Actieve minuten", value: "45 min", icon: "fitness" },
      ],
    },
  },
  welcome: {
    component: TemplateWelcome,
    label: "Welcome Screen",
    description: "Mr Green branded welkomstscherm",
    defaultData: {
      template: "welcome",
      title: "Welcome to\nMr. Green",
      subtitle: "Your next level office",
      ctaText: "Work like a boss",
    },
  },
  feedback: {
    component: TemplateFeedback,
    label: "Feedback",
    description: "Feedback verzoek met QR code",
    defaultData: {
      template: "feedback",
      category: "Brand New But Already Improving",
      title: "Give Us Your\nFeedback",
      body: "We willen graag weten wat je vindt. Scan de QR code of spreek je BOSS aan.",
    },
  },
  quote: {
    component: TemplateQuote,
    label: "Quote",
    description: "Groot citaat met auteur",
    defaultData: {
      template: "quote",
      quote: "The best way to predict the future is to create it.",
      author: "Mr. Green",
    },
  },
};

// ─── Render any template by name ─────────────────────────────────────
export function renderTemplate(templateName: string, data: TemplateData) {
  const reg = TEMPLATE_REGISTRY[templateName];
  if (!reg) return null;
  const Component = reg.component;
  return <Component data={{ ...reg.defaultData, ...data }} />;
}
