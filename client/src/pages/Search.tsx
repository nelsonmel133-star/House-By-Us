import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home as HomeIcon,
  MapPin,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  SearchX,
  Wifi,
  Droplets,
  ShieldCheck,
  Car,
  WashingMachine,
  UtensilsCrossed,
  Sofa,
  Wind,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/* ── Constants ── */
const ITEMS_PER_PAGE = 12;

const SERVICES = [
  { label: "WiFi",            icon: Wifi },
  { label: "Water",           icon: Droplets },
  { label: "Security",        icon: ShieldCheck },
  { label: "Parking",         icon: Car },
  { label: "Laundry",         icon: WashingMachine },
  { label: "Kitchen",         icon: UtensilsCrossed },
  { label: "Furnished",       icon: Sofa },
  { label: "Air Conditioning",icon: Wind },
] as const;

/* ── Listing image with fallback ── */
function ListingImage({ listing }: { listing: any }) {
  const [errored, setErrored] = useState(false);
  const firstImg = listing.media?.find((m: any) => m.type === "image");

  if (firstImg && !errored) {
    return (
      <div className="aspect-video overflow-hidden bg-muted">
        <img
          src={firstImg.url}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setErrored(true)}
        />
      </div>
    );
  }

  return (
    <div className="aspect-video bg-gradient-to-br from-primary/8 via-primary/5 to-muted flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg,currentColor 0,currentColor 1px,transparent 0,transparent 50%)",
          backgroundSize: "10px 10px",
        }}
      />
      <div className="flex flex-col items-center gap-1.5 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
          <HomeIcon className="w-6 h-6 text-primary/40" />
        </div>
        <span className="text-[11px] text-muted-foreground/50 font-medium tracking-wide">
          No photo yet
        </span>
      </div>
    </div>
  );
}

