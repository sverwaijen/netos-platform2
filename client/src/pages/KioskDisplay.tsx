import { trpc } from "@/lib/trpc";
import { useSearch } from "wouter";
import { useEffect, useState } from "react";

/**
 * KioskDisplay - 34" Ultra-wide Signing Display
 * URL: /kiosk/display?company=<id>
 * Designed for 3440x1440 resolution, kiosk mode in Chrome
 * Shows company branding, logo, employee photos, time, weather
 */
export default function KioskDisplay() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const companyId = parseInt(params.get("company") || "0");

  const { data } = trpc.signing.kioskDisplay.useQuery(
    { companyId },
    { enabled: companyId > 0, refetchInterval: 60000 }
  );

  const [time, setTime] = useState(new Date());
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (data?.photos && data.photos.length > 1) {
      const timer = setInterval(() => {
        setPhotoIndex((i) => (i + 1) % data.photos.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [data?.photos]);

  if (!companyId) {
    return <MrGreenDefaultDisplay time={time} />;
  }

  if (!data) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white/30 text-2xl tracking-[0.3em] uppercase font-extralight">
          Loading...
        </div>
      </div>
    );
  }

  const { company, branding, photos, scraped } = data;
  const primary = branding?.primaryColor || "#627653";
  const secondary = branding?.secondaryColor || "#111111";
  const accent = branding?.accentColor || "#b8a472";
  const font = branding?.fontFamily || "Montserrat";
  const logo = branding?.logoUrl || scraped?.scrapedLogoUrl;
  const bgImage = branding?.backgroundImageUrl || (scraped?.scrapedImages as string[])?.[0];

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        fontFamily: `'${font}', 'Montserrat', sans-serif`,
        background: bgImage
          ? `linear-gradient(135deg, ${secondary}ee, ${primary}cc), url(${bgImage}) center/cover`
          : `linear-gradient(135deg, ${secondary}, ${primary}88)`,
      }}
    >
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />

      {/* Main layout: 3 columns for ultra-wide */}
      <div className="relative z-10 h-full flex">

        {/* Left column: Logo + Company info */}
        <div className="w-[30%] h-full flex flex-col justify-between p-16">
          {/* Logo */}
          <div>
            {logo ? (
              <img
                src={logo}
                alt={company?.name || ""}
                className="max-h-24 max-w-[280px] object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
                onError={(e) => { (e.target as HTMLImageElement).style.filter = "none"; }}
              />
            ) : (
              <div
                className="text-4xl font-semibold tracking-tight"
                style={{ color: accent }}
              >
                {company?.name || "Mr. Green"}
              </div>
            )}
          </div>

          {/* Company name + welcome */}
          <div>
            <h1
              className="text-6xl font-extralight leading-tight mb-6"
              style={{ color: "#ffffff" }}
            >
              Welcome to<br />
              <span className="font-semibold" style={{ color: accent }}>
                {company?.name || "Mr. Green Offices"}
              </span>
            </h1>
            {branding?.welcomeMessage && (
              <p className="text-xl font-extralight text-white/60 max-w-md leading-relaxed">
                {branding.welcomeMessage}
              </p>
            )}
          </div>

          {/* Mr. Green badge */}
          <div className="flex items-center gap-3 text-white/30">
            <div className="w-8 h-8 rounded-full" style={{ background: "#627653" }} />
            <span className="text-sm tracking-[0.2em] uppercase font-extralight">
              Powered by Mr. Green Offices
            </span>
          </div>
        </div>

        {/* Center column: Employee photos carousel */}
        <div className="w-[40%] h-full flex items-center justify-center p-8">
          {photos && photos.length > 0 ? (
            <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-2xl overflow-hidden">
              {photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="absolute inset-0 transition-opacity duration-1000"
                  style={{ opacity: i === photoIndex ? 1 : 0 }}
                >
                  <img
                    src={photo.photoUrl}
                    alt={photo.displayName || "Team member"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                    <p className="text-white text-2xl font-semibold">{photo.displayName}</p>
                    {photo.jobTitle && (
                      <p className="text-white/60 text-lg font-extralight">{photo.jobTitle}</p>
                    )}
                  </div>
                </div>
              ))}
              {/* Photo indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-500"
                    style={{
                      background: i === photoIndex ? accent : "rgba(255,255,255,0.3)",
                      width: i === photoIndex ? "24px" : "8px",
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* No photos - show decorative element */
            <div
              className="w-80 h-80 rounded-full opacity-10"
              style={{
                background: `radial-gradient(circle, ${accent}, transparent)`,
              }}
            />
          )}
        </div>

        {/* Right column: Time + Info */}
        <div className="w-[30%] h-full flex flex-col justify-between items-end p-16 text-right">
          {/* Time */}
          <div>
            <div className="text-8xl font-extralight text-white tabular-nums">
              {time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-xl font-extralight text-white/40 mt-2 tracking-[0.15em] uppercase">
              {dayNames[time.getDay()]}
            </div>
            <div className="text-lg font-extralight text-white/30 mt-1">
              {time.getDate()} {monthNames[time.getMonth()]} {time.getFullYear()}
            </div>
          </div>

          {/* Decorative accent line */}
          <div className="flex flex-col items-end gap-4">
            <div className="w-px h-32" style={{ background: `linear-gradient(to bottom, ${accent}, transparent)` }} />
            <div
              className="text-sm tracking-[0.3em] uppercase font-extralight"
              style={{ color: accent, writingMode: "vertical-rl" }}
            >
              {company?.name || "Mr. Green"}
            </div>
          </div>

          {/* Location info */}
          <div className="text-white/30 text-sm font-extralight">
            <p className="tracking-[0.15em] uppercase">Mr. Green Offices</p>
            <p className="mt-1 text-white/20">NET OS Platform</p>
          </div>
        </div>
      </div>

      {/* Bottom ticker bar */}
      <div
        className="absolute bottom-0 inset-x-0 h-12 flex items-center overflow-hidden"
        style={{ background: `${primary}cc` }}
      >
        <div className="animate-marquee whitespace-nowrap flex items-center gap-16 text-white/70 text-sm tracking-[0.2em] uppercase font-extralight">
          <span>Welcome to {company?.name || "Mr. Green Offices"}</span>
          <span style={{ color: accent }}>●</span>
          <span>Flexible Workspaces</span>
          <span style={{ color: accent }}>●</span>
          <span>Meeting Rooms Available</span>
          <span style={{ color: accent }}>●</span>
          <span>Coffee & Lunch at the Butler</span>
          <span style={{ color: accent }}>●</span>
          <span>Powered by NET OS</span>
          <span style={{ color: accent }}>●</span>
          <span>Welcome to {company?.name || "Mr. Green Offices"}</span>
          <span style={{ color: accent }}>●</span>
          <span>Flexible Workspaces</span>
          <span style={{ color: accent }}>●</span>
          <span>Meeting Rooms Available</span>
          <span style={{ color: accent }}>●</span>
          <span>Coffee & Lunch at the Butler</span>
        </div>
      </div>
    </div>
  );
}

