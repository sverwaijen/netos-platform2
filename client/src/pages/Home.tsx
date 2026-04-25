import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { BRAND, LOCATION_IMAGES } from "@/lib/brand";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const TICKER_ITEMS = [
  "Apply for membership",
  "7 locations across the Netherlands",
  "Invite only",
  "23% acceptance rate",
  "A network, not an office",
];

const LOCATIONS = [
  { city: "Amsterdam", slug: "amsterdam", tag: "Waitlist only", tagClass: "bg-white/[0.08] text-white/40" },
  { city: "Rotterdam", slug: "rotterdam", tag: "2 spots left", tagClass: "bg-[#C4B89E]/25 text-[#C4B89E]" },
  { city: "Zwolle", slug: "zwolle", tag: "3 spots left", tagClass: "bg-[#C4B89E]/25 text-[#C4B89E]" },
  { city: "Ede", slug: "ede", tag: "Accepting applications", tagClass: "bg-[#C4B89E]/20 text-[#C4B89E]" },
  { city: "Apeldoorn", slug: "apeldoorn", tag: "Accepting applications", tagClass: "bg-[#C4B89E]/20 text-[#C4B89E]" },
  { city: "Klarenbeek", slug: "klarenbeek", tag: "5 spots left", tagClass: "bg-[#C4B89E]/25 text-[#C4B89E]" },
  { city: "Spijkenisse", slug: "spijkenisse", tag: "Opening soon", tagClass: "bg-[#C4B89E]/20 text-[#C4B89E]" },
];