/* ── Card skeleton ── */
function CardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex gap-1 pt-0.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function Search() {
  const { isAuthenticated, user, logout } = useAuth();
  const [, setLocation] = useLocation();

  /* Read ?q= from URL on mount */
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });

  const [minPrice, setMinPrice]             = useState("");
  const [maxPrice, setMaxPrice]             = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [sortBy, setSortBy]                 = useState<"newest" | "price-low" | "price-high">("newest");
  const [showFilters, setShowFilters]       = useState(false);
  const [page, setPage]                     = useState(0);

  /* Reset to page 0 whenever filters change */
  useEffect(() => { setPage(0); }, [searchQuery, minPrice, maxPrice, selectedServices, sortBy]);

  /* Close mobile filter drawer on resize to desktop */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setShowFilters(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Server-side pagination ── */
  const { data: listings, isLoading, isFetching } = trpc.listings.search.useQuery({
    location: searchQuery || undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    services: selectedServices.length > 0 ? selectedServices : undefined,
    sortBy,
    limit: ITEMS_PER_PAGE,
    offset: page * ITEMS_PER_PAGE,
  });

  /* Has next page if we got a full page back */
  const hasNextPage = (listings?.length ?? 0) === ITEMS_PER_PAGE;
  const hasPrevPage = page > 0;

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedServices([]);
    setSortBy("newest");
    setPage(0);
  };

  const hasActiveFilters =
    searchQuery || minPrice || maxPrice || selectedServices.length > 0 || sortBy !== "newest";

  const activeFilterCount = [
    searchQuery,
    minPrice || maxPrice,
    selectedServices.length > 0 ? "x" : "",
    sortBy !== "newest" ? "x" : "",
  ].filter(Boolean).length;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Nav bar ── */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-14 gap-3">
          {/* Logo */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-base hidden sm:block">House-by-us</span>
          </button>

          {/* Inline search — desktop */}
          <div className="hidden md:flex flex-1 max-w-sm items-center">
            <Input
              placeholder="Search location…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(0)}
              className="h-8 text-sm"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="lg:hidden gap-1.5 relative"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {isAuthenticated ? (
              <>
                {user?.role === "landlord" && (
                  <Button variant="outline" size="sm" onClick={() => setLocation("/landlord/dashboard")} className="hidden sm:flex">
                    My listings
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={async () => { await logout(); setLocation("/"); }} className="text-muted-foreground hidden sm:flex">
                  Sign out
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setLocation("/sign-in")}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile filter drawer + overlay ── */}
      {showFilters && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] bg-background shadow-2xl flex flex-col lg:hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="font-semibold">Filters</span>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterPanel
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                selectedServices={selectedServices}
                onServiceToggle={handleServiceToggle}
                sortBy={sortBy}
                setSortBy={setSortBy}
                hasActiveFilters={!!hasActiveFilters}
                onClear={handleClearFilters}
              />
            </div>
            <div className="border-t border-border px-5 py-4">
              <Button className="w-full" onClick={() => setShowFilters(false)}>
                Show results
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── Page body ── */}
      <div className="container py-6 flex-1">

        {/* Mobile search bar */}
        <div className="md:hidden mb-4">
          <Input
            placeholder="Search location…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setPage(0)}
          />
        </div>

        <div className="flex gap-6">

          {/* ── Desktop sidebar ── */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-20 border border-border rounded-xl p-5 space-y-5 bg-card">
              <FilterPanel
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                selectedServices={selectedServices}
                onServiceToggle={handleServiceToggle}
                sortBy={sortBy}
                setSortBy={setSortBy}
                hasActiveFilters={!!hasActiveFilters}
                onClear={handleClearFilters}
              />
            </div>
          </aside>

          {/* ── Results ── */}
          <main className="flex-1 min-w-0">

            {/* Sort bar — desktop only (sidebar has it on mobile) */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading || isFetching
                  ? "Loading…"
                  : listings && listings.length > 0
                  ? `Page ${page + 1} · ${listings.length} listing${listings.length !== 1 ? "s" : ""}`
                  : "No listings found"}
              </p>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as typeof sortBy)}
              >
                <SelectTrigger className="w-44 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="price-low">Price: low to high</SelectItem>
                  <SelectItem value="price-high">Price: high to low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {searchQuery && (
                  <Chip label={`"${searchQuery}"`} onRemove={() => setSearchQuery("")} />
                )}
                {(minPrice || maxPrice) && (
                  <Chip
                    label={`$${minPrice || "0"} – $${maxPrice || "∞"}`}
                    onRemove={() => { setMinPrice(""); setMaxPrice(""); }}
                  />
                )}
                {selectedServices.map((s) => (
                  <Chip key={s} label={s} onRemove={() => handleServiceToggle(s)} />
                ))}
                {sortBy !== "newest" && (
                  <Chip
                    label={sortBy === "price-low" ? "Price ↑" : "Price ↓"}
                    onRemove={() => setSortBy("newest")}
                  />
                )}
              </div>
            )}

            {/* Grid */}
            {isLoading || isFetching ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : listings && listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {listings.map((listing) => (
                    <Card
                      key={listing.id}
                      className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group border border-border"
                      onClick={() => setLocation(`/listing/${listing.id}`)}
                    >
                      <ListingImage listing={listing} />

                      <div className="p-4">
                        <h3 className="font-semibold mb-1.5 line-clamp-2 group-hover:text-primary transition-colors text-sm leading-snug">
                          {listing.title}
                        </h3>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="line-clamp-1">{listing.address}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary text-base">
                            ${listing.pricePerMonth}
                            <span className="text-xs font-normal text-muted-foreground">/mo</span>
                          </span>
                          {listing.numberOfRooms && (
                            <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              {listing.numberOfRooms} {listing.numberOfRooms === 1 ? "room" : "rooms"}
                            </span>
                          )}
                        </div>

                        {listing.services && listing.services.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {listing.services.slice(0, 3).map((s: string) => (
                              <Badge key={s} variant="secondary" className="text-[11px] px-1.5 py-0">
                                {s}
                              </Badge>
                            ))}
                            {listing.services.length > 3 && (
                              <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                                +{listing.services.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {(hasPrevPage || hasNextPage) && (
                  <div className="flex items-center justify-between border-t border-border pt-5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={!hasPrevPage}
                      className="gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {page + 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!hasNextPage}
                      className="gap-1.5"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-border rounded-2xl bg-muted/20">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <SearchX className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No listings found</h3>
                {hasActiveFilters ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                      No properties match your current filters. Try widening your search or clearing some criteria.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                      Clear all filters
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground max-w-xs">
                    There are no approved listings yet. Check back soon — new properties are added regularly.
                  </p>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ── Active filter chip ── */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

/* ── Shared filter panel (used in both sidebar and drawer) ── */
interface FilterPanelProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  minPrice: string;
  setMinPrice: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  selectedServices: string[];
  onServiceToggle: (s: string) => void;
  sortBy: "newest" | "price-low" | "price-high";
  setSortBy: (v: "newest" | "price-low" | "price-high") => void;
  hasActiveFilters: boolean;
  onClear: () => void;
}

function FilterPanel({
  searchQuery, setSearchQuery,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  selectedServices, onServiceToggle,
  sortBy, setSortBy,
  hasActiveFilters, onClear,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      {/* Header with clear */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Filters</span>
        {hasActiveFilters && (
          <button onClick={onClear} className="text-xs text-primary hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
          Location
        </label>
        <Input
          placeholder="e.g. Avondale, near UZ…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
          Price / month ($)
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-8 text-sm"
            min={0}
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-8 text-sm"
            min={0}
          />
        </div>
      </div>

      {/* Sort (visible in sidebar on mobile; hidden on desktop where header has it) */}
      <div className="lg:hidden">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
          Sort by
        </label>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-8 text-sm w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="price-low">Price: low to high</SelectItem>
            <SelectItem value="price-high">Price: high to low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Amenities
        </label>
        <div className="space-y-1">
          {SERVICES.map(({ label, icon: Icon }) => {
            const active = selectedServices.includes(label);
            return (
              <button
                key={label}
                onClick={() => onServiceToggle(label)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
