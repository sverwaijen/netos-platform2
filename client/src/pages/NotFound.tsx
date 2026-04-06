import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <p className="text-[120px] font-extralight text-white/10 leading-none">404</p>
        <h2 className="text-xl font-light text-white mt-4 tracking-wide">
          Pagina niet gevonden
        </h2>
        <p className="text-white/40 mt-3 text-sm max-w-sm mx-auto">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <Button
          onClick={() => setLocation("/")}
          className="mt-8 bg-[#627653] hover:bg-[#3a4a34] text-white px-8"
        >
          <Home className="w-4 h-4 mr-2" />
          Naar Home
        </Button>
      </div>
    </div>
  );
}
