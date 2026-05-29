import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Eye, TrendingUp, LayoutList, Clock, Ban, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "stats">("pending");

  const { data: pendingListings, isLoading: pendingLoading } = trpc.admin.getPendingListings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: allListings, isLoading: allLoading } = trpc.admin.getAllListings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin" && activeTab === "all",
  });

  const { data: statistics, isLoading: statsLoading } = trpc.admin.getStatistics.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin" && activeTab === "stats",
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You must be logged in as an admin to access this page.
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  const pendingCount = pendingListings?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeTab === "pending" ? "default" : "outline"}
              onClick={() => setActiveTab("pending")}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              Pending Reviews
              {pendingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-white text-xs font-bold">
                  {pendingCount}
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              onClick={() => setActiveTab("all")}
              className="gap-2"
            >
              <LayoutList className="w-4 h-4" />
              All Listings
            </Button>
            <Button
              variant={activeTab === "stats" ? "default" : "outline"}
              onClick={() => setActiveTab("stats")}
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Statistics
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {/* ── Pending tab ── */}
        {activeTab === "pending" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Pending Listings for Review</h2>
            {pendingLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading pending listings...</p>
              </div>
            ) : pendingListings && pendingListings.length > 0 ? (
              <div className="space-y-4">
                {pendingListings.map((listing) => (
                  <PendingListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-medium mb-1">All caught up</p>
                <p className="text-muted-foreground text-sm">No pending listings to review.</p>
              </Card>
            )}
          </div>
        )}

        {/* ── All listings tab ── */}
        {activeTab === "all" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">All Listings</h2>
            {allLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading listings...</p>
              </div>
            ) : allListings && allListings.length > 0 ? (
              <div className="space-y-4">
                {allListings.map((listing) => (
                  <Card key={listing.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{listing.title}</h3>
                          <Badge
                            className={
                              listing.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : listing.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{listing.address}</p>
                        <p className="text-sm text-muted-foreground">${listing.pricePerMonth}/month</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/listing/${listing.id}`)}
                        className="gap-2 shrink-0"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No listings found.</p>
              </Card>
            )}
          </div>
        )}

        {/* ── Statistics tab ── */}
        {activeTab === "stats" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Platform Statistics</h2>
            {statsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading statistics...</p>
              </div>
            ) : statistics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard
                  label="Total Listings"
                  value={statistics.totalListings}
                  icon={<LayoutList className="w-5 h-5" />}
                  color="text-foreground"
                />
                <StatCard
                  label="Pending Review"
                  value={statistics.pendingCount}
                  icon={<Clock className="w-5 h-5" />}
                  color="text-yellow-600"
                  highlight={statistics.pendingCount > 0}
                />
                <StatCard
                  label="Approved"
                  value={statistics.approvedCount}
                  icon={<CheckCircle className="w-5 h-5" />}
                  color="text-green-600"
                />
                <StatCard
                  label="Rejected"
                  value={statistics.rejectedCount}
                  icon={<Ban className="w-5 h-5" />}
                  color="text-red-600"
                />
                <StatCard
                  label="Revenue Value"
                  value={`$${statistics.totalRevenue.toLocaleString()}`}
                  icon={<DollarSign className="w-5 h-5" />}
                  color="text-primary"
                  subtitle="approved listings / mo"
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({
  label,
  value,
  icon,
  color,
  highlight,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
  subtitle?: string;
}) {
  return (
    <Card className={`p-6 ${highlight ? "border-yellow-300 bg-yellow-50/50" : ""}`}>
      <div className={`mb-3 ${color}`}>{icon}</div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </Card>
  );
}

/* ── Pending listing card ── */
function PendingListingCard({ listing }: { listing: any }) {
  const [, setLocation] = useLocation();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectError, setRejectError] = useState("");

  const utils = trpc.useUtils();

  const approveMutation = trpc.admin.approveListing.useMutation({
    onSuccess: () => {
      /* Invalidate the pending list so the card disappears without a page reload */
      utils.admin.getPendingListings.invalidate();
      utils.admin.getAllListings.invalidate();
      utils.admin.getStatistics.invalidate();
    },
    onError: (err) => {
      console.error("Approve failed:", err.message);
    },
  });

  const rejectMutation = trpc.admin.rejectListing.useMutation({
    onSuccess: () => {
      utils.admin.getPendingListings.invalidate();
      utils.admin.getAllListings.invalidate();
      utils.admin.getStatistics.invalidate();
    },
    onError: (err) => {
      setRejectError(err.message || "Failed to reject listing.");
    },
  });

  const handleApprove = async () => {
    await approveMutation.mutateAsync({
      listingId: listing.id,
      paymentVerified: true,
    });
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Please provide a rejection reason.");
      return;
    }
    setRejectError("");
    await rejectMutation.mutateAsync({
      listingId: listing.id,
      reason: rejectReason,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{listing.title}</h3>
          <p className="text-sm text-muted-foreground mb-1">{listing.address}</p>
          <p className="text-sm mb-1">
            <strong>Price:</strong> ${listing.pricePerMonth}/month
          </p>
          <p className="text-sm mb-4 text-muted-foreground line-clamp-3">
            {listing.description}
          </p>
          {listing.services && listing.services.length > 0 && (
            <div className="mb-2">
              <p className="text-sm font-medium mb-2">Services:</p>
              <div className="flex flex-wrap gap-2">
                {listing.services.map((service: string) => (
                  <Badge key={service} variant="secondary">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation(`/listing/${listing.id}`)}
          className="gap-2 shrink-0 ml-4"
        >
          <Eye className="w-4 h-4" />
          View Details
        </Button>
      </div>

      {showRejectForm ? (
        <div className="bg-muted p-4 rounded mb-4">
          <label className="block text-sm font-medium mb-2">Rejection Reason</label>
          <textarea
            value={rejectReason}
            onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }}
            placeholder="Explain why this listing is being rejected..."
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-2"
            rows={3}
          />
          {rejectError && (
            <p className="text-xs text-destructive flex items-center gap-1 mb-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {rejectError}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowRejectForm(false);
                setRejectReason("");
                setRejectError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {approveMutation.isPending ? "Approving..." : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowRejectForm(true)}
            className="gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
        </div>
      )}
    </Card>
  );
}
