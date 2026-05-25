import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Eye } from "lucide-react";
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
            >
              Pending Reviews
            </Button>
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              onClick={() => setActiveTab("all")}
            >
              All Listings
            </Button>
            <Button
              variant={activeTab === "stats" ? "default" : "outline"}
              onClick={() => setActiveTab("stats")}
            >
              Statistics
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
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
                <p className="text-muted-foreground">No pending listings to review.</p>
              </Card>
            )}
          </div>
        )}

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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{listing.title}</h3>
                          <Badge>{listing.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{listing.address}</p>
                        <p className="text-sm">${listing.pricePerMonth}/month</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/listing/${listing.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
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

        {activeTab === "stats" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Platform Statistics</h2>
            {statsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading statistics...</p>
              </div>
            ) : statistics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Total Listings</p>
                  <p className="text-3xl font-bold">{statistics.totalListings}</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-600">{statistics.pendingCount}</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{statistics.approvedCount}</p>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{statistics.rejectedCount}</p>
                </Card>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function PendingListingCard({ listing }: { listing: any }) {
  const [, setLocation] = useLocation();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const approveMutation = trpc.admin.approveListing.useMutation({
    onSuccess: () => {
      // Refresh the page or list
      window.location.reload();
    },
  });

  const rejectMutation = trpc.admin.rejectListing.useMutation({
    onSuccess: () => {
      window.location.reload();
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
      alert("Please provide a rejection reason");
      return;
    }
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
          <p className="text-sm text-muted-foreground mb-2">{listing.address}</p>
          <p className="text-sm mb-2">
            <strong>Price:</strong> ${listing.pricePerMonth}/month
          </p>
          <p className="text-sm mb-4">
            <strong>Description:</strong> {listing.description}
          </p>
          {listing.services && listing.services.length > 0 && (
            <div className="mb-4">
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
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>

      {showRejectForm ? (
        <div className="bg-muted p-4 rounded mb-4">
          <label className="block text-sm font-medium mb-2">Rejection Reason</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this listing is being rejected..."
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
            rows={3}
          />
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
