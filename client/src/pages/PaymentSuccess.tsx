import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function PaymentSuccess() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-400/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-extralight tracking-[-0.5px] mb-2">
          Payment <strong className="font-semibold">successful.</strong>
        </h1>
        <p className="text-[13px] text-[#888] font-light leading-[1.7] mb-8">
          Your payment has been processed. Credits will be added to your wallet shortly.
          It may take a few moments for the webhook to process.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/credits">
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-[#C4B89E] text-black text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#b5a98e] transition-all cursor-pointer">
              View Wallet <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
          <Link href="/dashboard">
            <span className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 text-[10px] font-semibold tracking-[3px] uppercase hover:bg-white/5 transition-all cursor-pointer">
              Dashboard
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
