import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  BookOpen,
  MapPin,
  Calendar,
  Wallet,
  Wifi,
  Key,
  Gift,
  Camera,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  photoUrl?: string;
  location?: string;
  resource?: string;
  date?: string;
  time?: string;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    phone: "",
  });
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);

  const steps: Array<{
    number: OnboardingStep;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      number: 1,
      title: "Welcome",
      description: "Platform intro",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      number: 2,
      title: "Profile",
      description: "Complete your profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      number: 3,
      title: "First Booking",
      description: "Schedule your first use",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      number: 4,
      title: "Credits",
      description: "Trial credits explained",
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      number: 5,
      title: "Access",
      description: "Setup access keys",
      icon: <Key className="h-5 w-5" />,
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // No validation needed for welcome
      if (!completedSteps.includes(1)) {
        setCompletedSteps((prev) => [...prev, 1]);
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate profile
      if (!formData.name || !formData.email || !formData.company) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (!completedSteps.includes(2)) {
        setCompletedSteps((prev) => [...prev, 2]);
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Validate booking
      if (!formData.location || !formData.resource || !formData.date) {
        toast.error("Please complete your booking details");
        return;
      }
      if (!completedSteps.includes(3)) {
        setCompletedSteps((prev) => [...prev, 3]);
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // No validation for credits
      if (!completedSteps.includes(4)) {
        setCompletedSteps((prev) => [...prev, 4]);
      }
      setCurrentStep(5);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  };

  const handleSkip = () => {
    toast.info("Skipping onboarding. You can complete this later from Settings.");
    // In a real app, redirect to dashboard
    window.location.href = "/dashboard";
  };

  const handleComplete = async () => {
    if (!completedSteps.includes(5)) {
      setCompletedSteps((prev) => [...prev, 5]);
    }
    toast.success("Welcome to SKYNET! Your account is ready.");
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111] px-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center">
                <button
                  onClick={() => {
                    if (completedSteps.includes(step.number) || step.number <= currentStep) {
                      setCurrentStep(step.number);
                    }
                  }}
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    currentStep === step.number || completedSteps.includes(step.number)
                      ? "opacity-100"
                      : "opacity-40"
                  }`}
                  disabled={step.number > currentStep + 1 && !completedSteps.includes(step.number)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                      completedSteps.includes(step.number)
                        ? "bg-[#627653] text-white"
                        : currentStep === step.number
                        ? "bg-[#b8a472] text-[#111]"
                        : "bg-[#0a0a0a] border border-[#627653]/30 text-[#627653]"
                    }`}
                  >
                    {completedSteps.includes(step.number) ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                      {step.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{step.description}</p>
                  </div>
                </button>

                {idx < steps.length - 1 && (
                  <div className="h-1 bg-[#627653]/20 flex-1 mx-2 mb-6" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#111] border border-[#627653]/20 rounded-lg p-8">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extralight mb-2">
                  Welcome to <span className="font-bold text-[#b8a472]">SKYNET</span>
                </h1>
                <p className="text-[#627653] text-xs font-semibold tracking-[4px] uppercase">
                  Your workspace is ready
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-[#0a0a0a] border border-[#627653]/20 rounded-lg p-4 flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#4a7c8a] mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Find Your Space</h3>
                    <p className="text-sm text-muted-foreground">
                      Access our portfolio of premium locations and resources
                    </p>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-[#627653]/20 rounded-lg p-4 flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[#4a7c8a] mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Book Instantly</h3>
                    <p className="text-sm text-muted-foreground">
                      Reserve meeting rooms, desks, and facilities with ease
                    </p>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-[#627653]/20 rounded-lg p-4 flex items-start gap-3">
                  <Wallet className="h-5 w-5 text-[#4a7c8a] mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Flexible Credits</h3>
                    <p className="text-sm text-muted-foreground">
                      Pay-as-you-go model with trial credits to get started
                    </p>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-[#627653]/20 rounded-lg p-4 flex items-start gap-3">
                  <Wifi className="h-5 w-5 text-[#4a7c8a] mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Connected Experience</h3>
                    <p className="text-sm text-muted-foreground">
                      High-speed WiFi, smart access, and seamless integrations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Profile Completion */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extralight mb-2">
                  Complete Your <span className="font-bold text-[#b8a472]">Profile</span>
                </h1>
                <p className="text-[#627653] text-xs font-semibold tracking-[4px] uppercase">
                  Tell us about yourself
                </p>
              </div>

              <div className="space-y-4">
                {/* Photo */}
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-[#0a0a0a] border-2 border-dashed border-[#627653]/30 rounded-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-[#627653]/50" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="name" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-[#0a0a0a] border-[#627653]/20 text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-[#0a0a0a] border-[#627653]/20 text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="company" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                    Company *
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    placeholder="Your Company Inc."
                    value={formData.company}
                    onChange={handleInputChange}
                    className="bg-[#0a0a0a] border-[#627653]/20 text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+31 6 12345678"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="bg-[#0a0a0a] border-[#627653]/20 text-foreground mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: First Booking */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extralight mb-2">
                  Schedule Your <span className="font-bold text-[#b8a472]">First Booking</span>
                </h1>
                <p className="text-[#627653] text-xs font-semibold tracking-[4px] uppercase">
                  Make your first reservation
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="location" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                    Select Location
                  </Label>
                  <select
                    name="location"
                    id="location"
                    value={formData.location || ""}
                    onChange={handleInputChange}
                    className="w-full bg-[#0a0a0a] border border-[#627653]/20 rounded px-3 py-2 text-foreground mt-1"
                  >
                    <option value="">Choose a location...</option>
                    <option value="amsterdam">Amsterdam - Central Office</option>
                    <option value="rotterdam">Rotterdam - Tech Hub</option>
                    <option value="eindhoven">Eindhoven - Innovation Center</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="resource" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                    Select Resource
                  </Label>
                  <select
                    name="resource"
                    id="resource"
                    value={formData.resource || ""}
                    onChange={handleInputChange}
                    className="w-full bg-[#0a0a0a] border border-[#627653]/20 rounded px-3 py-2 text-foreground mt-1"
                  >
                    <option value="">Choose a resource...</option>
                    <option value="meeting-room">Meeting Room (6 people)</option>
                    <option value="desk">Hot Desk</option>
                    <option value="office">Private Office</option>
                    <option value="focus-pod">Focus Pod</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                      Date
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date || ""}
                      onChange={handleInputChange}
                      className="bg-[#0a0a0a] border-[#627653]/20 text-foreground mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="time" className="text-xs font-semibold text-[#627653] uppercase tracking-wider">
                      Time
                    </Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      value={formData.time || ""}
                      onChange={handleInputChange}
                      className="bg-[#0a0a0a] border-[#627653]/20 text-foreground mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Credits Explanation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extralight mb-2">
                  Credits & <span className="font-bold text-[#b8a472]">Trial Offer</span>
                </h1>
                <p className="text-[#627653] text-xs font-semibold tracking-[4px] uppercase">
                  Flexible payment options
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-[#627653]/10 to-transparent border border-[#627653]/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Gift className="h-5 w-5 text-[#b8a472] mt-1" />
                    <div>
                      <h3 className="font-semibold text-[#b8a472] mb-1">100 Trial Credits</h3>
                      <p className="text-sm text-muted-foreground">
                        Use your free trial credits on any resource for 30 days
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-[#627653]/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-[#627653]">How Credits Work</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#627653] mt-0.5 shrink-0" />
                      <span>1 credit = approximately 1 EUR</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#627653] mt-0.5 shrink-0" />
                      <span>Use for any resource type at any location</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#627653] mt-0.5 shrink-0" />
                      <span>Roll over unused credits to next month</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#627653] mt-0.5 shrink-0" />
                      <span>Easy top-up anytime via wallet</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#4a7c8a]/10 to-transparent border border-[#4a7c8a]/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-[#4a7c8a] mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Monthly Subscriptions</h3>
                      <p className="text-sm text-muted-foreground">
                        Upgrade to unlimited access plans for frequent users
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Access Setup */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extralight mb-2">
                  Access <span className="font-bold text-[#b8a472]">Setup</span>
                </h1>
                <p className="text-[#627653] text-xs font-semibold tracking-[4px] uppercase">
                  Configure your keys and access
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-[#627653]/10 to-transparent border border-[#627653]/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-[#627653] mt-1" />
                    <div>
                      <h3 className="font-semibold text-[#627653] mb-1">Salto KS Key Activation</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Smart key system for seamless building access
                      </p>
                      <Button size="sm" className="bg-[#627653] hover:bg-[#627653]/90">
                        Activate Your KS Key
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-[#627653]/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-[#627653]">WiFi Access Information</h3>
                  <div className="space-y-2 text-sm bg-[#0f1a0f] rounded p-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Network Name:</p>
                      <p className="text-[#b8a472] font-mono">SKYNET-2024</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Password:</p>
                      <p className="text-[#b8a472] font-mono">Welcome2024!</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#4a7c8a]/10 to-transparent border border-[#4a7c8a]/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-[#4a7c8a] mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Security & Privacy</h3>
                      <p className="text-sm text-muted-foreground">
                        Your data is encrypted and secure. View our privacy policy in settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-[#627653]/20">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} className="border-[#627653]">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < 5 ? (
              <>
                <Button variant="outline" onClick={handleSkip} className="border-[#627653]/50">
                  Skip Setup
                </Button>
                <Button
                  onClick={handleNext}
                  className="ml-auto bg-[#627653] hover:bg-[#627653]/90 text-white"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <Button onClick={handleComplete} className="ml-auto bg-[#b8a472] hover:bg-[#b8a472]/90 text-[#111]">
                <Check className="h-4 w-4 mr-2" />
                Complete Onboarding
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
