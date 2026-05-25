import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, DollarSign, Filter, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

const AVAILABLE_SERVICES = [
  "WiFi",
  "Water",
  "Security",
  "Parking",
  "Laundry",
  "Kitchen",
  "Furnished",
  "Air Conditioning",
];

export default function Search() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;

  const { data: listings, isLoading } = trpc.listings.search.useQuery({
    location: searchQuery || undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    services: selectedServices.length > 0 ? selectedServices : undefined,
    sortBy,
    limit: 1000,
    offset: 0,
  });

  const paginatedListings = useMemo(() => {
    if (!listings) return [];
    const start = currentPage * itemsPerPage;
    return listings.slice(start, start + itemsPerPage);
  }, [listings, currentPage]);

  const totalPages = listings ? Math.ceil(listings.length / itemsPerPage) : 0;

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedServices([]);
    setSortBy("newest");
    setCurrentPage(0);
  };

  const hasActiveFilters =
    searchQuery || minPrice || maxPrice || selectedServices.length > 0 || sortBy !== "newest";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Find Boarding Houses</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? "block" : "hidden"} lg:block lg:col-span-1`}>
            <Card className="p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Location Search */}
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    placeholder="Search location..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        setCurrentPage(0);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        setCurrentPage(0);
                      }}
                    />
                  </div>
                </div>

                {/* Services Filter */}
                <div>
                  <label className="block text-sm font-medium mb-3">Services</label>
                  <div className="space-y-2">
                    {AVAILABLE_SERVICES.map((service) => (
                      <button
                        key={service}
                        onClick={() => handleServiceToggle(service)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedServices.includes(service)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sorting */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as "newest" | "price-low" | "price-high");
                      setCurrentPage(0);
                    }}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* Listings Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading listings...</p>
              </div>
            ) : paginatedListings.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {currentPage * itemsPerPage + 1} to{" "}
                  {Math.min((currentPage + 1) * itemsPerPage, listings?.length || 0)} of{" "}
                  {listings?.length || 0} listings
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {paginatedListings.map((listing) => (
                    <Card
                      key={listing.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setLocation(`/listing/${listing.id}`)}
                    >
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Property Image</p>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">{listing.title}</h3>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{listing.address}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-lg">
                            ${listing.pricePerMonth}/month
                          </span>
                        </div>

                        {listing.services && listing.services.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {listing.services.slice(0, 2).map((service: string) => (
                              <Badge key={service} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                            {listing.services.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{listing.services.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        <Button className="w-full" size="sm">
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => (
                      <Button
                        key={i}
                        variant={currentPage === i ? "default" : "outline"}
                        onClick={() => setCurrentPage(i)}
                        size="sm"
                      >
                        {i + 1}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No listings found matching your criteria.
                </p>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
