import { useState } from "react";
import {
  Search,
  MapPin,
  Navigation,
  QrCode,
  ChevronRight,
  Building2,
  Users,
  DoorOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Location {
  id: string;
  name: string;
  type: "person" | "company" | "room";
  floor: number;
  room?: string;
  location?: string;
}

interface RouteStep {
  step: number;
  instruction: string;
  distance: string;
}

const mockLocations: Location[] = [
  { id: "1", name: "John Doe", type: "person", floor: 2, room: "302" },
  { id: "2", name: "Jane Smith", type: "person", floor: 1, room: "105" },
  {
    id: "3",
    name: "Acme Corp",
    type: "company",
    floor: 2,
    location: "2nd Floor West Wing",
  },
  { id: "4", name: "Meeting Room A", type: "room", floor: 1, room: "101" },
  { id: "5", name: "Cafeteria", type: "room", floor: 0, room: "Ground Floor" },
];

const mockRoute: RouteStep[] = [
  { step: 1, instruction: "Start from main lobby", distance: "0 m" },
  {
    step: 2,
    instruction: "Walk straight ahead towards elevators",
    distance: "15 m",
  },
  { step: 3, instruction: "Take elevator to 2nd floor", distance: "Up 1 floor" },
  {
    step: 4,
    instruction: "Exit elevator and turn right",
    distance: "5 m",
  },
  {
    step: 5,
    instruction: "Room 302 is on your left",
    distance: "10 m",
  },
];

interface SearchResult extends Location {
  description: string;
}

export default function WayfindingDisplay() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<SearchResult | null>(
    null
  );
  const [currentFloor, setCurrentFloor] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showQrScanner, setShowQrScanner] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const results = mockLocations
      .filter((loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((loc) => ({
        ...loc,
        description:
          loc.type === "person"
            ? `${loc.name} - Room ${loc.room}, Floor ${loc.floor}`
            : loc.type === "company"
            ? `${loc.name} - ${loc.location}`
            : `${loc.name} - Room ${loc.room}`,
      }));
    setSearchResults(results);
  };

  const handleSelectDestination = (result: SearchResult) => {
    setSelectedDestination(result);
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <div className="w-screen h-screen bg-[#111] flex flex-col overflow-hidden">
      {/* Header with Company Logo / Title */}
      <div className="flex-shrink-0 bg-gradient-to-b from-[#1a1a1a] to-[#111] p-6 text-center">
        <h1 className="text-[32px] font-light tracking-[-1px] text-white mb-2">
          <span className="font-semibold">Sky</span>net
        </h1>
        <p className="text-[11px] text-[#888] tracking-[2px] uppercase">
          Find Your Way
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {!selectedDestination ? (
          <>
            {/* Search Section */}
            <div className="flex-shrink-0 p-6 space-y-4">
              <div className="text-center mb-6">
                <p className="text-[14px] text-[#888] mb-4">
                  Search for a person, company, or room
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#627653]" />
                <Input
                  type="text"
                  placeholder="Type a name, company, or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  className="pl-12 h-14 bg-white/[0.05] border-2 border-white/[0.1] rounded-lg text-[16px] placeholder:text-[#888]"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSearch}
                  className="flex-1 h-12 bg-[#627653] text-white text-[14px] font-semibold hover:bg-[#4a5a3f] rounded-lg"
                >
                  Search
                </Button>
                <Button
                  onClick={() => setShowQrScanner(!showQrScanner)}
                  className="h-12 px-6 bg-white/[0.05] text-white hover:bg-white/[0.1] border border-white/[0.1] rounded-lg"
                >
                  <QrCode className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* QR Scanner Placeholder */}
            {showQrScanner && (
              <div className="flex-shrink-0 px-6 pb-4">
                <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-lg text-center">
                  <QrCode className="w-12 h-12 text-[#627653] mx-auto mb-3" />
                  <p className="text-[11px] text-[#888]">
                    Position your device to scan QR code
                  </p>
                  <p className="text-[9px] text-[#666] mt-2">
                    Visitor badge or directional sign QR codes
                  </p>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="flex-1 px-6 pb-6">
                <p className="text-[10px] text-[#888] uppercase tracking-[2px] font-semibold mb-3">
                  Results ({searchResults.length})
                </p>
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectDestination(result)}
                      className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg text-left transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-[14px] font-semibold text-white mb-1 flex items-center gap-2">
                            {result.type === "person" && (
                              <Users className="w-4 h-4 text-[#627653]" />
                            )}
                            {result.type === "company" && (
                              <Building2 className="w-4 h-4 text-[#627653]" />
                            )}
                            {result.type === "room" && (
                              <DoorOpen className="w-4 h-4 text-[#627653]" />
                            )}
                            {result.name}
                          </p>
                          <p className="text-[11px] text-[#888]">
                            {result.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#888] mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Access Section */}
            {searchResults.length === 0 && !showQrScanner && (
              <div className="flex-1 px-6 pb-6">
                <p className="text-[10px] text-[#888] uppercase tracking-[2px] font-semibold mb-4">
                  Popular Destinations
                </p>
                <div className="space-y-2">
                  {[
                    {
                      name: "Reception",
                      description: "Ground Floor - Main Entrance",
                    },
                    { name: "Cafeteria", description: "Ground Floor" },
                    { name: "Restrooms", description: "Every Floor" },
                    {
                      name: "Meeting Rooms",
                      description: "2nd Floor - Central Wing",
                    },
                  ].map((dest, idx) => (
                    <button
                      key={idx}
                      className="w-full p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg text-left hover:bg-white/[0.05] transition-all"
                    >
                      <p className="text-[12px] font-semibold text-white mb-1">
                        {dest.name}
                      </p>
                      <p className="text-[10px] text-[#888]">
                        {dest.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Destination Header */}
            <div className="flex-shrink-0 p-6 bg-gradient-to-b from-[#1a1a1a] to-[#111] border-b border-white/[0.06] space-y-3">
              <button
                onClick={() => setSelectedDestination(null)}
                className="text-[10px] font-semibold tracking-[2px] uppercase text-[#627653] hover:text-white transition-all mb-3"
              >
                Back to Search
              </button>
              <h2 className="text-[24px] font-light text-white flex items-center gap-3">
                {selectedDestination.type === "person" && (
                  <Users className="w-6 h-6 text-[#627653]" />
                )}
                {selectedDestination.type === "company" && (
                  <Building2 className="w-6 h-6 text-[#627653]" />
                )}
                {selectedDestination.type === "room" && (
                  <DoorOpen className="w-6 h-6 text-[#627653]" />
                )}
                {selectedDestination.name}
              </h2>
              <p className="text-[11px] text-[#888]">
                {selectedDestination.description}
              </p>
            </div>

            {/* Current Floor Selector */}
            <div className="flex-shrink-0 px-6 pt-4 pb-2">
              <p className="text-[9px] text-[#888] uppercase tracking-[2px] font-semibold mb-2">
                Current Floor
              </p>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setCurrentFloor(floor)}
                    className={`h-12 px-4 rounded-lg font-semibold transition-all ${
                      currentFloor === floor
                        ? "bg-[#627653] text-white"
                        : "bg-white/[0.05] text-[#888] hover:bg-white/[0.1]"
                    }`}
                  >
                    {floor === 0 ? "G" : floor}
                  </button>
                ))}
              </div>
            </div>

            {/* Route Steps */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-3">
                {mockRoute.map((step) => (
                  <div
                    key={step.step}
                    className="flex gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#627653] flex items-center justify-center">
                      <span className="text-white font-semibold text-[12px]">
                        {step.step}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white mb-1">
                        {step.instruction}
                      </p>
                      <p className="text-[10px] text-[#888]">
                        {step.distance}
                      </p>
                    </div>
                    <Navigation className="w-5 h-5 text-[#627653] flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 p-6 gap-3 flex">
              <Button className="flex-1 h-12 bg-[#627653] text-white text-[14px] font-semibold hover:bg-[#4a5a3f]">
                <MapPin className="w-5 h-5 mr-2" />
                Start Navigation
              </Button>
              <Button
                onClick={() => setSelectedDestination(null)}
                className="flex-1 h-12 bg-white/[0.05] text-white text-[14px] font-semibold hover:bg-white/[0.1]"
              >
                New Search
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