/** Default Mr. Green display when no company is specified */
function MrGreenDefaultDisplay({ time }: { time: Date }) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: "linear-gradient(135deg, #111 0%, #1a2a15 50%, #111 100%)",
      }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(#627653 1px, transparent 1px), linear-gradient(90deg, #627653 1px, transparent 1px)",
        backgroundSize: "100px 100px",
      }} />

      <div className="relative z-10 h-full flex">
        {/* Left: Branding */}
        <div className="w-[35%] h-full flex flex-col justify-between p-16">
          <div className="text-[#627653] text-3xl font-semibold tracking-tight">
            Mr. Green<br />
            <span className="font-extralight text-white/40">Offices</span>
          </div>

          <div>
            <h1 className="text-7xl font-extralight text-white leading-[1.1] mb-8">
              Your workspace,<br />
              <span className="font-semibold text-[#627653]">elevated.</span>
            </h1>
            <p className="text-xl font-extralight text-white/40 max-w-md leading-relaxed">
              Premium coworking spaces across the Netherlands.
              Where ambition meets environment.
            </p>
          </div>

          <div className="flex items-center gap-4 text-white/20 text-sm tracking-[0.2em] uppercase font-extralight">
            <div className="w-12 h-px bg-[#627653]/50" />
            <span>Invite Only</span>
          </div>
        </div>

        {/* Center: Decorative */}
        <div className="w-[30%] h-full flex items-center justify-center">
          <div className="relative">
            <div className="w-64 h-64 rounded-full border border-[#627653]/20 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border border-[#627653]/10 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-[#627653]/10 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-[#627653]" />
                </div>
              </div>
            </div>
            {/* Orbiting dots */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-3 h-3 rounded-full bg-[#b8a472] animate-pulse" />
            <div className="absolute bottom-0 right-0 translate-x-2 translate-y-2 w-2 h-2 rounded-full bg-[#627653] animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
        </div>

        {/* Right: Time */}
        <div className="w-[35%] h-full flex flex-col justify-between items-end p-16 text-right">
          <div>
            <div className="text-8xl font-extralight text-white tabular-nums">
              {time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-xl font-extralight text-white/30 mt-2 tracking-[0.15em] uppercase">
              {dayNames[time.getDay()]}
            </div>
            <div className="text-lg font-extralight text-white/20 mt-1">
              {time.getDate()} {monthNames[time.getMonth()]} {time.getFullYear()}
            </div>
          </div>

          <div className="flex flex-col items-end gap-6">
            <div className="w-px h-40 bg-gradient-to-b from-[#627653] to-transparent" />
            <div className="text-[#b8a472] text-xs tracking-[0.4em] uppercase font-extralight" style={{ writingMode: "vertical-rl" }}>
              NET OS Platform
            </div>
          </div>

          <div className="text-white/20 text-sm font-extralight tracking-[0.15em] uppercase">
            7 Locations · Netherlands
          </div>
        </div>
      </div>

      {/* Bottom ticker */}
      <div className="absolute bottom-0 inset-x-0 h-12 flex items-center overflow-hidden bg-[#627653]/20 backdrop-blur-sm">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-16 text-white/50 text-sm tracking-[0.2em] uppercase font-extralight">
          <span>Apeldoorn</span><span className="text-[#b8a472]">●</span>
          <span>Amsterdam</span><span className="text-[#b8a472]">●</span>
          <span>Rotterdam</span><span className="text-[#b8a472]">●</span>
          <span>Zwolle</span><span className="text-[#b8a472]">●</span>
          <span>Ede</span><span className="text-[#b8a472]">●</span>
          <span>Klarenbeek</span><span className="text-[#b8a472]">●</span>
          <span>Spijkenisse</span><span className="text-[#b8a472]">●</span>
          <span>Apeldoorn</span><span className="text-[#b8a472]">●</span>
          <span>Amsterdam</span><span className="text-[#b8a472]">●</span>
          <span>Rotterdam</span><span className="text-[#b8a472]">●</span>
          <span>Zwolle</span><span className="text-[#b8a472]">●</span>
          <span>Ede</span><span className="text-[#b8a472]">●</span>
          <span>Klarenbeek</span><span className="text-[#b8a472]">●</span>
          <span>Spijkenisse</span>
        </div>
      </div>
    </div>
  );
}
