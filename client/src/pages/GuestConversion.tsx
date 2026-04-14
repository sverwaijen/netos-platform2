import { useState } from "react";
import { TrendingUp, Mail, Gift, ArrowRight, CheckCircle2, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ConversionPipelineStep = {
  label: string;
  value: number;
  percentage: number;
};

export default function GuestConversion() {
  const [selectedStep, setSelectedStep] = useState<number>(0);

  // Conversion metrics
  const pipelineSteps: ConversionPipelineStep[] = [
    { label: "Guest Visits", value: 1234, percentage: 100 },
    { label: "After Checkout", value: 487, percentage: 39.5 },
    { label: "CRM Lead", value: 412, percentage: 33.4 },
    { label: "Trial Offered", value: 287, percentage: 23.3 },
    { label: "Member Signup", value: 156, percentage: 12.6 },
  ];

  const conversionRate = ((156 / 1234) * 100).toFixed(1);

  const followUpTemplates = [
    {
      id: 1,
      subject: "Welcome to SKYNET - Your Special Offer Inside",
      preview: "Thank you for visiting us today. We'd like to offer you 100 credit for your next visit...",
      clicks: 45,
    },
    {
      id: 2,
      subject: "Join Our Community - Exclusive Member Benefits",
      preview: "Experience unlimited access to our premium spaces and facilities...",
      clicks: 32,
    },
    {
      id: 3,
      subject: "Your Free Trial Awaits",
      preview: "We're excited to have you try SKYNET membership. Enjoy 7 days free...",
      clicks: 28,
    },
  ];

  const trialCreditBundles = [
    {
      name: "Starter Trial",
      credits: "50",
      duration: "7 days",
      perks: ["Access all spaces", "WiFi included", "Basic support"],
    },
    {
      name: "Professional Trial",
      credits: "100",
      duration: "14 days",
      perks: ["All Starter perks", "Meeting room upgrade", "Priority support"],
    },
    {
      name: "Enterprise Trial",
      credits: "200",
      duration: "30 days",
      perks: ["All features", "Dedicated account manager", "Custom packages"],
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extralight mb-2">
          Guest <span className="font-bold text-[#b8a472]">Conversion</span>
        </h1>
        <p className="text-[#627653] text-xs font-semibold tracking-[4px] uppercase">
          Convert guests to paying members
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#0f1a0f] to-[#0a0a0a] border-[#627653]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#627653] uppercase tracking-wider">
              Overall Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#b8a472]">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">156 members from 1,234 guests</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0f1a0f] to-[#0a0a0a] border-[#627653]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#627653] uppercase tracking-wider">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#4a7c8a]">34</div>
            <p className="text-xs text-muted-foreground mt-1">New members (↑12% vs last month)</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0f1a0f] to-[#0a0a0a] border-[#627653]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#627653] uppercase tracking-wider">
              Avg Trial Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#b8a472]">12.4</div>
            <p className="text-xs text-muted-foreground mt-1">days before conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="bg-gradient-to-br from-[#0f1a0f] to-[#0a0a0a] border-[#627653]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#627653]" />
            Conversion Funnel
          </CardTitle>
          <CardDescription>Guest to member journey visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelineSteps.map((step, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedStep(idx)}
                className={`cursor-pointer p-4 rounded-lg transition-all border ${
                  selectedStep === idx
                    ? "bg-[#627653]/10 border-[#627653]"
                    : "bg-[#0a0a0a] border-[#627653]/20 hover:border-[#627653]/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#627653]/20 border border-[#627653] flex items-center justify-center text-xs font-bold text-[#627653]">
                      {idx + 1}
                    </div>
                    <span className="font-semibold">{step.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#b8a472]">{step.value}</div>
                    <div className="text-xs text-muted-foreground">{step.percentage}%</div>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#0f1a0f] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#627653] to-[#b8a472] transition-all"
                    style={{ width: `${step.percentage}%` }}
                  />
                </div>
                {idx < pipelineSteps.length - 1 && (
                  <div className="flex justify-center mt-3 text-[#627653]">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trial Credit Bundles */}
      <div>
        <h2 className="text-xl font-extralight mb-4">
          Trial <span className="font-bold text-[#b8a472]">Credit Bundles</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trialCreditBundles.map((bundle, idx) => (
            <Card
              key={idx}
              className={`bg-gradient-to-br from-[#0f1a0f] to-[#0a0a0a] border-2 transition-all ${
                idx === 1 ? "border-[#b8a472] ring-1 ring-[#b8a472]/20" : "border-[#627653]/20"
              }`}
            >
              <CardHeader>
                <CardTitle className="text-lg">{bundle.name}</CardTitle>
                <CardDescription>Recommended to new guests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#0a0a0a] rounded p-4 text-center">
                  <div className="text-4xl font-bold text-[#b8a472]">{bundle.credits}</div>
                  <div className="text-xs text-muted-foreground mt-1">credits</div>
                  <div className="text-sm text-[#627653] font-semibold mt-3">{bundle.duration}</div>
                </div>

                <div className="space-y-2">
                  {bundle.perks.map((perk, pidx) => (
                    <div key={pidx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-[#627653] mt-0.5 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className={`w-full ${
                    idx === 1 ? "bg-[#b8a472] hover:bg-[#b8a472]/90" : "bg-[#627653] hover:bg-[#627653]/90"
                  }`}
                >
                  Offer to Guest
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Follow-Up Email Templates */}
      <Card className="bg-gradient-to-br from-[#0f1a0f] to-[#0a0a0a] border-[#627653]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#627653]" />
            Follow-Up Email Templates
          </CardTitle>
          <CardDescription>Send automated messages to convert guests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {followUpTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 bg-[#0a0a0a] border border-[#627653]/20 rounded-lg hover:border-[#627653]/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-[#b8a472] transition-colors">
                      {template.subject}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{template.preview}</p>
                  </div>
                  <Mail className="h-5 w-5 text-[#627653]/50 group-hover:text-[#627653] shrink-0 ml-4" />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{template.clicks} clicks from 287 sent</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    Preview & Send
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Step Details */}
      {selectedStep === 1 && (
        <Card className="bg-gradient-to-br from-[#0f1a0f] to-[#0a0a0a] border-[#4a7c8a]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#4a7c8a]" />
              CRM Lead Auto-Creation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-[#0a0a0a] border border-[#4a7c8a]/20 rounded p-4">
              <h3 className="font-semibold text-[#4a7c8a] mb-3">Automatic Pipeline Steps</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#627653]" />
                  <span>Guest details captured at check-out</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#627653]" />
                  <span>CRM lead created automatically</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#627653]" />
                  <span>Scored based on engagement metrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#627653]" />
                  <span>Assigned to sales team</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#627653]" />
                  <span>Automated follow-up emails sent</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#627653]/10 to-transparent border border-[#627653]/20 rounded p-4">
              <p className="text-sm">
                <span className="font-semibold text-[#627653]">Next Step:</span> Review CRM leads and customize
                follow-up campaigns in the Pipeline dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