const FEATURES = [
  { label: "The space", title: "Your office.", bold: "Seven addresses.", desc: "A private office at one location. Access to all seven. Work in Amsterdam today, Zwolle tomorrow. Your membership travels with you.", img: BRAND.images.boutiqueOffice },
  { label: "The network", title: "Not private members.", bold: "Co-growing.", desc: "Monthly member events. Quarterly dinners. A private directory of businesses that think like you. The connections you make here don't happen at networking drinks.", img: BRAND.images.zwolleCommunity },
];

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e: any) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.15 }
    );
    el.querySelectorAll(".fade-in").forEach((child: any) => obs.observe(child));
    return () => obs.disconnect();
  }, []);
  return ref;
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const pageRef = useFadeIn();
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);

  const submitContact = { mutateAsync: async (data: any) => { console.log('Contact form:', data); return { success: true }; }, isPending: false } as any; // TODO: wire contact router
  const _unused = ({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Application received! We'll be in touch within 5 business days.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.company || !form.email) {
      toast.error("Please fill in your name, company, and email.");
      return;
    }
    submitContact.mutate({
      name: form.name,
      company: form.company,
      email: form.email,
      phone: form.phone || undefined,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelector(".hero-fade")?.classList.add("visible");
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-[#111] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-12 py-7" style={{ mixBlendMode: "difference" }}>
        <div>
          <img src={BRAND.logo} alt="The Green" className="h-6 brightness-[10]" />
        </div>
        <div className="flex items-center gap-8">
          {isAuthenticated ? (
            <Link href="/dashboard" className="text-white no-underline text-[10px] font-semibold tracking-[3px] uppercase pb-2.5 border-b border-white/40 hover:border-white transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <a href={getLoginUrl()} className="text-white no-underline text-[10px] font-semibold tracking-[3px] uppercase pb-2.5 border-b border-white/40 hover:border-white transition-colors">
                Member login
              </a>
              <a href="#apply" className="text-white no-underline text-[10px] font-semibold tracking-[3px] uppercase pb-2.5 border-b border-white/40 hover:border-white transition-colors">
                Request access
              </a>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="h-screen min-h-[600px] flex items-end relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BRAND.images.amsterdam})` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)" }} />
        <div className="hero-fade fade-in relative z-10 px-6 md:px-12 pb-20 max-w-[720px]">
          <h1 className="text-[clamp(40px,6vw,72px)] font-extralight leading-[1.05] tracking-[-2px] mb-6">
            You don't<br />find us.<br /><span className="font-semibold">We find you.</span>
          </h1>
          <div className="w-10 h-px bg-[#C4B89E] my-7" />
          <p className="text-sm text-[#888] font-light tracking-[0.5px] leading-[1.7] max-w-[420px]">
            The Green is a closed community of selected businesses. Access to seven premium locations across the Netherlands — by invitation only.
          </p>
        </div>
      </section>

      {/* TICKER */}
      <div className="border-t border-b border-white/[0.06] overflow-hidden whitespace-nowrap py-4">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-[11px] font-normal tracking-[4px] uppercase text-white/20 px-12">
              {item} <span className="text-[#C4B89E] ml-12">&middot;</span>
            </span>
          ))}
        </div>
      </div>

      {/* STATEMENT */}
      <div className="py-16 md:py-40 px-6 md:px-12 flex justify-center">
        <div className="max-w-[640px] fade-in">
          <p className="text-[clamp(22px,3vw,34px)] font-extralight leading-[1.5] tracking-[-0.5px] text-white/85">
            We don't sell desks. We curate a community. Every member is <span className="text-[#C4B89E] font-normal">selected</span> for what they bring to the network — not what they pay for a room.
          </p>
        </div>
      </div>

      {/* SPLIT SECTIONS */}
      {FEATURES.map((feat, i) => (
        <div key={i} className={`grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]`}>
          <div className={`overflow-hidden ${i % 2 === 1 ? "lg:order-2" : ""}`}>
            <img src={feat.img} alt={feat.label} className="w-full h-full object-cover brightness-[0.8] hover:scale-[1.03] transition-transform duration-[8s]" />
          </div>
          <div className={`flex flex-col justify-center px-6 md:px-[72px] py-20 fade-in ${i % 2 === 1 ? "lg:order-1" : ""}`}>
            <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#C4B89E] mb-8">{feat.label}</div>
            <h2 className="text-[clamp(28px,3vw,42px)] font-extralight leading-[1.2] tracking-[-0.5px] mb-7">
              {feat.title}<br /><strong className="font-semibold">{feat.bold}</strong>
            </h2>
            <p className="text-sm text-[#888] leading-[1.8] font-light max-w-[400px]">{feat.desc}</p>
          </div>
        </div>
      ))}

      {/* NUMBERS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] border-t border-b border-white/[0.06] py-16 px-4 md:py-[120px] md:px-12">
        {[
          { val: "87", label: "Current members" },
          { val: "7", label: "Locations" },
          { val: "143", label: "On the waitlist" },
          { val: "23%", label: "Acceptance rate" },
        ].map((n, i) => (
          <div key={i} className="text-center py-10 px-5 bg-[#111] fade-in">
            <div className="text-[clamp(36px,4vw,56px)] font-extralight tracking-[-1px]">{n.val}</div>
            <div className="text-[10px] text-[#888] tracking-[3px] uppercase mt-3 font-normal">{n.label}</div>
          </div>
        ))}
      </div>

      {/* LOCATIONS */}
      <div className="py-[120px] px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 fade-in">
          <h2 className="text-[clamp(28px,3vw,42px)] font-extralight tracking-[-0.5px]">
            Where we <strong className="font-semibold">are.</strong>
          </h2>
          <div className="text-[11px] text-[#888] tracking-[1px] font-light mt-3 md:mt-0">Availability updated weekly</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[3px]">
          {LOCATIONS.slice(0, 4).map((loc: any) => (
            <Link key={loc.slug} href={`/locations/${loc.slug}`} className="no-underline">
              <div className="relative aspect-[3/4] overflow-hidden cursor-pointer group">
                <img
                  src={LOCATION_IMAGES[loc.slug]}
                  alt={loc.city}
                  className="w-full h-full object-cover brightness-[0.55] saturate-[0.8] group-hover:brightness-[0.4] group-hover:saturate-[0.6] group-hover:scale-[1.03] transition-all duration-600"
                />
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <div className="text-lg font-normal tracking-[1px] text-white">{loc.city}</div>
                  <span className={`inline-block mt-2.5 text-[9px] font-semibold tracking-[2.5px] uppercase px-3.5 py-1.5 ${loc.tagClass}`}>
                    {loc.tag}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[3px] mt-[3px]">
          {LOCATIONS.slice(4).map((loc: any) => (
            <Link key={loc.slug} href={`/locations/${loc.slug}`} className="no-underline">
              <div className="relative aspect-[4/3] overflow-hidden cursor-pointer group">
                <img
                  src={LOCATION_IMAGES[loc.slug]}
                  alt={loc.city}
                  className="w-full h-full object-cover brightness-[0.55] saturate-[0.8] group-hover:brightness-[0.4] group-hover:saturate-[0.6] group-hover:scale-[1.03] transition-all duration-600"
                />
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <div className="text-lg font-normal tracking-[1px] text-white">{loc.city}</div>
                  <span className={`inline-block mt-2.5 text-[9px] font-semibold tracking-[2.5px] uppercase px-3.5 py-1.5 ${loc.tagClass}`}>
                    {loc.tag}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* APPLY */}
      <section id="apply" className="py-16 md:py-40 px-6 md:px-12 flex justify-center border-t border-white/[0.06]">
        <div className="max-w-[520px] w-full text-center fade-in">
          <div className="inline-flex items-center gap-2.5 text-xs text-[#C4B89E] font-normal tracking-[1px] mb-12">
            <span className="w-[5px] h-[5px] rounded-full bg-[#C4B89E] animate-pulse-slow" />
            143 companies ahead of you
          </div>
          <h2 className="text-[clamp(32px,4vw,52px)] font-extralight leading-[1.15] tracking-[-1px] mb-4">
            Request <strong className="font-semibold">access.</strong>
          </h2>
          <p className="text-[13px] text-[#888] font-light leading-[1.7] mb-12">
            We review every application personally. If there's a match, you'll hear from us within five business days.
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <button className="w-full mt-4 py-[18px] border border-white/15 bg-transparent text-white font-semibold text-[10px] tracking-[4px] uppercase hover:bg-white hover:text-[#111] transition-all duration-400">
                Go to dashboard
              </button>
            </Link>
          ) : submitted ? (
            <div className="py-12">
              <div className="w-12 h-12 rounded-full bg-[#C4B89E]/20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-6 h-6 text-[#C4B89E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-light mb-3">Application received.</h3>
              <p className="text-[13px] text-[#888] font-light leading-[1.7]">
                We'll review your application and get back to you within five business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-0">
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="py-[18px] border-0 border-b border-white/10 bg-transparent text-white font-light text-sm outline-none focus:border-b-[#C4B89E] transition-colors placeholder:text-white/25"
              />
              <input
                type="text"
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
                required
                className="py-[18px] border-0 border-b border-white/10 bg-transparent text-white font-light text-sm outline-none focus:border-b-[#C4B89E] transition-colors placeholder:text-white/25"
              />
              <input
                type="email"
                placeholder="Work email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="py-[18px] border-0 border-b border-white/10 bg-transparent text-white font-light text-sm outline-none focus:border-b-[#C4B89E] transition-colors placeholder:text-white/25"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className="py-[18px] border-0 border-b border-white/10 bg-transparent text-white font-light text-sm outline-none focus:border-b-[#C4B89E] transition-colors placeholder:text-white/25"
              />
              <button
                type="submit"
                disabled={submitContact.isPending}
                className="w-full mt-10 py-[18px] border border-white/15 bg-transparent text-white font-semibold text-[10px] tracking-[4px] uppercase hover:bg-white hover:text-[#111] transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitContact.isPending ? "Submitting..." : "Join the waitlist"}
              </button>
            </form>
          )}
          <p className="text-[11px] text-white/20 mt-6 font-light">
            Your data stays with us. No spam. No sales calls. Just a conversation if it fits.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-12 py-12 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
        <img src={BRAND.logo} alt="The Green" className="h-5 opacity-40" />
        <div className="text-[10px] text-white/20 tracking-[2px] font-normal">OFFICE FOR THE UNBOUND</div>
      </footer>
    </div>
  );
}
