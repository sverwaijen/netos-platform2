import { useState, useMemo } from "react";
<<<<<<< HEAD
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
=======
import { toast } from "sonner";
>>>>>>> origin/claude/features-61-62-68
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
<<<<<<< HEAD
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Clock, MapPin, Users, ShoppingCart, Check, Calendar as CalendarIcon } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  room: string;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  icon: string;
}

interface Order {
  id: string;
  meetingId: string;
  items: { itemId: string; quantity: number; name: string; price: number }[];
  totalPrice: number;
  status: "pending" | "confirmed" | "delivered";
  specialRequests?: string;
}

export default function CateringBooking() {
  const { isAuthenticated } = useAuth();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
=======
import { ShoppingCart, MapPin, Users, Check, Calendar as CalendarIcon } from "lucide-react";

export default function CateringBooking() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
>>>>>>> origin/claude/features-61-62-68
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [specialRequests, setSpecialRequests] = useState("");
  const [displayMode, setDisplayMode] = useState<"orders" | "kitchen">("orders");

<<<<<<< HEAD
  // Mock meetings for the current user
  const mockMeetings: Meeting[] = [
    {
      id: "m1",
      title: "Q2 Planning Session",
      date: "2026-04-20",
      time: "14:00",
      location: "Amsterdam",
      attendees: 8,
      room: "Conference Room A",
    },
    {
      id: "m2",
      title: "Team Standup",
      date: "2026-04-21",
      time: "10:00",
      location: "Amsterdam",
      attendees: 6,
      room: "Meeting Room 3",
    },
    {
      id: "m3",
      title: "Client Workshop",
      date: "2026-04-25",
      time: "09:00",
      location: "Rotterdam",
      attendees: 12,
      room: "Main Hall",
    },
  ];

  // Menu items organized by category
  const menuItems: MenuItem[] = [
    {
      id: "1",
      name: "Coffee & Tea Service",
      category: "Beverages",
      price: 25,
      description: "Selection of premium coffee, tea, and espresso drinks",
      icon: "☕",
    },
    {
      id: "2",
      name: "Fresh Pastries",
      category: "Breakfast",
      price: 35,
      description: "Croissants, muffins, and fresh baked goods",
      icon: "🥐",
    },
    {
      id: "3",
      name: "Sandwich Platter",
      category: "Lunch",
      price: 60,
      description: "Assorted sandwiches and wraps (minimum 6 servings)",
      icon: "🥪",
    },
    {
      id: "4",
      name: "Salad Selection",
      category: "Lunch",
      price: 45,
      description: "Mixed salads with dressing (minimum 6 servings)",
      icon: "🥗",
    },
    {
      id: "5",
      name: "Fruit Platter",
      category: "Snacks",
      price: 40,
      description: "Fresh seasonal fruits and berries",
      icon: "🍓",
    },
    {
      id: "6",
      name: "Cheese & Charcuterie",
      category: "Snacks",
      price: 55,
      description: "Premium selection of cheeses and cured meats",
      icon: "🧀",
    },
    {
      id: "7",
      name: "Dessert Selection",
      category: "Desserts",
      price: 50,
      description: "Assorted pastries and sweet treats",
      icon: "🍰",
    },
    {
      id: "8",
      name: "Vegan Lunch Box",
      category: "Dietary",
      price: 50,
      description: "Complete vegan meal for one person",
      icon: "🥬",
    },
  ];

  const mockOrders: Order[] = [
    {
      id: "o1",
      meetingId: "m1",
      items: [
        { itemId: "1", quantity: 1, name: "Coffee & Tea Service", price: 25 },
        { itemId: "3", quantity: 1, name: "Sandwich Platter", price: 60 },
      ],
      totalPrice: 85,
      status: "confirmed",
      specialRequests: "No sugar in coffee, extra napkins",
    },
    {
      id: "o2",
      meetingId: "m2",
      items: [
        { itemId: "2", quantity: 1, name: "Fresh Pastries", price: 35 },
        { itemId: "5", quantity: 1, name: "Fruit Platter", price: 40 },
      ],
      totalPrice: 75,
      status: "pending",
    },
  ];

  const groupedMenu = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    menuItems.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
=======
  const mockMeetings = [
    { id: "m1", title: "Q2 Planning Session", date: "2026-04-20", time: "14:00", location: "Amsterdam", attendees: 8, room: "Conference Room A" },
    { id: "m2", title: "Team Standup", date: "2026-04-21", time: "10:00", location: "Amsterdam", attendees: 6, room: "Meeting Room 3" },
    { id: "m3", title: "Client Workshop", date: "2026-04-25", time: "09:00", location: "Rotterdam", attendees: 12, room: "Main Hall" },
  ];

  const menuItems = [
    { id: "1", name: "Coffee & Tea Service", category: "Beverages", price: 25, description: "Premium coffee and espresso" },
    { id: "2", name: "Fresh Pastries", category: "Breakfast", price: 35, description: "Croissants and baked goods" },
    { id: "3", name: "Sandwich Platter", category: "Lunch", price: 60, description: "Assorted sandwiches" },
    { id: "4", name: "Salad Selection", category: "Lunch", price: 45, description: "Mixed salads" },
    { id: "5", name: "Fruit Platter", category: "Snacks", price: 40, description: "Fresh seasonal fruits" },
    { id: "6", name: "Cheese & Charcuterie", category: "Snacks", price: 55, description: "Premium selection" },
    { id: "7", name: "Dessert Selection", category: "Desserts", price: 50, description: "Assorted pastries" },
    { id: "8", name: "Vegan Lunch Box", category: "Dietary", price: 50, description: "Complete vegan meal" },
  ];

  const mockOrders = [
    { id: "o1", meetingId: "m1", items: [{ itemId: "1", quantity: 1, name: "Coffee & Tea Service", price: 25 }, { itemId: "3", quantity: 1, name: "Sandwich Platter", price: 60 }], totalPrice: 85, status: "confirmed" },
    { id: "o2", meetingId: "m2", items: [{ itemId: "2", quantity: 1, name: "Fresh Pastries", price: 35 }, { itemId: "5", quantity: 1, name: "Fruit Platter", price: 40 }], totalPrice: 75, status: "pending" },
  ];

  const groupedMenu = useMemo(() => {
    const grouped: any = {};
    menuItems.forEach((item) => {
      if (!grouped[item.category]) grouped[item.category] = [];
>>>>>>> origin/claude/features-61-62-68
      grouped[item.category].push(item);
    });
    return grouped;
  }, []);

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      selectedItems.delete(itemId);
    } else {
      selectedItems.set(itemId, quantity);
    }
    setSelectedItems(new Map(selectedItems));
  };

  const getTotalPrice = () => {
    let total = 0;
    selectedItems.forEach((quantity, itemId) => {
      const item = menuItems.find((m) => m.id === itemId);
<<<<<<< HEAD
      if (item) {
        total += item.price * quantity;
      }
=======
      if (item) total += item.price * quantity;
>>>>>>> origin/claude/features-61-62-68
    });
    return total;
  };

  const handleCreateOrder = () => {
    if (!selectedMeeting || selectedItems.size === 0) {
      toast.error("Please select a meeting and at least one item");
      return;
    }
<<<<<<< HEAD

=======
>>>>>>> origin/claude/features-61-62-68
    const totalPrice = getTotalPrice();
    toast.success(`Order created: ${selectedItems.size} item(s) for ${totalPrice} credits`);
    setShowOrderForm(false);
    setSelectedMeeting(null);
    setSelectedItems(new Map());
    setSpecialRequests("");
  };

