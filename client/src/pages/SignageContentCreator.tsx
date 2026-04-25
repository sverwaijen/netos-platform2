import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Type, Image, Video, Palette, Plus, Trash2, Save, Eye, ArrowLeft,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Move,
  Layers, Copy, ChevronUp, ChevronDown, Upload, Sparkles,
  Monitor, Smartphone, LayoutGrid, Undo2, Redo2, Download,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
interface SlideElement {
  id: string;
  type: "text" | "image" | "video" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  // Text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: "left" | "center" | "right";
  color?: string;
  lineHeight?: number;
  // Image/Video
  src?: string;
  objectFit?: "cover" | "contain" | "fill";
  borderRadius?: number;
  // Shape
  shapeType?: "rectangle" | "circle" | "line";
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
}

interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
  backgroundImage?: string;
  duration: number;
}

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const FONTS = ["Inter", "Playfair Display", "Roboto Mono", "Montserrat", "Lora", "Oswald", "Raleway", "DM Sans"];
const PRESET_COLORS = [
  "#627653", "#4a5d3a", "#3a4d2a", "#2d3a1f", "#1a2a0f",
  "#8b6f47", "#d4a853", "#c4a35a", "#5a4a3a", "#f5f0e8",
  "#ffffff", "#000000", "#dc2626", "#f59e0b", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1", "#78716c",
];

const TEMPLATES = [
  {
    name: "Mr. Green Welcome",
    background: "linear-gradient(135deg, #627653, #3a4d2a)",
    elements: [
      { id: "t1", type: "text" as const, x: 160, y: 300, width: 1600, height: 120, rotation: 0, zIndex: 2, text: "Welkom bij Mr. Green", fontSize: 72, fontFamily: "Inter", fontWeight: "300", textAlign: "center" as const, color: "#ffffff", lineHeight: 1.2, opacity: 1 },
      { id: "t2", type: "text" as const, x: 160, y: 440, width: 1600, height: 60, rotation: 0, zIndex: 2, text: "Your next level office", fontSize: 28, fontFamily: "Inter", fontWeight: "300", textAlign: "center" as const, color: "rgba(255,255,255,0.6)", lineHeight: 1.4, opacity: 1 },
    ],
    duration: 15,
  },
  {
    name: "Menu Highlight",
    background: "linear-gradient(135deg, #5a4a3a, #3a2a1a)",
    elements: [
      { id: "t1", type: "text" as const, x: 120, y: 80, width: 800, height: 80, rotation: 0, zIndex: 2, text: "MENU HIGHLIGHTS", fontSize: 18, fontFamily: "Inter", fontWeight: "600", textAlign: "left" as const, color: "#c4a35a", lineHeight: 1.2, opacity: 1 },
      { id: "t2", type: "text" as const, x: 120, y: 160, width: 800, height: 100, rotation: 0, zIndex: 2, text: "Daily Fresh Homemade.", fontSize: 56, fontFamily: "Inter", fontWeight: "200", textAlign: "left" as const, color: "#ffffff", lineHeight: 1.1, opacity: 1 },
      { id: "t3", type: "text" as const, x: 120, y: 320, width: 700, height: 400, rotation: 0, zIndex: 2, text: "Uiensoep — € 3,95\nSmoked Beef sandwich — € 7,95\nSalade gegrilde groente — € 10,25\nPulled Chicken wrap — € 7,50", fontSize: 24, fontFamily: "Inter", fontWeight: "300", textAlign: "left" as const, color: "rgba(255,255,255,0.8)", lineHeight: 2.2, opacity: 1 },
    ],
    duration: 20,
  },
  {
    name: "Event Announcement",
    background: "linear-gradient(135deg, #1a2a0f, #0a1a05)",
    elements: [
      { id: "t1", type: "text" as const, x: 160, y: 200, width: 1600, height: 80, rotation: 0, zIndex: 2, text: "UPCOMING EVENT", fontSize: 16, fontFamily: "Inter", fontWeight: "600", textAlign: "center" as const, color: "#8fa97a", lineHeight: 1.2, opacity: 1 },
      { id: "t2", type: "text" as const, x: 160, y: 300, width: 1600, height: 120, rotation: 0, zIndex: 2, text: "Networking Borrel", fontSize: 64, fontFamily: "Inter", fontWeight: "200", textAlign: "center" as const, color: "#ffffff", lineHeight: 1.2, opacity: 1 },
      { id: "t3", type: "text" as const, x: 160, y: 450, width: 1600, height: 60, rotation: 0, zIndex: 2, text: "Elke vrijdag — 17:00 — Lobby", fontSize: 24, fontFamily: "Inter", fontWeight: "300", textAlign: "center" as const, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, opacity: 1 },
    ],
    duration: 20,
  },
  {
    name: "Smoothie Bar",
    background: "linear-gradient(135deg, #3a5d2a, #1a3d0a)",
    elements: [
      { id: "t1", type: "text" as const, x: 160, y: 120, width: 1600, height: 100, rotation: 0, zIndex: 2, text: "Smoothie Bar", fontSize: 64, fontFamily: "Inter", fontWeight: "200", textAlign: "center" as const, color: "#ffffff", lineHeight: 1.2, opacity: 1 },
      { id: "t2", type: "text" as const, x: 260, y: 300, width: 1400, height: 400, rotation: 0, zIndex: 2, text: "🥒  Green Machine — Komkommer | Avocado | Appel\n🥭  Yellow Star — Mango | Sinaasappel | Munt\n🍓  Red Devil — Aardbei | Rode biet | Banaan\n🍐  Pearfect Fall — Peer | Banaan | Kaneel\n🎃  Pumpkin Spice — Pompoen | Mango | Speculaas", fontSize: 26, fontFamily: "Inter", fontWeight: "300", textAlign: "left" as const, color: "rgba(255,255,255,0.85)", lineHeight: 2, opacity: 1 },
      { id: "t3", type: "text" as const, x: 160, y: 780, width: 1600, height: 60, rotation: 0, zIndex: 2, text: "€ 3,75", fontSize: 36, fontFamily: "Inter", fontWeight: "600", textAlign: "center" as const, color: "#c4d4a0", lineHeight: 1.2, opacity: 1 },
    ],
    duration: 15,
  },
  {
    name: "Blank — Dark",
    background: "#111111",
    elements: [],
    duration: 15,
  },
  {
    name: "Blank — Light",
    background: "#f5f0e8",
    elements: [],
    duration: 15,
  },
];

