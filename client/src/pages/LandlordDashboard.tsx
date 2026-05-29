import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Eye, MapPin, DollarSign, AlertTriangle, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function LandlordDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const utils = trpc.useUtils();

  const { data: listings, isLoading } = trpc.listings.getByLandlord.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "landlord",
  });

  const deleteMutation = trpc.listings.delete.useMutation({
    onSuccess: () => {
      /* Invalidate the landlord listing cache so the list refreshes without a page reload */
      utils.listings.getByLandlord.invalidate();
      setDeleteConfirm(null);
      setDeleteError("");
    },
    onError: (err) => {
      setDeleteError(err.message || "Failed to delete listing.");
    },
  });

  const handleDeleteConfirm = async (id: number) => {
    setDeleteError("");
    await deleteMutation.mutateAsync(id);
  };

  if (!isAuthenticated || user?.role !== "landlord") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You must be logged in as a landlord to access this page.
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Listings</h1>
            <p className="text-muted-foreground">Manage your boarding house listings</p>
          </div>
          <Button onClick={() => setLocation("/landlord/create-listing")} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Listing
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your listings...</p>
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="space-y-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{listing.title}</h3>
                      <Badge className={getStatusColor(listing.status)}>
                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {listing.address}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${listing.pricePerMonth}/month
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {listing.description}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {/* View */}
                    <Button
                      variant="outline"
                      size="sm"
                      title="View listing"
                      onClick={() => setLocation(`/listing/${listing.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {/* Edit — disabled until edit page is built */}
                    <Button
                      variant="outline"
                      size="sm"
                      title="Editing is not yet available"
                      disabled
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    {/* Delete — opens inline confirmation */}
                    <Button
                      variant="outline"
                      size="sm"
                      title="Delete listing"
                      onClick={() => {
                        setDeleteError("");
                        setDeleteConfirm(listing.id);
                      }}
                      className="text-destructive hover:bg-destructive/10 hover:border-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* ── Inline delete confirmation ── */}
                {deleteConfirm === listing.id && (
                  <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Delete this listing?</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          This action cannot be undone. The listing will be permanently removed.
                        </p>
                      </div>
                      <button
                        onClick={() => { setDeleteConfirm(null); setDeleteError(""); }}
                        className="ml-auto p-1 rounded hover:bg-muted transition-colors"
                        aria-label="Cancel"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>

                    {deleteError && (
                      <p className="text-xs text-destructive mb-3 pl-8">{deleteError}</p>
                    )}

                    <div className="flex gap-2 pl-8">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteConfirm(listing.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setDeleteConfirm(null); setDeleteError(""); }}
                        disabled={deleteMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't created any listings yet.</p>
            <Button onClick={() => setLocation("/landlord/create-listing")}>
              Create Your First Listing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