<<<<<<< HEAD
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-500";
      case "confirmed":
        return "text-[#627653]";
      default:
        return "text-yellow-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return "✓";
      case "confirmed":
        return "●";
      default:
        return "⧗";
    }
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Operations</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Catering & <strong className="font-semibold">Meals.</strong>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowOrderForm(true)}
            className="bg-[#627653] hover:bg-[#627653]/90 text-white text-xs font-semibold tracking-[1px]"
          >
            <ShoppingCart className="w-4 h-4 mr-1" /> New Order
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 border-b border-white/[0.06]">
        <button
          onClick={() => setDisplayMode("orders")}
          className={`pb-3 px-2 text-xs font-semibold tracking-[1px] uppercase border-b-2 transition-colors ${
            displayMode === "orders"
              ? "border-[#627653] text-[#627653]"
              : "border-transparent text-[#888] hover:text-[#999]"
          }`}
        >
          My Orders
        </button>
        <button
          onClick={() => setDisplayMode("kitchen")}
          className={`pb-3 px-2 text-xs font-semibold tracking-[1px] uppercase border-b-2 transition-colors ${
            displayMode === "kitchen"
              ? "border-[#627653] text-[#627653]"
              : "border-transparent text-[#888] hover:text-[#999]"
          }`}
        >
          Kitchen Display
        </button>
      </div>

      {/* My Orders View */}
