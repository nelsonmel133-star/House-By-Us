import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Home as HomeIcon,
  Users,
  CheckCircle,
  ArrowRight,
  Search,
  LogOut,
  LayoutDashboard,
  Loader2,
  Phone,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

/* ── Listing card skeleton ── */
function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

/* ── Listing image with fallback ── */
function ListingImage({ listing }: { listing: any }) {
  const [imgError, setImgError] = useState(false);
  const firstImage = listing.media?.find((m: any) => m.type === "image");

  if (firstImage && !imgError) {
    return (
      <div className="h-48 overflow-hidden bg-muted">
        <img
          src={firstImage.url}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  /* Illustrated fallback — geometric house shape in brand colours */
  return (
    <div className="h-48 bg-gradient-to-br from-primary/8 via-primary/5 to-accent/10 flex items-center justify-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
          backgroundSize: "12px 12px",
        }}
      />
      <div className="flex flex-col items-center gap-2 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
          <HomeIcon className="w-8 h-8 text-primary/50" />
        </div>
        <span className="text-xs text-muted-foreground/60 font-medium tracking-wide">
          No photo yet
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [shake, setShake] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: featuredListings, isLoading } = trpc.listings.getApproved.useQuery({
    limit: 6,
    offset: 0,
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      /* Shake the input via state to signal an empty query */
      setShake(true);
      searchInputRef.current?.focus();
      setTimeout(() => setShake(false), 500);
      return;
    }
    setIsSearching(true);
    setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">House-by-us</span>
          </button>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <Skeleton className="h-8 w-24 rounded-md" />
            ) : isAuthenticated ? (
              <>
                <span className="hidden sm:block text-sm text-muted-foreground">
                  {user?.name}
                </span>

                {user?.role === "admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/admin/dashboard")}
                    className="gap-1.5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Admin
                  </Button>
                )}

                {user?.role === "landlord" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/landlord/dashboard")}
                    className="gap-1.5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    My Listings
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/sign-in")}
                >
                  Sign in
                </Button>
                <Button size="sm" onClick={() => setLocation("/search")}>
                  Browse houses
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Find Your Perfect Boarding House in Harare
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Discover quality accommodation near universities and colleges. Connect with verified
              landlords and find your ideal student home.
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Input
                  ref={searchInputRef}
                  placeholder="Search by location or area…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className={`flex-1 pr-4 transition-all${shake ? " animate-shake" : ""}`}
                />
              </div>
              <Button
                onClick={handleSearch}
                size="lg"
                className="gap-2 shrink-0"
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isSearching ? "Searching…" : "Search"}
              </Button>
            </div>

            {/* Empty-query hint — appears only when input is focused and empty */}
            {searchQuery === "" && (
              <p className="mt-3 text-xs text-muted-foreground/70">
                Try "Avondale", "near UZ", or leave blank to browse all listings
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Why Choose House-by-us?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Prime Locations</h3>
              </div>
              <p className="text-muted-foreground">
                Browse boarding houses near all major universities and colleges in Harare with
                interactive maps.
              </p>
            </Card>

            <Card className="p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Verified Listings</h3>
              </div>
              <p className="text-muted-foreground">
                All listings are reviewed and approved by our admin team after physical inspection
                and payment verification.
              </p>
            </Card>

            <Card className="p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Direct Contact</h3>
              </div>
              <p className="text-muted-foreground">
                Connect directly with landlords, view detailed photos and videos, and make informed
                decisions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Featured Listings</h2>
            <Button variant="ghost" onClick={() => setLocation("/search")} className="gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredListings && featuredListings.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <Card
                  key={listing.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group border border-border"
                  onClick={() => setLocation(`/listing/${listing.id}`)}
                >
                  <ListingImage listing={listing} />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-1">{listing.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ${listing.pricePerMonth}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </span>
                      {listing.numberOfRooms && (
                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                          {listing.numberOfRooms} {listing.numberOfRooms === 1 ? "room" : "rooms"}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Empty state when data loads but is empty */
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/30">
              <div className="w-14 h-14 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                <HomeIcon className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">No listings yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                Check back soon — new properties are added regularly.
              </p>
              <Button variant="outline" size="sm" onClick={() => setLocation("/search")}>
                Browse all listings
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to List Your Property?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Landlords can easily upload their boarding houses and reach hundreds of students
              looking for quality accommodation.
            </p>
            <Button
              size="lg"
              onClick={() =>
                isAuthenticated
                  ? setLocation("/landlord/register")
                  : setLocation("/sign-in")
              }
              className="gap-2"
            >
              {isAuthenticated ? "Become a Landlord" : "Sign in to get started"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-card border-t border-border py-12 mt-auto">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                  <HomeIcon className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold">House-by-us</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connecting students with quality boarding accommodation in Harare.
              </p>
            </div>

            {/* Quick Links — only pages that exist */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                Navigate
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setLocation("/search")}
                    className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0"
                  >
                    Browse listings
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLocation("/landlord/register")}
                    className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0"
                  >
                    List your property
                  </button>
                </li>
                {!isAuthenticated && (
                  <li>
                    <button
                      onClick={() => setLocation("/sign-in")}
                      className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0"
                    >
                      Sign in
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Contact — real phone numbers, no dead links */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                Contact us
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-muted-foreground">
                    <p className="font-medium text-foreground">Makhosi Mathe</p>
                    <a
                      href="tel:+2630781482977"
                      className="hover:text-primary transition-colors"
                    >
                      0781 482 977
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-muted-foreground">
                    <p className="font-medium text-foreground">Vimbai Tipedze</p>
                    <a
                      href="tel:+2630774497837"
                      className="hover:text-primary transition-colors"
                    >
                      0774 497 837
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            {/* Legal — plain text, no dead links */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                Legal
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All listings are independently verified by our admin team. House-by-us does not
                guarantee tenancy or manage payments.
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>© 2026 House-by-us. All rights reserved.</p>
            <p>Harare, Zimbabwe</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
