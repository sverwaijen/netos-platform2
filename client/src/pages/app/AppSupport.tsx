import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LifeBuoy, MessageSquare, ChevronRight, Plus,
  Send, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";

export default function AppSupport() {
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("general");

  const { data: tickets = [], refetch } = trpc.tickets.list.useQuery({});
  const createTicket = trpc.tickets.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowNew(false);
      setTitle("");
      setDesc("");
      toast.success("Ticket aangemaakt", { description: "We nemen zo snel mogelijk contact op" });
    },
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "in_progress": return <Clock className="w-4 h-4 text-blue-400" />;
      case "resolved": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <Clock className="w-4 h-4 text-white/30" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "open": return "Open";
      case "in_progress": return "In behandeling";
      case "resolved": return "Opgelost";
      case "closed": return "Gesloten";
      default: return status;
    }
  };

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-light text-white">Support</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="w-9 h-9 rounded-full bg-[#C4B89E] flex items-center justify-center"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* New Ticket Form */}
      {showNew && (
        <div className="bg-white/[0.03] rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2">
          <h3 className="text-white text-sm font-medium">Nieuw Ticket</h3>
          <div>
            <label className="text-white/40 text-xs block mb-1">Categorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C4B89E]/50 appearance-none"
            >
            <option value="general">Algemeen</option>
            <option value="maintenance">Onderhoud</option>
            <option value="wifi">WiFi</option>
            <option value="billing">Facturatie</option>
            <option value="access">Toegang</option>
            <option value="cleaning">Schoonmaak</option>
            <option value="noise">Geluidsoverlast</option>
            </select>
          </div>
          <div>
            <label className="text-white/40 text-xs block mb-1">Onderwerp</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kort omschrijven..."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#C4B89E]/50"
            />
          </div>
          <div>
            <label className="text-white/40 text-xs block mb-1">Beschrijving</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Beschrijf het probleem..."
              rows={3}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#C4B89E]/50 resize-none"
            />
          </div>
          <button
            onClick={() => createTicket.mutate({ subject: title, description: desc, category: category as any, priority: "normal" })}
            disabled={!title.trim() || createTicket.isPending}
            className="w-full py-3 rounded-xl bg-[#C4B89E] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {createTicket.isPending ? "Verzenden..." : "Verstuur Ticket"}
          </button>
        </div>
      )}

      {/* FAQ */}
      <div>
        <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Veelgestelde Vragen</h2>
        <div className="space-y-2">
          {[
            { q: "Hoe verbind ik met WiFi?", a: "Ga naar Toegang → WiFi en tik op 'Verbinden'" },
            { q: "Hoe boek ik een vergaderruimte?", a: "Ga naar Boekingen → Boek een ruimte" },
            { q: "Hoe laad ik credits op?", a: "Ga naar Wallet → Opwaarderen" },
            { q: "Hoe open ik een deur?", a: "Ga naar Toegang → Tik op de gewenste deur" },
          ].map((faq, i) => (
            <details key={i} className="bg-white/[0.03] rounded-xl group">
              <summary className="flex items-center gap-3 p-4 cursor-pointer list-none">
                <MessageSquare className="w-4 h-4 text-white/30 flex-shrink-0" />
                <span className="text-white text-sm flex-1">{faq.q}</span>
                <ChevronRight className="w-4 h-4 text-white/20 transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-4 pb-4 pl-11">
                <p className="text-white/40 text-sm">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* My Tickets */}
      <div>
        <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Mijn Tickets</h2>
        {tickets.length === 0 ? (
          <div className="bg-white/[0.03] rounded-2xl p-6 text-center">
            <LifeBuoy className="w-8 h-8 text-white/15 mx-auto mb-2" />
            <p className="text-white/30 text-sm">Geen tickets</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket: any) => (
              <div key={ticket.id} className="bg-white/[0.03] rounded-xl p-4 flex items-center gap-3">
                {statusIcon(ticket.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{ticket.title}</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {statusLabel(ticket.status)} · {new Date(ticket.createdAt).toLocaleDateString("nl-NL")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
