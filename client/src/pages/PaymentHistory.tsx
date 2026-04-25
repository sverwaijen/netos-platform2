import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, ExternalLink, Receipt, ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

function statusBadge(status: string) {
  switch (status) {
    case "succeeded":
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" />Succeeded</Badge>;
    case "pending":
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "failed":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    default:
      return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />{status}</Badge>;
  }
}

export default function PaymentHistory() {
  const { user, loading: authLoading } = useAuth();
  const { data: payments, isLoading } = trpc.walletPayment.payments.useQuery(undefined, { enabled: !!user });
  const { data: subStatus } = trpc.walletPayment.subscriptionStatus.useQuery(undefined, { enabled: !!user });
  const portalMutation = trpc.walletPayment.customerPortal.useMutation({
    onSuccess: (data) => {
      window.open(data.portalUrl, "_blank");
    },
  });

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Receipt className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Sign in to view your payments</h2>
        <Button onClick={() => window.location.href = getLoginUrl()}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment History</h1>
          <p className="text-muted-foreground">View your transactions and manage your subscription</p>
        </div>
        <Button
          variant="outline"
          onClick={() => portalMutation.mutate()}
          disabled={portalMutation.isPending || !subStatus?.active}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Manage Subscription
        </Button>
      </div>

      {/* Subscription Status Card */}
      {subStatus && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {subStatus.active ? (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{subStatus.plan || "Active Plan"}</p>
                  <p className="text-sm text-muted-foreground">
                    Active subscription
                    {subStatus.cancelAtPeriodEnd && " · Cancels at period end"}
                  </p>
                  {subStatus.currentPeriodEnd && (
                    <p className="text-xs text-muted-foreground">
                      Next billing: {new Date(subStatus.currentPeriodEnd).toLocaleDateString("nl-NL")}
                    </p>
                  )}
                </div>
                <Badge className={subStatus.cancelAtPeriodEnd
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                }>
                  {subStatus.cancelAtPeriodEnd ? "Cancelling" : "Active"}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">No active subscription</p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/bundles"}>
                  View Plans <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transactions</CardTitle>
          <CardDescription>Your recent charges and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No payments yet</p>
              <p className="text-sm text-muted-foreground mt-1">Payments will appear here after your first purchase</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{payment.description || "Payment"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.created).toLocaleDateString("nl-NL", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusBadge(payment.status)}
                    <span className="font-semibold tabular-nums">
                      €{payment.amount.toFixed(2)}
                    </span>
                    {payment.receiptUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
