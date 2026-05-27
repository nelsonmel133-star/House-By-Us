# House-by-us: Implementation Guide for Remaining Features

This guide provides step-by-step instructions and code examples for implementing the remaining features of the House-by-us platform.

## Table of Contents

1. [Landlord Registration & Profile](#landlord-registration--profile)
2. [Landlord Dashboard](#landlord-dashboard)
3. [Admin Dashboard](#admin-dashboard)
4. [Maps Integration](#maps-integration)
5. [Email Notifications](#email-notifications)
6. [Payment Integration (Stripe)](#payment-integration-stripe)
7. [Testing](#testing)

---

## Landlord Registration & Profile

### Step 1: Create Landlord Registration Page

**File**: `client/src/pages/LandlordRegister.tsx`

```typescript
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function LandlordRegister() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    companyName: "",
    phoneNumber: "",
    alternatePhone: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registerMutation = trpc.landlord.registerAsLandlord.useMutation({
    onSuccess: () => {
      setLocation("/landlord/dashboard");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerMutation.mutateAsync(formData);
    } catch (err) {
      setError("Failed to register as landlord");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            You need to sign in to register as a landlord.
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-2">Become a Landlord</h1>
          <p className="text-muted-foreground mb-8">
            Register your boarding house and start reaching students across Harare.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name (Optional)</label>
              <Input
                name="companyName"
                placeholder="My Boarding Houses"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number *</label>
              <Input
                name="phoneNumber"
                type="tel"
                placeholder="+263781234567"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Alternate Phone (Optional)</label>
              <Input
                name="alternatePhone"
                type="tel"
                placeholder="+263774567890"
                value={formData.alternatePhone}
                onChange={handleChange}
              />
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Bank Account Details</h2>
              <p className="text-sm text-muted-foreground mb-4">
                We'll use these details to send your earnings. All information is encrypted and secure.
              </p>

              <div>
                <label className="block text-sm font-medium mb-2">Account Holder Name (Optional)</label>
                <Input
                  name="bankAccountName"
                  placeholder="John Doe"
                  value={formData.bankAccountName}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Account Number (Optional)</label>
                <Input
                  name="bankAccountNumber"
                  placeholder="1234567890"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Bank Name (Optional)</label>
                <Input
                  name="bankName"
                  placeholder="ZB Bank"
                  value={formData.bankName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded">
              <p className="text-sm text-muted-foreground">
                <strong>Next Steps:</strong> After registration, you'll be able to create and submit listings for admin review.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register as Landlord"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
```

---

## Landlord Dashboard

### Step 2: Create Landlord Dashboard Page

**File**: `client/src/pages/LandlordDashboard.tsx`

```typescript
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Eye, MapPin, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function LandlordDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: listings, isLoading } = trpc.listings.getByLandlord.useQuery();

  if (!isAuthenticated || user?.role !== "landlord") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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

                    {listing.status === "rejected" && listing.rejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 mb-4">
                        <strong>Rejection Reason:</strong> {listing.rejectionReason}
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {listing.description}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/listing/${listing.id}`)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    
                    {(listing.status === "pending" || listing.status === "rejected") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/landlord/edit-listing/${listing.id}`)}
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this listing?")) {
                              // Implement delete mutation
                            }
                          }}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">No Listings Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first listing to get started.
            </p>
            <Button onClick={() => setLocation("/landlord/create-listing")} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Listing
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

## Admin Dashboard

### Step 3: Create Admin Dashboard Page

**File**: `client/src/pages/AdminDashboard.tsx`

```typescript
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, MapPin, DollarSign, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedListing, setSelectedListing] = useState<number | null>(null);

  const { data: pendingListings, isLoading } = trpc.admin.getPendingListings.useQuery();

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-muted-foreground mb-6">
            Only administrators can access this page.
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Review and approve boarding house listings
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pending listings...</p>
          </div>
        ) : pendingListings && pendingListings.length > 0 ? (
          <div className="space-y-6">
            {pendingListings.map((listing) => (
              <ListingReviewCard
                key={listing.id}
                listing={listing}
                isSelected={selectedListing === listing.id}
                onSelect={() => setSelectedListing(selectedListing === listing.id ? null : listing.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
            <p className="text-muted-foreground">
              There are no pending listings to review.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function ListingReviewCard({ listing, isSelected, onSelect }: any) {
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const approveMutation = trpc.admin.approveListing.useMutation();
  const rejectMutation = trpc.admin.rejectListing.useMutation();

  const handleApprove = async () => {
    await approveMutation.mutateAsync({
      listingId: listing.id,
      paymentVerified,
      inspectionNotes,
    });
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    await rejectMutation.mutateAsync({
      listingId: listing.id,
      reason: rejectionReason,
    });
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onSelect}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">{listing.title}</h3>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {listing.address}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                ${listing.pricePerMonth}/month
              </div>
            </div>
          </div>
          <Badge variant="outline">Pending Review</Badge>
        </div>
      </div>

      {isSelected && (
        <div className="border-t border-border p-6 bg-muted/30 space-y-6">
          {/* Listing Details */}
          <div>
            <h4 className="font-semibold mb-3">Property Details</h4>
            <p className="text-sm text-muted-foreground mb-3">{listing.description}</p>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Rooms:</span> {listing.numberOfRooms}
              </div>
              <div>
                <span className="font-medium">Occupancy:</span> {listing.occupancyPerRoom} per room
              </div>
              <div>
                <span className="font-medium">Contact:</span> {listing.contactPhone}
              </div>
              {listing.contactEmail && (
                <div>
                  <span className="font-medium">Email:</span> {listing.contactEmail}
                </div>
              )}
            </div>

            {listing.services && listing.services.length > 0 && (
              <div className="mt-4">
                <span className="font-medium text-sm">Services:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {listing.services.map((service: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{service}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Approval Form */}
          {!showRejectForm && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`payment-${listing.id}`}
                  checked={paymentVerified}
                  onChange={(e) => setPaymentVerified(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor={`payment-${listing.id}`} className="text-sm font-medium cursor-pointer">
                  Payment verified
                </label>
              </div>

              <div>
                <label className="text-sm font-medium">Inspection Notes (Optional)</label>
                <textarea
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Record your inspection findings..."
                  className="w-full mt-2 p-3 border border-border rounded text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="gap-2 flex-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  {approveMutation.isPending ? "Approving..." : "Approve Listing"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="space-y-4 p-4 bg-destructive/10 border border-destructive/20 rounded">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Reject Listing
              </h4>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this listing is being rejected..."
                className="w-full p-3 border border-border rounded text-sm"
                rows={4}
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
```

---

## Maps Integration

### Step 4: Integrate Google Maps

**File**: `client/src/pages/ListingDetail.tsx` (Update the location section)

```typescript
import { Map } from "@/components/Map";

// Inside ListingDetail component, replace the map placeholder:

{listing.latitude && listing.longitude && (
  <Card className="p-6">
    <h2 className="text-2xl font-bold mb-4">Location</h2>
    <Map
      defaultCenter={{
        lat: parseFloat(listing.latitude),
        lng: parseFloat(listing.longitude),
      }}
      defaultZoom={15}
      onMapReady={(map) => {
        // Add marker for this property
        new window.google.maps.Marker({
          position: {
            lat: parseFloat(listing.latitude),
            lng: parseFloat(listing.longitude),
          },
          map: map,
          title: listing.title,
        });

        // Add markers for nearby universities
        const universities = [
          { name: "University of Zimbabwe", lat: -17.8252, lng: 31.0335 },
          { name: "NUST", lat: -17.8198, lng: 31.0289 },
          { name: "Harare Poly", lat: -17.8315, lng: 31.0401 },
        ];

        universities.forEach((uni) => {
          new window.google.maps.Marker({
            position: { lat: uni.lat, lng: uni.lng },
            map: map,
            title: uni.name,
            icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          });
        });
      }}
    />
  </Card>
)}
```

---

## Email Notifications

### Step 5: Set Up Email Notifications

**File**: `server/_core/email.ts` (Create new file)

```typescript
import { invokeLLM } from "./llm";
import { notifyOwner } from "./notification";

export async function sendEmailNotification(
  to: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    // Use the built-in email service
    // This is a placeholder - implement with actual email service
    console.log(`[Email] To: ${to}, Subject: ${subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

export async function sendLandlordApprovalEmail(
  landlordEmail: string,
  landlordName: string,
  listingTitle: string
): Promise<boolean> {
  const htmlContent = `
    <h2>Your Listing Has Been Approved!</h2>
    <p>Hi ${landlordName},</p>
    <p>Great news! Your listing "<strong>${listingTitle}</strong>" has been approved and is now live on House-by-us.</p>
    <p>Students can now see your property and contact you about bookings.</p>
    <p><a href="https://housebyus.com/listing/view">View Your Listing</a></p>
    <p>Best regards,<br>House-by-us Team</p>
  `;

  return await sendEmailNotification(
    landlordEmail,
    "Your Listing Has Been Approved",
    htmlContent
  );
}

export async function sendLandlordRejectionEmail(
  landlordEmail: string,
  landlordName: string,
  listingTitle: string,
  reason: string
): Promise<boolean> {
  const htmlContent = `
    <h2>Your Listing Submission</h2>
    <p>Hi ${landlordName},</p>
    <p>Unfortunately, your listing "<strong>${listingTitle}</strong>" was not approved at this time.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>You can edit and resubmit your listing. Please address the concerns mentioned above.</p>
    <p><a href="https://housebyus.com/landlord/dashboard">Go to Dashboard</a></p>
    <p>Best regards,<br>House-by-us Team</p>
  `;

  return await sendEmailNotification(
    landlordEmail,
    "Your Listing Needs Revision",
    htmlContent
  );
}

export async function sendAdminNewSubmissionEmail(
  adminEmail: string,
  adminName: string,
  listingTitle: string,
  landlordName: string
): Promise<boolean> {
  const htmlContent = `
    <h2>New Listing Submission</h2>
    <p>Hi ${adminName},</p>
    <p>A new listing has been submitted for review:</p>
    <p><strong>${listingTitle}</strong> by ${landlordName}</p>
    <p><a href="https://housebyus.com/admin">Review in Admin Dashboard</a></p>
    <p>Best regards,<br>House-by-us System</p>
  `;

  return await sendEmailNotification(
    adminEmail,
    "New Listing Submission Pending Review",
    htmlContent
  );
}
```

### Step 6: Update Routers to Send Emails

**File**: `server/routers.ts` (Update the create listing mutation)

```typescript
import { sendAdminNewSubmissionEmail } from "./_core/email";

// In listings.create mutation, after notifying admins:

// Send emails to admins
const admins = await db.getAdminUsers();
for (const admin of admins) {
  await sendAdminNewSubmissionEmail(
    admin.email || "",
    admin.name || "Admin",
    input.title,
    ctx.user.name || "Landlord"
  );
}
```

---

## Payment Integration (Stripe)

### Step 7: Add Stripe Integration

**File**: `server/routers.ts` (Add payments router)

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export const appRouter = router({
  // ... existing routers ...

  payments: router({
    createCheckout: protectedProcedure
      .input(z.object({
        listingId: z.number().optional(),
        amount: z.number().positive(),
        description: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: input.description,
                },
                unit_amount: Math.round(input.amount * 100),
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${process.env.VITE_FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.VITE_FRONTEND_URL}/payment/cancel`,
          metadata: {
            userId: ctx.user.id,
            listingId: input.listingId || 0,
          },
        });

        return { sessionId: session.id, url: session.url };
      }),

    getCheckoutSession: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        const session = await stripe.checkout.sessions.retrieve(input);
        return session;
      }),
  }),
});
```

---

## Testing

### Step 8: Write Tests for Core Features

**File**: `server/listings.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Listings", () => {
  let ctx: TrpcContext;

  beforeAll(() => {
    const user = {
      id: 1,
      openId: "test-landlord",
      email: "landlord@test.com",
      name: "Test Landlord",
      loginMethod: "oauth",
      role: "landlord" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    ctx = {
      user,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    };
  });

  it("should create a listing", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.listings.create({
      title: "Test House",
      description: "A test boarding house",
      address: "123 Test St, Harare",
      pricePerMonth: 350,
      numberOfRooms: 3,
      occupancyPerRoom: 2,
      services: ["WiFi", "Water Tank"],
      contactPhone: "+263781234567",
    });

    expect(result).toBeDefined();
  });

  it("should search listings", async () => {
    const caller = appRouter.createCaller(ctx);

    const results = await caller.listings.search({
      location: "Harare",
      minPrice: 200,
      maxPrice: 500,
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it("should reject unauthorized admin access", async () => {
    const userCtx = {
      ...ctx,
      user: { ...ctx.user, role: "user" as const },
    };

    const caller = appRouter.createCaller(userCtx);

    expect(() => caller.admin.getPendingListings()).rejects.toThrow();
  });
});
```

---

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/listings.test.ts

# Run with coverage
pnpm test -- --coverage
```

---

## Next Steps

1. **Implement Landlord Features**:
   - Create listing form with image/video uploads
   - Edit and delete listings
   - View listing analytics

2. **Implement Admin Features**:
   - Bulk actions for approvals
   - Export listings to CSV
   - Admin analytics dashboard

3. **Add Student Features**:
   - Save/favorite listings
   - Send inquiries to landlords
   - View inquiry history

4. **Enhance User Experience**:
   - Real-time notifications
   - In-app messaging
   - Property reviews and ratings

5. **Implement Payments**:
   - Listing fees via Stripe
   - Premium listing upgrades
   - Commission on bookings

6. **Marketing & Growth**:
   - Email campaigns
   - Social media integration
   - Referral program

---

## Support

For questions or issues with implementation, refer to:
- [tRPC Documentation](https://trpc.io)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Documentation](https://react.dev)

