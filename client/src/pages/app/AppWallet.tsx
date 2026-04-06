import { trpc } from "@/lib/trpc";
import { Wallet, ArrowUpRight, ArrowDownRight, CreditCard, TrendingUp, Plus } from "lucide-react";
import { toast } from "sonner";

function translateDescription(desc: string): string {
  if (!desc) return "Transactie";
  return desc
    .replace(/^Top-up of (\d+) credits$/, "Opwaardering van $1 credits")
    .replace(/^Booking: (.+) \((.+)\)$/, "Boeking: $1 ($2)")
    .replace(/^Refund for cancelled booking #(\d+)$/, "Terugbetaling geannuleerde boeking #$1")
    .replace(/^Kiosk order (.+)$/, "Kiosk bestelling $1")
    .replace(/^Payment for parking session$/, "Betaling parkeersessie")
    .replace(/^Credit purchase$/, "Credits aankoop")
    .replace(/^Manual adjustment$/, "Handmatige aanpassing");
}

export default function AppWallet() {
  const { data: wallets = [] } = trpc.wallets.mine.useQuery();
  const personalWalletId = wallets?.find((w: any) => w.type === "personal")?.id;
  const { data: ledger = [] } = trpc.wallets.ledger.useQuery(
    { walletId: personalWalletId!, limit: 20 },
    { enabled: !!personalWalletId }
  );
  const personalWallet = wallets.find((w: any) => w.type === "personal");
  const companyWallet = wallets.find((w: any) => w.type === "company");

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-light text-white">Wallet</h1>
        <button
          onClick={() => toast.info("Opwaarderen via iDEAL komt binnenkort", { description: "Binnenkort beschikbaar" })}
          className="flex items-center gap-1.5 bg-[#627653] text-white text-xs font-medium px-4 py-2 rounded-full active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
          Opwaarderen
        </button>
      </div>

      {/* Balance Cards */}
      <div className="space-y-3">
        {personalWallet && (
          <div className="bg-gradient-to-br from-[#627653] to-[#4a5c3f] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -mr-10 -mt-10" />
            <p className="text-white/60 text-xs tracking-[0.15em] uppercase">Persoonlijk Saldo</p>
            <p className="text-white text-3xl font-light mt-2">
              {parseFloat(personalWallet.balance).toFixed(2)}
              <span className="text-lg text-white/60 ml-1">credits</span>
            </p>
            <div className="flex items-center gap-2 mt-3">
              <CreditCard className="w-4 h-4 text-white/40" />
              <span className="text-white/40 text-xs">Persoonlijke credits</span>
            </div>
          </div>
        )}

        {companyWallet && (
          <div className="bg-gradient-to-br from-[#b8a472] to-[#8B7355] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -mr-10 -mt-10" />
            <p className="text-white/60 text-xs tracking-[0.15em] uppercase">Bedrijf Saldo</p>
            <p className="text-white text-3xl font-light mt-2">
              {parseFloat(companyWallet.balance).toFixed(2)}
              <span className="text-lg text-white/60 ml-1">credits</span>
            </p>
            <div className="flex items-center gap-2 mt-3">
              <CreditCard className="w-4 h-4 text-white/40" />
              <span className="text-white/40 text-xs">Bedrijf credits</span>
            </div>
          </div>
        )}

        {!personalWallet && !companyWallet && (
          <div className="bg-white/[0.03] rounded-2xl p-8 text-center">
            <Wallet className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Nog geen wallet</p>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Recente Transacties</h2>
        {ledger.length === 0 ? (
          <div className="bg-white/[0.03] rounded-2xl p-6 text-center">
            <TrendingUp className="w-8 h-8 text-white/15 mx-auto mb-2" />
            <p className="text-white/30 text-sm">Geen transacties</p>
          </div>
        ) : (
          <div className="space-y-1">
            {ledger.map((tx: any) => {
              const isCredit = parseFloat(tx.amount) > 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    {isCredit ? (
                      <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{translateDescription(tx.description || tx.type)}</p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <p className={`text-sm font-medium flex-shrink-0 ${isCredit ? "text-emerald-500" : "text-red-400"}`}>
                    {isCredit ? "+" : ""}{parseFloat(tx.amount).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
