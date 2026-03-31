import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Zap, MapPin, CreditCard, Shield, ArrowRight, Smartphone, Building2,
  Users, ChevronRight, Wifi, Coffee, Monitor, Lock, Check, Star
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: locations } = trpc.locations.list.useQuery();
  const { data: bundles } = trpc.bundles.list.useQuery();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Zap className="h-4 w-4 text-primary-foreground" /></div>
            <span className="text-xl font-bold tracking-tight">NET OS</span>
            <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">by Mr. Green</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#locations" className="hover:text-foreground transition-colors">Locations</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#access" className="hover:text-foreground transition-colors">Access Zones</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => setLocation("/dashboard")} size="sm">Dashboard <ArrowRight className="ml-1 h-3 w-3" /></Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => (window.location.href = getLoginUrl())}>Sign in</Button>
                <Button size="sm" onClick={() => (window.location.href = getLoginUrl())}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6 border border-primary/20">
              <Shield className="h-3 w-3" />
              Invite-Only Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              <span className="gradient-text">Office for</span>
              <br />
              the Unbound
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              One app. Seven premium locations. Seamless access, smart credits, and
              everything you need to work without boundaries across the Netherlands.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => (window.location.href = getLoginUrl())} className="h-12 px-8">
                Request Access <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 bg-transparent" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                Explore Features
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-10 border-t border-border/30">
            {[
              { value: "7", label: "Premium Locations" },
              { value: "917", label: "Bookable Resources" },
              { value: "1,800+", label: "Active Members" },
              { value: "165+", label: "Companies" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section id="locations" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Seven Boutique Locations</h2>
            <p className="text-muted-foreground max-w-lg">Premium workspaces across the Netherlands, each with its own character.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(locations ?? []).map((loc: any) => (
              <div key={loc.id} className="group glass-card rounded-xl p-5 hover:border-primary/30 transition-all duration-300 cursor-pointer" onClick={() => { if (user) setLocation(`/locations/${loc.slug}`); else window.location.href = getLoginUrl(); }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><MapPin className="h-5 w-5 text-primary" /></div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{loc.name.replace("Mr. Green ", "")}</h3>
                <p className="text-sm text-muted-foreground mb-2">{loc.city}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Monitor className="w-3 h-3" />{loc.totalResources} resources
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Everything in One App</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">From opening doors to booking rooms, managing credits to inviting visitors.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Lock, title: "Smart Access", desc: "Open doors with your phone via Salto KS. Zone-based access from lobby to private offices." },
              { icon: CreditCard, title: "Credit Wallet", desc: "Dual wallet system with company and personal credits. Dynamic pricing with day multipliers." },
              { icon: Monitor, title: "Book Anything", desc: "Desks, meeting rooms, offices, gym. Real-time availability across all 7 locations." },
              { icon: Building2, title: "Company Hub", desc: "Manage teams, set credit limits, track usage. Bronze, Silver, Gold tier benefits." },
              { icon: Users, title: "Visitor Management", desc: "Invite guests with one tap. License plate registration and temporary access." },
              { icon: Smartphone, title: "Signing Platform", desc: "Your company branding on every screen. Dynamic displays that change when you enter." },
              { icon: Wifi, title: "IoT Connected", desc: "177 NETOS devices and 2,478 sensors for real-time occupancy and smart automation." },
              { icon: Coffee, title: "Micro-Services", desc: "Coffee, lunch, printing, lockers. All payable with credits from your wallet." },
              { icon: Shield, title: "Invite Only", desc: "An exclusive community. Get invited by a member or company to join the network." },
            ].map((feature) => (
              <div key={feature.title} className="glass-card rounded-xl p-6 hover:border-primary/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><feature.icon className="h-5 w-5 text-primary" /></div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zone System */}
      <section id="access" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Zone-Based Access</h2>
            <p className="text-muted-foreground max-w-lg">Seamless access across four zones, automatically managed through your credits.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { zone: "Zone 0", name: "Transit", desc: "Lobby, corridors, lifts", cost: "Free", color: "text-muted-foreground", border: "border-border/50" },
              { zone: "Zone 1", name: "Base Access", desc: "Lounge, WiFi, coffee", cost: "4 cr/day", color: "text-blue-400", border: "border-blue-500/20" },
              { zone: "Zone 2", name: "Smart Desk", desc: "Dedicated flex desk", cost: "2 cr/hr", color: "text-primary", border: "border-primary/20" },
              { zone: "Zone 3", name: "Private", desc: "Meeting rooms & offices", cost: "10+ cr/hr", color: "text-amber-400", border: "border-amber-500/20" },
            ].map((z) => (
              <div key={z.zone} className={`glass-card rounded-xl p-6 ${z.border} transition-all hover:scale-[1.02]`}>
                <div className={`text-xs font-mono ${z.color} mb-3 flex items-center gap-2`}><Lock className="w-3 h-3" />{z.zone}</div>
                <h3 className="font-semibold text-foreground text-lg mb-1">{z.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{z.desc}</p>
                <div className={`text-sm font-semibold ${z.color}`}>{z.cost}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Credit Bundles</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">1 Credit = &euro;5. Choose a bundle that fits your workstyle. Unused credits roll over.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(bundles ?? []).map((bundle: any) => (
              <div key={bundle.id} className={`glass-card rounded-xl p-6 relative transition-all duration-300 ${bundle.isPopular ? "border-primary/50" : "hover:border-primary/20"}`}>
                {bundle.isPopular && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-netos-green to-emerald-400 rounded-t-xl" />}
                {bundle.isPopular && <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center gap-1"><Star className="w-3 h-3" />Popular</div>}
                <h3 className="font-semibold text-foreground text-lg mb-1">{bundle.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{bundle.description}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold">{parseFloat(bundle.priceEur) === 0 ? "Free" : `€${parseFloat(bundle.priceEur)}`}</span>
                  {parseFloat(bundle.priceEur) > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                </div>
                <div className="text-sm text-primary font-semibold mb-4">{bundle.creditsPerMonth} credits/month</div>
                <div className="space-y-2 pt-4 border-t border-border/30">
                  {(bundle.features as string[] ?? []).map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-3.5 w-3.5 text-netos-green shrink-0" />{f}</div>
                  ))}
                </div>
                <Button className="w-full mt-6" variant={bundle.isPopular ? "default" : "outline"} onClick={() => (window.location.href = getLoginUrl())}>
                  {parseFloat(bundle.priceEur) === 0 ? "Get Started" : "Choose Plan"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Smart Pricing</h2>
            <p className="text-muted-foreground max-w-lg">Dynamic multipliers reward off-peak usage. Save up to 55% on quiet days.</p>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[
              { day: "Mon", mult: 0.5 }, { day: "Tue", mult: 0.7 }, { day: "Wed", mult: 1.0 },
              { day: "Thu", mult: 1.4 }, { day: "Fri", mult: 0.45 }, { day: "Sat", mult: 0.5 }, { day: "Sun", mult: 0.5 },
            ].map((d) => (
              <div key={d.day} className="glass-card rounded-xl p-4 text-center">
                <div className="text-xs text-muted-foreground mb-2">{d.day}</div>
                <div className="h-20 rounded-lg mb-2 flex items-end justify-center">
                  <div className={`w-full rounded-lg ${d.mult >= 1 ? "bg-amber-500/30" : "bg-primary/30"}`} style={{ height: `${d.mult * 70}%` }} />
                </div>
                <div className={`text-sm font-semibold ${d.mult >= 1 ? "text-amber-400" : "text-netos-green"}`}>{d.mult}x</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-12 border-primary/20">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to work unbound?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join 1,800+ professionals and 165+ companies already using NET OS across 7 premium locations.
            </p>
            <Button size="lg" className="h-12 px-8" onClick={() => (window.location.href = getLoginUrl())}>
              Request Access <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center"><Zap className="h-3 w-3 text-primary-foreground" /></div>
            <span className="text-sm font-medium">NET OS</span>
            <span className="text-xs text-muted-foreground">by Mr. Green Boutique Offices</span>
          </div>
          <div className="text-xs text-muted-foreground">Invite-only platform &middot; &copy; {new Date().getFullYear()} Mr. Green Offices</div>
        </div>
      </footer>
    </div>
  );
}