=======
  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Operations</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">Catering & <strong className="font-semibold">Meals.</strong></h1>
        </div>
        <Button onClick={() => setShowOrderForm(true)} className="bg-[#627653] hover:bg-[#627653]/90 text-white text-xs font-semibold">
          <ShoppingCart className="w-4 h-4 mr-1" /> New Order
        </Button>
      </div>

      <div className="flex gap-2 border-b border-white/[0.06]">
        <button onClick={() => setDisplayMode("orders")} className={`pb-3 px-2 text-xs font-semibold tracking-[1px] uppercase border-b-2 ${displayMode === "orders" ? "border-[#627653] text-[#627653]" : "border-transparent text-[#888]"}`}>My Orders</button>
        <button onClick={() => setDisplayMode("kitchen")} className={`pb-3 px-2 text-xs font-semibold tracking-[1px] uppercase border-b-2 ${displayMode === "kitchen" ? "border-[#627653] text-[#627653]" : "border-transparent text-[#888]"}`}>Kitchen Display</button>
      </div>

>>>>>>> origin/claude/features-61-62-68
      {displayMode === "orders" && (
        <div className="space-y-4">
          <h2 className="text-[13px] font-semibold tracking-[2px] uppercase text-[#888]">Order Status</h2>
          {mockOrders.length === 0 ? (
<<<<<<< HEAD
            <Card className="bg-[#111] border-white/[0.06]">
              <CardContent className="p-8 text-center text-[#666]">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No catering orders yet</p>
              </CardContent>
            </Card>
=======
            <Card className="bg-[#111] border-white/[0.06]"><CardContent className="p-8 text-center text-[#666]"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="text-sm">No catering orders yet</p></CardContent></Card>
>>>>>>> origin/claude/features-61-62-68
          ) : (
            mockOrders.map((order) => (
              <Card key={order.id} className="bg-[#111] border-white/[0.06]">
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
<<<<<<< HEAD
                        <span className={`text-lg ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold capitalize">{order.status}</p>
                          <p className="text-xs text-[#888]">
                            {mockMeetings.find((m) => m.id === order.meetingId)?.title}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-[#b8a472]">{order.totalPrice} credits</p>
                    </div>

                    <div className="space-y-1 text-xs text-[#888]">
                      {order.items.map((item) => (
                        <div key={item.itemId} className="flex justify-between">
                          <span>{item.name}</span>
                          <span>{item.price} x {item.quantity} items</span>
                        </div>
                      ))}
                    </div>

                    {order.specialRequests && (
                      <div className="p-2 bg-white/[0.02] rounded border border-white/[0.06]">
                        <p className="text-xs text-[#888]">
                          <strong>Special requests:</strong> {order.specialRequests}
                        </p>
                      </div>
                    )}
=======
                        <span className={`text-lg ${order.status === "delivered" ? "text-green-500" : order.status === "confirmed" ? "text-[#627653]" : "text-yellow-500"}`}>{order.status === "delivered" ? "✓" : order.status === "confirmed" ? "●" : "⧗"}</span>
                        <div><p className="text-sm font-semibold capitalize">{order.status}</p><p className="text-xs text-[#888]">{mockMeetings.find((m) => m.id === order.meetingId)?.title}</p></div>
                      </div>
                      <p className="text-sm font-semibold text-[#b8a472]">{order.totalPrice} credits</p>
                    </div>
                    <div className="space-y-1 text-xs text-[#888]">
                      {order.items.map((item: any) => (
                        <div key={item.itemId} className="flex justify-between"><span>{item.name}</span><span>{item.price} x {item.quantity} items</span></div>
                      ))}
                    </div>
>>>>>>> origin/claude/features-61-62-68
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

<<<<<<< HEAD
      {/* Kitchen Display View */}
=======
>>>>>>> origin/claude/features-61-62-68
      {displayMode === "kitchen" && (
        <div className="space-y-4">
          <h2 className="text-[13px] font-semibold tracking-[2px] uppercase text-[#888]">Kitchen Timeline</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {["pending", "confirmed", "delivered"].map((status) => {
              const ordersInStatus = mockOrders.filter((o) => o.status === status);
              return (
                <Card key={status} className="bg-[#111] border-white/[0.06]">
<<<<<<< HEAD
                  <CardHeader>
                    <CardTitle className="text-xs text-[#627653] uppercase tracking-[2px]">
                      {status === "pending" ? "Waiting" : status === "confirmed" ? "In Progress" : "Ready"}
                    </CardTitle>
                  </CardHeader>
=======
                  <CardHeader><CardTitle className="text-xs text-[#627653] uppercase">{status === "pending" ? "Waiting" : status === "confirmed" ? "In Progress" : "Ready"}</CardTitle></CardHeader>
>>>>>>> origin/claude/features-61-62-68
                  <CardContent className="space-y-3">
                    {ordersInStatus.length === 0 ? (
                      <p className="text-xs text-[#666] text-center py-4">No orders</p>
                    ) : (
                      ordersInStatus.map((order) => (
                        <div key={order.id} className="p-2 bg-white/[0.02] rounded border border-white/[0.06]">
<<<<<<< HEAD
                          <p className="text-xs font-semibold mb-2">
                            {mockMeetings.find((m) => m.id === order.meetingId)?.title}
                          </p>
                          {order.items.map((item) => (
                            <div key={item.itemId} className="text-[10px] text-[#888]">
                              {item.name} x{item.quantity}
                            </div>
=======
                          <p className="text-xs font-semibold mb-2">{mockMeetings.find((m) => m.id === order.meetingId)?.title}</p>
                          {order.items.map((item: any) => (
                            <div key={item.itemId} className="text-[10px] text-[#888]">{item.name} x{item.quantity}</div>
>>>>>>> origin/claude/features-61-62-68
                          ))}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Wallet Summary */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-sm text-[#627653]">Company Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#888]">Current Balance</span>
              <span className="text-2xl font-extralight">2,450</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
              <span className="text-xs text-[#888]">Spent on Catering (This Month)</span>
              <span className="text-sm text-[#b8a472] font-semibold">160 credits</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietary Preferences */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-sm text-[#627653]">Dietary Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[#888] mb-3">Manage your allergies and dietary preferences in your profile</p>
          <Button
            variant="outline"
            className="text-xs font-semibold"
            onClick={() => toast.info("View profile to update dietary preferences")}
          >
            Update Profile
          </Button>
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
        <DialogContent className="bg-[#111] border-white/[0.06] max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#627653]">Create Catering Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Meeting Selection */}
            <div>
              <label className="text-xs font-semibold tracking-[1px] uppercase text-[#888] mb-2 block">
                Select Meeting *
              </label>
              <select
                value={selectedMeeting?.id || ""}
                onChange={(e) => {
                  const meeting = mockMeetings.find((m) => m.id === e.target.value);
                  setSelectedMeeting(meeting || null);
                }}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-3 py-2 text-sm text-foreground"
              >
                <option value="">Choose a meeting</option>
                {mockMeetings.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>
                    {meeting.title} - {meeting.date} at {meeting.time} ({meeting.attendees} people)
                  </option>
=======
      <Card className="bg-[#111] border-white/[0.06]"><CardHeader><CardTitle className="text-sm text-[#627653]">Company Wallet</CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex justify-between items-center"><span className="text-sm text-[#888]">Current Balance</span><span className="text-2xl font-extralight">2,450</span></div><div className="flex justify-between items-center pt-2 border-t border-white/[0.06]"><span className="text-xs text-[#888]">Spent on Catering (This Month)</span><span className="text-sm text-[#b8a472] font-semibold">160 credits</span></div></div></CardContent></Card>

      <Card className="bg-[#111] border-white/[0.06]"><CardHeader><CardTitle className="text-sm text-[#627653]">Dietary Preferences</CardTitle></CardHeader><CardContent><p className="text-xs text-[#888] mb-3">Manage your allergies and dietary preferences in your profile</p><Button variant="outline" className="text-xs font-semibold" onClick={() => toast.info("View profile to update dietary preferences")}>Update Profile</Button></CardContent></Card>

      <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
        <DialogContent className="bg-[#111] border-white/[0.06] max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#627653]">Create Catering Order</DialogTitle></DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <label className="text-xs font-semibold tracking-[1px] uppercase text-[#888] mb-2 block">Select Meeting *</label>
              <select value={selectedMeeting?.id || ""} onChange={(e) => { const meeting = mockMeetings.find((m) => m.id === e.target.value); setSelectedMeeting(meeting || null); }} className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-3 py-2 text-sm">
                <option value="">Choose a meeting</option>
                {mockMeetings.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>{meeting.title} - {meeting.date} at {meeting.time}</option>
>>>>>>> origin/claude/features-61-62-68
                ))}
              </select>

              {selectedMeeting && (
                <div className="mt-3 p-3 bg-white/[0.02] rounded border border-white/[0.06] space-y-1 text-xs">
<<<<<<< HEAD
                  <div className="flex items-center gap-2 text-[#888]">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {selectedMeeting.date} at {selectedMeeting.time}
                  </div>
                  <div className="flex items-center gap-2 text-[#888]">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedMeeting.room}
                  </div>
                  <div className="flex items-center gap-2 text-[#888]">
                    <Users className="w-3.5 h-3.5" />
                    {selectedMeeting.attendees} attendees
                  </div>
=======
                  <div className="flex items-center gap-2 text-[#888]"><CalendarIcon className="w-3.5 h-3.5" />{selectedMeeting.date} at {selectedMeeting.time}</div>
                  <div className="flex items-center gap-2 text-[#888]"><MapPin className="w-3.5 h-3.5" />{selectedMeeting.room}</div>
                  <div className="flex items-center gap-2 text-[#888]"><Users className="w-3.5 h-3.5" />{selectedMeeting.attendees} attendees</div>
>>>>>>> origin/claude/features-61-62-68
                </div>
              )}
            </div>

<<<<<<< HEAD
            {/* Menu Items */}
            <div>
              <label className="text-xs font-semibold tracking-[1px] uppercase text-[#888] mb-3 block">
                Menu Items
              </label>
              {Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <p className="text-[11px] font-semibold text-[#627653] uppercase tracking-[1px] mb-2">{category}</p>
                  <div className="grid gap-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded bg-white/[0.02] border border-white/[0.06]">
                        <span className="text-xl">{item.icon}</span>
=======
            <div>
              <label className="text-xs font-semibold tracking-[1px] uppercase text-[#888] mb-3 block">Menu Items</label>
              {Object.entries(groupedMenu).map(([category, items]: any) => (
                <div key={category} className="mb-4">
                  <p className="text-[11px] font-semibold text-[#627653] uppercase tracking-[1px] mb-2">{category}</p>
                  <div className="grid gap-2">
                    {items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded bg-white/[0.02] border border-white/[0.06]">
>>>>>>> origin/claude/features-61-62-68
                        <div className="flex-1">
                          <p className="text-xs font-semibold">{item.name}</p>
                          <p className="text-[10px] text-[#888]">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#b8a472]">{item.price} cr</span>
<<<<<<< HEAD
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={selectedItems.get(item.id) || 0}
                            onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value))}
                            className="w-10 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 text-xs text-foreground text-center"
                          />
=======
                          <input type="number" min="0" max="10" value={selectedItems.get(item.id) || 0} onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value))} className="w-10 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 text-xs text-center" />
>>>>>>> origin/claude/features-61-62-68
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

<<<<<<< HEAD
            {/* Special Requests */}
            <div>
              <label className="text-xs font-semibold tracking-[1px] uppercase text-[#888] mb-2 block">
                Special Requests
              </label>
              <textarea
                placeholder="Allergies, dietary restrictions, special instructions..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-3 py-2 text-sm text-foreground resize-none"
                rows={3}
              />
            </div>

            {/* Total */}
            <div className="p-4 bg-white/[0.04] rounded border border-white/[0.06]">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[#888]">Total Price</span>
                <span className="text-2xl font-extralight text-[#b8a472]">{getTotalPrice()}</span>
              </div>
              <p className="text-xs text-[#666] mt-1">Credits will be deducted from company wallet</p>
=======
            <div>
              <label className="text-xs font-semibold tracking-[1px] uppercase text-[#888] mb-2 block">Special Requests</label>
              <textarea placeholder="Allergies, dietary restrictions..." value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-3 py-2 text-sm resize-none" rows={3} />
            </div>

            <div className="p-4 bg-white/[0.04] rounded border border-white/[0.06]">
              <div className="flex justify-between items-center"><span className="text-sm font-semibold text-[#888]">Total Price</span><span className="text-2xl font-extralight text-[#b8a472]">{getTotalPrice()}</span></div>
              <p className="text-xs text-[#666] mt-1">Credits deducted from company wallet</p>
>>>>>>> origin/claude/features-61-62-68
            </div>
          </div>

          <DialogFooter>
<<<<<<< HEAD
            <Button variant="outline" onClick={() => setShowOrderForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrder}
              className="bg-[#627653] hover:bg-[#627653]/90 text-white"
              disabled={selectedItems.size === 0}
            >
=======
            <Button variant="outline" onClick={() => setShowOrderForm(false)}>Cancel</Button>
            <Button onClick={handleCreateOrder} className="bg-[#627653] text-white" disabled={selectedItems.size === 0}>
>>>>>>> origin/claude/features-61-62-68
              <Check className="w-4 h-4 mr-1" /> Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