let nextId = 1;
const uid = () => `el-${Date.now()}-${nextId++}`;

export default function SignageContentCreator() {
  const { user } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([
    { id: "slide-1", elements: [], background: "linear-gradient(135deg, #627653, #3a4d2a)", duration: 15 },
  ]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [selectedElId, setSelectedElId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);
  const [title, setTitle] = useState("Nieuwe Content");
  const [targetScreenTypes, setTargetScreenTypes] = useState<string[]>(["general"]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [history, setHistory] = useState<Slide[][]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const createContent = trpc.signageContent.create.useMutation({
    onSuccess: () => {
      toast.success("Content opgeslagen!");
      setShowSaveDialog(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const activeSlide = slides[activeSlideIdx];
  const selectedEl = activeSlide?.elements.find((e) => e.id === selectedElId) || null;

  // ─── History ──────────────────────────────────────────────────────
  const pushHistory = useCallback(() => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIdx + 1);
      newHistory.push(JSON.parse(JSON.stringify(slides)));
      return newHistory;
    });
    setHistoryIdx((prev) => prev + 1);
  }, [slides, historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      setSlides(JSON.parse(JSON.stringify(history[historyIdx - 1])));
      setHistoryIdx((prev) => prev - 1);
    }
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      setSlides(JSON.parse(JSON.stringify(history[historyIdx + 1])));
      setHistoryIdx((prev) => prev + 1);
    }
  }, [history, historyIdx]);

  // ─── Element CRUD ─────────────────────────────────────────────────
  const updateSlide = useCallback((fn: (s: Slide) => Slide) => {
    setSlides((prev) => prev.map((s, i) => (i === activeSlideIdx ? fn(s) : s)));
  }, [activeSlideIdx]);

  const updateElement = useCallback((elId: string, updates: Partial<SlideElement>) => {
    updateSlide((s) => ({
      ...s,
      elements: s.elements.map((e) => (e.id === elId ? { ...e, ...updates } : e)),
    }));
  }, [updateSlide]);

  const addElement = useCallback((type: SlideElement["type"]) => {
    pushHistory();
    const id = uid();
    const base: SlideElement = {
      id,
      type,
      x: CANVAS_W / 2 - 300,
      y: CANVAS_H / 2 - 50,
      width: 600,
      height: 100,
      rotation: 0,
      zIndex: (activeSlide?.elements.length || 0) + 1,
      opacity: 1,
    };
    if (type === "text") {
      Object.assign(base, {
        text: "Nieuwe tekst",
        fontSize: 32,
        fontFamily: "Inter",
        fontWeight: "400",
        textAlign: "center",
        color: "#ffffff",
        lineHeight: 1.4,
      });
    } else if (type === "image") {
      Object.assign(base, { src: "", objectFit: "cover", borderRadius: 12, height: 300 });
    } else if (type === "video") {
      Object.assign(base, { src: "", objectFit: "cover", height: 300 });
    } else if (type === "shape") {
      Object.assign(base, {
        shapeType: "rectangle",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 16,
        height: 200,
        width: 400,
      });
    }
    updateSlide((s) => ({ ...s, elements: [...s.elements, base] }));
    setSelectedElId(id);
  }, [activeSlide, pushHistory, updateSlide]);

  const deleteElement = useCallback((elId: string) => {
    pushHistory();
    updateSlide((s) => ({ ...s, elements: s.elements.filter((e) => e.id !== elId) }));
    setSelectedElId(null);
  }, [pushHistory, updateSlide]);

  const duplicateElement = useCallback((elId: string) => {
    pushHistory();
    const el = activeSlide?.elements.find((e) => e.id === elId);
    if (!el) return;
    const newEl = { ...el, id: uid(), x: el.x + 30, y: el.y + 30 };
    updateSlide((s) => ({ ...s, elements: [...s.elements, newEl] }));
    setSelectedElId(newEl.id);
  }, [activeSlide, pushHistory, updateSlide]);

  const moveLayer = useCallback((elId: string, dir: "up" | "down") => {
    pushHistory();
    updateSlide((s) => {
      const sorted = [...s.elements].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((e) => e.id === elId);
      if (dir === "up" && idx < sorted.length - 1) {
        const tmp = sorted[idx].zIndex;
        sorted[idx].zIndex = sorted[idx + 1].zIndex;
        sorted[idx + 1].zIndex = tmp;
      } else if (dir === "down" && idx > 0) {
        const tmp = sorted[idx].zIndex;
        sorted[idx].zIndex = sorted[idx - 1].zIndex;
        sorted[idx - 1].zIndex = tmp;
      }
      return { ...s, elements: sorted };
    });
  }, [pushHistory, updateSlide]);

  // ─── Drag & Drop ──────────────────────────────────────────────────
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest("[data-el-id]");
    if (target) {
      const elId = target.getAttribute("data-el-id")!;
      const el = activeSlide?.elements.find((el) => el.id === elId);
      if (el) {
        setSelectedElId(elId);
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setDragOffset({ x: coords.x - el.x, y: coords.y - el.y });
        setIsDragging(true);
        pushHistory();
      }
    } else {
      setSelectedElId(null);
    }
  }, [activeSlide, getCanvasCoords, pushHistory]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElId) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    updateElement(selectedElId, {
      x: Math.max(0, Math.min(CANVAS_W - 50, coords.x - dragOffset.x)),
      y: Math.max(0, Math.min(CANVAS_H - 50, coords.y - dragOffset.y)),
    });
  }, [isDragging, selectedElId, dragOffset, getCanvasCoords, updateElement]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // ─── Slide Management ─────────────────────────────────────────────
  const addSlide = useCallback(() => {
    pushHistory();
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      elements: [],
      background: "#111111",
      duration: 15,
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIdx(slides.length);
  }, [pushHistory, slides.length]);

  const deleteSlide = useCallback((idx: number) => {
    if (slides.length <= 1) return;
    pushHistory();
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setActiveSlideIdx(Math.max(0, idx - 1));
  }, [pushHistory, slides.length]);

  const applyTemplate = useCallback((template: typeof TEMPLATES[0]) => {
    pushHistory();
    updateSlide((s) => ({
      ...s,
      background: template.background,
      duration: template.duration,
      elements: template.elements.map((e) => ({ ...e, id: uid(), opacity: 1 })),
    }));
    setShowTemplates(false);
  }, [pushHistory, updateSlide]);

  // ─── Preview ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!showPreview) return;
    const slide = slides[previewSlideIdx];
    if (!slide) return;
    const timer = setTimeout(() => {
      setPreviewSlideIdx((prev) => (prev + 1) % slides.length);
    }, slide.duration * 1000);
    return () => clearTimeout(timer);
  }, [showPreview, previewSlideIdx, slides]);

  // ─── Save ─────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const templateData = {
      slides: slides.map((s) => ({
        elements: s.elements,
        background: s.background,
        backgroundImage: s.backgroundImage,
        duration: s.duration,
      })),
    };
    createContent.mutate({
      title,
      contentType: "html_slide",
      duration: slides.reduce((a, s) => a + s.duration, 0),
      templateData,
      targetScreenTypes,
    });
  }, [title, slides, targetScreenTypes, createContent]);

  // ─── Render ───────────────────────────────────────────────────────
  const scale = 0.55; // Canvas display scale

  const renderElement = (el: SlideElement, isPreview = false) => {
    const style: React.CSSProperties = {
      position: "absolute",
      left: el.x,
      top: el.y,
      width: el.width,
      height: el.height,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      zIndex: el.zIndex,
      opacity: el.opacity ?? 1,
      cursor: isPreview ? "default" : "move",
    };

    if (el.type === "text") {
      return (
        <div
          key={el.id}
          data-el-id={el.id}
          style={{
            ...style,
            fontSize: el.fontSize,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight as any,
            fontStyle: el.fontStyle,
            textAlign: el.textAlign,
            color: el.color,
            lineHeight: el.lineHeight,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            userSelect: isPreview ? "none" : "auto",
          }}
          className={!isPreview && selectedElId === el.id ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent" : ""}
        >
          {el.text}
        </div>
      );
    }

    if (el.type === "image") {
      return (
        <div
          key={el.id}
          data-el-id={el.id}
          style={style}
          className={`overflow-hidden ${!isPreview && selectedElId === el.id ? "ring-2 ring-blue-400" : ""}`}
        >
          {el.src ? (
            <img src={el.src} alt="" className="w-full h-full" style={{ objectFit: el.objectFit, borderRadius: el.borderRadius }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-xl border-2 border-dashed border-white/20">
              <Image className="w-10 h-10 text-white/30" />
            </div>
          )}
        </div>
      );
    }

    if (el.type === "video") {
      return (
        <div
          key={el.id}
          data-el-id={el.id}
          style={style}
          className={`overflow-hidden ${!isPreview && selectedElId === el.id ? "ring-2 ring-blue-400" : ""}`}
        >
          {el.src ? (
            <video src={el.src} autoPlay muted loop className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-xl border-2 border-dashed border-white/20">
              <Video className="w-10 h-10 text-white/30" />
            </div>
          )}
        </div>
      );
    }

    if (el.type === "shape") {
      return (
        <div
          key={el.id}
          data-el-id={el.id}
          style={{
            ...style,
            backgroundColor: el.backgroundColor,
            borderRadius: el.shapeType === "circle" ? "50%" : el.borderRadius,
            border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || "transparent"}` : undefined,
          }}
          className={!isPreview && selectedElId === el.id ? "ring-2 ring-blue-400" : ""}
        />
      );
    }

    return null;
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* ─── Top Bar ─── */}
      <div className="h-14 border-b border-white/[0.06] flex items-center px-4 gap-4 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-white/50 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-1" /> Terug
        </Button>
        <div className="h-6 w-px bg-white/10" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent border-none text-lg font-light w-64 focus-visible:ring-0 px-0"
          placeholder="Content titel..."
        />
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIdx <= 0} className="text-white/40 hover:text-white">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIdx >= history.length - 1} className="text-white/40 hover:text-white">
            <Redo2 className="w-4 h-4" />
          </Button>
          <div className="h-6 w-px bg-white/10" />
          <Button variant="ghost" size="sm" onClick={() => { setPreviewSlideIdx(0); setShowPreview(true); }} className="text-white/50 hover:text-white">
            <Eye className="w-4 h-4 mr-1" /> Preview
          </Button>
          <Button size="sm" onClick={() => setShowSaveDialog(true)} className="bg-[#627653] text-white hover:bg-[#4a5a3f]">
            <Save className="w-4 h-4 mr-1" /> Opslaan
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left Panel: Slides ─── */}
        <div className="w-48 border-r border-white/[0.06] p-3 flex flex-col gap-2 overflow-y-auto shrink-0">
          <div className="text-[10px] text-[#666] tracking-[2px] uppercase font-medium mb-1">Slides</div>
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              onClick={() => { setActiveSlideIdx(idx); setSelectedElId(null); }}
              className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                idx === activeSlideIdx ? "border-[#627653]" : "border-white/[0.06] hover:border-white/20"
              }`}
            >
              <div
                className="w-full aspect-video"
                style={{ background: slide.background, transform: "scale(1)", transformOrigin: "top left" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] text-white/40">{idx + 1}</span>
                </div>
              </div>
              {slides.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-600/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-0.5 text-[9px] text-white/50">
                {slide.duration}s
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addSlide} className="text-white/30 hover:text-white border border-dashed border-white/10 hover:border-white/20">
            <Plus className="w-3 h-3 mr-1" /> Slide
          </Button>
        </div>

        {/* ─── Center: Canvas ─── */}
        <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] p-8 overflow-hidden">
          <div
            ref={canvasRef}
            className="relative shadow-2xl"
            style={{
              width: CANVAS_W * scale,
              height: CANVAS_H * scale,
              background: activeSlide?.background || "#111",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: CANVAS_W, height: CANVAS_H, position: "relative" }}>
              {activeSlide?.elements.map((el) => renderElement(el))}
            </div>
          </div>
        </div>

        {/* ─── Right Panel: Properties ─── */}
        <div className="w-72 border-l border-white/[0.06] overflow-y-auto shrink-0">
          <Tabs defaultValue="elements" className="h-full flex flex-col">
            <TabsList className="bg-transparent border-b border-white/[0.06] rounded-none px-3 shrink-0">
              <TabsTrigger value="elements" className="text-xs">Elementen</TabsTrigger>
              <TabsTrigger value="properties" className="text-xs">Eigenschappen</TabsTrigger>
              <TabsTrigger value="slide" className="text-xs">Slide</TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="flex-1 p-3 space-y-3 overflow-y-auto">
              <div className="text-[10px] text-[#666] tracking-[2px] uppercase font-medium">Toevoegen</div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => addElement("text")} className="border-white/10 bg-transparent text-white/70 hover:text-white h-16 flex-col gap-1">
                  <Type className="w-5 h-5" /> <span className="text-[10px]">Tekst</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => addElement("image")} className="border-white/10 bg-transparent text-white/70 hover:text-white h-16 flex-col gap-1">
                  <Image className="w-5 h-5" /> <span className="text-[10px]">Afbeelding</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => addElement("video")} className="border-white/10 bg-transparent text-white/70 hover:text-white h-16 flex-col gap-1">
                  <Video className="w-5 h-5" /> <span className="text-[10px]">Video</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => addElement("shape")} className="border-white/10 bg-transparent text-white/70 hover:text-white h-16 flex-col gap-1">
                  <LayoutGrid className="w-5 h-5" /> <span className="text-[10px]">Vorm</span>
                </Button>
              </div>

              <div className="h-px bg-white/[0.06]" />
              <div className="text-[10px] text-[#666] tracking-[2px] uppercase font-medium">Templates</div>
              <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="w-full border-white/10 bg-transparent text-white/70 hover:text-white">
                <Sparkles className="w-4 h-4 mr-2" /> Template kiezen
              </Button>

              <div className="h-px bg-white/[0.06]" />
              <div className="text-[10px] text-[#666] tracking-[2px] uppercase font-medium">Lagen</div>
              <div className="space-y-1">
                {[...activeSlide?.elements || []].sort((a, b) => b.zIndex - a.zIndex).map((el) => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElId(el.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs ${
                      selectedElId === el.id ? "bg-[#627653]/30 text-white" : "text-white/50 hover:bg-white/[0.03]"
                    }`}
                  >
                    {el.type === "text" ? <Type className="w-3 h-3" /> : el.type === "image" ? <Image className="w-3 h-3" /> : el.type === "video" ? <Video className="w-3 h-3" /> : <LayoutGrid className="w-3 h-3" />}
                    <span className="truncate flex-1">{el.type === "text" ? (el.text?.slice(0, 20) || "Tekst") : el.type}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                      <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id, "up"); }} className="p-0.5 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id, "down"); }} className="p-0.5 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="properties" className="flex-1 p-3 space-y-4 overflow-y-auto">
              {selectedEl ? (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-white/10">{selectedEl.type}</Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => duplicateElement(selectedEl.id)} className="h-7 w-7 p-0 text-white/40 hover:text-white">
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteElement(selectedEl.id)} className="h-7 w-7 p-0 text-red-400 hover:text-red-300">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Position & Size */}
                  <div>
                    <div className="text-[10px] text-[#666] tracking-[2px] uppercase font-medium mb-2">Positie & Grootte</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-[#555]">X</label>
                        <Input type="number" value={Math.round(selectedEl.x)} onChange={(e) => updateElement(selectedEl.id, { x: +e.target.value })} className="h-7 text-xs bg-white/[0.03] border-white/[0.06]" />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#555]">Y</label>
                        <Input type="number" value={Math.round(selectedEl.y)} onChange={(e) => updateElement(selectedEl.id, { y: +e.target.value })} className="h-7 text-xs bg-white/[0.03] border-white/[0.06]" />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#555]">Breedte</label>
                        <Input type="number" value={Math.round(selectedEl.width)} onChange={(e) => updateElement(selectedEl.id, { width: +e.target.value })} className="h-7 text-xs bg-white/[0.03] border-white/[0.06]" />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#555]">Hoogte</label>
                        <Input type="number" value={Math.round(selectedEl.height)} onChange={(e) => updateElement(selectedEl.id, { height: +e.target.value })} className="h-7 text-xs bg-white/[0.03] border-white/[0.06]" />
                      </div>
                    </div>
                  </div>

                  {/* Text Properties */}
                  {selectedEl.type === "text" && (
                    <>
                      <div>
                        <div className="text-[10px] text-[#666] tracking-[2px] uppercase font-medium mb-2">Tekst</div>
                        <textarea
                          value={selectedEl.text || ""}
                          onChange={(e) => updateElement(selectedEl.id, { text: e.target.value })}
                          className="w-full h-24 bg-white/[0.03] border border-white/[0.06] rounded p-2 text-sm resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-[#555]">Font</label>
                          <Select value={selectedEl.fontFamily} onValueChange={(v) => updateElement(selectedEl.id, { fontFamily: v })}>
                            <SelectTrigger className="h-7 text-xs bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[9px] text-[#555]">Grootte</label>
                          <Input type="number" value={selectedEl.fontSize} onChange={(e) => updateElement(selectedEl.id, { fontSize: +e.target.value })} className="h-7 text-xs bg-white/[0.03] border-white/[0.06]" />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {(["300", "400", "600", "700"] as const).map((w) => (
                          <Button
                            key={w}
                            variant="ghost"
                            size="sm"
                            onClick={() => updateElement(selectedEl.id, { fontWeight: w })}
                            className={`h-7 px-2 text-xs ${selectedEl.fontWeight === w ? "bg-white/10 text-white" : "text-white/40"}`}
                          >
                            {w === "300" ? "Light" : w === "400" ? "Regular" : w === "600" ? "Semi" : "Bold"}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        {(["left", "center", "right"] as const).map((a) => (
                          <Button
                            key={a}
                            variant="ghost"
                            size="sm"
                            onClick={() => updateElement(selectedEl.id, { textAlign: a })}
                            className={`h-7 w-7 p-0 ${selectedEl.textAlign === a ? "bg-white/10 text-white" : "text-white/40"}`}
                          >
                            {a === "left" ? <AlignLeft className="w-3 h-3" /> : a === "center" ? <AlignCenter className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
                          </Button>
                        ))}
                      </div>
                      <div>
                        <label className="text-[9px] text-[#555]">Kleur</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => updateElement(selectedEl.id, { color: c })}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${selectedEl.color === c ? "border-blue-400 scale-110" : "border-transparent"}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <Input
                          value={selectedEl.color || "#ffffff"}
                          onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                          className="h-7 text-xs bg-white/[0.03] border-white/[0.06] mt-2"
                          placeholder="#ffffff"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#555]">Regelhoogte</label>
                        <Slider
                          value={[selectedEl.lineHeight || 1.4]}
                          onValueChange={([v]) => updateElement(selectedEl.id, { lineHeight: v })}
                          min={0.8}
                          max={3}
                          step={0.1}
                          className="mt-2"
                        />
                        <span className="text-[10px] text-[#555]">{selectedEl.lineHeight?.toFixed(1)}</span>
                      </div>
                    </>
                  )}

                  {/* Image Properties */}
                  {selectedEl.type === "image" && (
                    <div>
                      <div className="text-[10px] text-[#666] tracking-[2px] uppercase font-medium mb-2">Afbeelding</div>
                      <Input
                        value={selectedEl.src || ""}
                        onChange={(e) => updateElement(selectedEl.id, { src: e.target.value })}
                        placeholder="https://... of upload"
                        className="h-7 text-xs bg-white/[0.03] border-white/[0.06]"
                      />
                      <div className="grid grid-cols-3 gap-1 mt-2">
                        {(["cover", "contain", "fill"] as const).map((f) => (
                          <Button
                            key={f}
                            variant="ghost"
                            size="sm"
                            onClick={() => updateElement(selectedEl.id, { objectFit: f })}
                            className={`h-7 text-[10px] ${selectedEl.objectFit === f ? "bg-white/10 text-white" : "text-white/40"}`}
                          >
                            {f}
                          </Button>
                        ))}
                      </div>
                      <div className="mt-2">
                        <label className="text-[9px] text-[#555]">Afronding</label>
                        <Slider
                          value={[selectedEl.borderRadius || 0]}
                          onValueChange={([v]) => updateElement(selectedEl.id, { borderRadius: v })}
                          min={0}
                          max={100}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Video Properties */}
                  {selectedEl.type === "video" && (
                    <div>
                      <div className="text-[10px] text-[#666] tracking-[2px] uppercase font-medium mb-2">Video</div>
                      <Input
                        value={selectedEl.src || ""}
                        onChange={(e) => updateElement(selectedEl.id, { src: e.target.value })}
                        placeholder="https://... video URL"
                        className="h-7 text-xs bg-white/[0.03] border-white/[0.06]"
                      />
                    </div>
                  )}

                  {/* Shape Properties */}
                  {selectedEl.type === "shape" && (
                    <div>
                      <div className="text-[10px] text-[#666] tracking-[2px] uppercase font-medium mb-2">Vorm</div>
                      <div className="grid grid-cols-3 gap-1">
                        {(["rectangle", "circle"] as const).map((s) => (
                          <Button
                            key={s}
                            variant="ghost"
                            size="sm"
                            onClick={() => updateElement(selectedEl.id, { shapeType: s })}
                            className={`h-7 text-[10px] ${selectedEl.shapeType === s ? "bg-white/10 text-white" : "text-white/40"}`}
                          >
                            {s === "rectangle" ? "Rechthoek" : "Cirkel"}
                          </Button>
                        ))}
                      </div>
                      <div className="mt-2">
                        <label className="text-[9px] text-[#555]">Achtergrondkleur</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {PRESET_COLORS.slice(0, 10).map((c) => (
                            <button
                              key={c}
                              onClick={() => updateElement(selectedEl.id, { backgroundColor: c })}
                              className={`w-5 h-5 rounded-full border-2 ${selectedEl.backgroundColor === c ? "border-blue-400" : "border-transparent"}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <Input
                          value={selectedEl.backgroundColor || ""}
                          onChange={(e) => updateElement(selectedEl.id, { backgroundColor: e.target.value })}
                          className="h-7 text-xs bg-white/[0.03] border-white/[0.06] mt-1"
                        />
                      </div>
                      <div className="mt-2">
                        <label className="text-[9px] text-[#555]">Afronding</label>
                        <Slider
                          value={[selectedEl.borderRadius || 0]}
                          onValueChange={([v]) => updateElement(selectedEl.id, { borderRadius: v })}
                          min={0}
                          max={100}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Opacity */}
                  <div>
                    <label className="text-[9px] text-[#555]">Transparantie</label>
                    <Slider
                      value={[(selectedEl.opacity ?? 1) * 100]}
                      onValueChange={([v]) => updateElement(selectedEl.id, { opacity: v / 100 })}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-1"
                    />
                    <span className="text-[10px] text-[#555]">{Math.round((selectedEl.opacity ?? 1) * 100)}%</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-white/20 py-12 text-sm">
                  Selecteer een element om te bewerken
                </div>
              )}
            </TabsContent>

            <TabsContent value="slide" className="flex-1 p-3 space-y-4 overflow-y-auto">
              <div>
                <div className="text-[10px] text-[#666] tracking-[2px] uppercase font-medium mb-2">Achtergrond</div>
                <div className="flex flex-wrap gap-1">
                  {[
                    "linear-gradient(135deg, #627653, #3a4d2a)",
                    "linear-gradient(135deg, #1a2a0f, #0a1a05)",
                    "linear-gradient(135deg, #5a4a3a, #3a2a1a)",
                    "linear-gradient(135deg, #8b6f47, #5a4a2a)",
                    "linear-gradient(135deg, #d4a853, #a07830)",
                    "#111111",
                    "#f5f0e8",
                    "#ffffff",
                    "#2d3a1f",
                    "#0a0a0a",
                  ].map((bg) => (
                    <button
                      key={bg}
                      onClick={() => updateSlide((s) => ({ ...s, background: bg }))}
                      className={`w-8 h-8 rounded-lg border-2 ${activeSlide?.background === bg ? "border-blue-400" : "border-white/10"}`}
                      style={{ background: bg }}
                    />
                  ))}
                </div>
                <Input
                  value={activeSlide?.background || ""}
                  onChange={(e) => updateSlide((s) => ({ ...s, background: e.target.value }))}
                  placeholder="CSS background..."
                  className="h-7 text-xs bg-white/[0.03] border-white/[0.06] mt-2"
                />
              </div>
              <div>
                <div className="text-[10px] text-[#666] tracking-[2px] uppercase font-medium mb-2">Duur (seconden)</div>
                <Input
                  type="number"
                  value={activeSlide?.duration || 15}
                  onChange={(e) => updateSlide((s) => ({ ...s, duration: +e.target.value }))}
                  className="h-7 text-xs bg-white/[0.03] border-white/[0.06]"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ─── Template Picker Dialog ─── */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-light text-lg">Template kiezen</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            {TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => applyTemplate(t)}
                className="group relative rounded-xl overflow-hidden border-2 border-white/[0.06] hover:border-[#627653] transition-all"
              >
                <div className="aspect-video" style={{ background: t.background }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-white/60 group-hover:text-white transition-colors">{t.name}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Preview Dialog ─── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-black border-none sm:max-w-[90vw] p-0">
          <div className="relative" style={{ aspectRatio: "16/9" }}>
            {slides[previewSlideIdx] && (
              <div
                className="w-full h-full relative"
                style={{ background: slides[previewSlideIdx].background }}
              >
                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                  {slides[previewSlideIdx].elements.map((el) => {
                    const scaleX = 1; // Preview is full-size ratio
                    return renderElement(el, true);
                  })}
                </div>
              </div>
            )}
            {slides.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: i === previewSlideIdx ? 32 : 8,
                      background: i === previewSlideIdx ? "#627653" : "rgba(255,255,255,0.2)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Save Dialog ─── */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-md">
          <DialogHeader><DialogTitle className="font-light text-lg">Content opslaan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Titel</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Schermtypes</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["reception", "kitchen", "general", "gym", "wayfinding"].map((t) => (
                  <Badge
                    key={t}
                    variant={targetScreenTypes.includes(t) ? "default" : "outline"}
                    className={`cursor-pointer ${targetScreenTypes.includes(t) ? "bg-[#627653]" : "border-white/10"}`}
                    onClick={() => setTargetScreenTypes((prev) =>
                      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                    )}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-xs text-white/30">
              {slides.length} slide{slides.length > 1 ? "s" : ""} · {slides.reduce((a, s) => a + s.duration, 0)}s totaal
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={handleSave}
              disabled={createContent.isPending || !title}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createContent.isPending ? "Opslaan..." : "Opslaan als content"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
