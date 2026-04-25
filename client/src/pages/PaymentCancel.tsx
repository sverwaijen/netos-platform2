import { XCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function PaymentCancel() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-400/10 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-extralight tracking-[-0.5px] mb-2">
          Payment <strong className="font-semibold">cancelled.</strong>
        </h1>
        <p className="text-[13px] text-[#888] font-light leading-[1.7] mb-8">
          Your payment was cancelled. No charges were made. You can try again anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/bundles">
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-[#C4B89E] text-black text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#b5a98e] transition-all cursor-pointer">
              View Plans <ArrowRight className="w-3.5 h-3.5" />
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
