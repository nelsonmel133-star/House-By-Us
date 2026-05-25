import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Home as HomeIcon, Users, CheckCircle, ArrowRight, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: featuredListings, isLoading } = trpc.listings.getApproved.useQuery({ limit: 6, offset: 0 });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation("/search");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <HomeIcon className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">House-by-us</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">{user?.name}</span>
                {user?.role === "admin" && (
                  <Button variant="outline" size="sm" onClick={() => setLocation("/admin")}>
                    Admin Dashboard
                  </Button>
                )}
                {user?.role === "landlord" && (
                  <Button variant="outline" size="sm" onClick={() => setLocation("/landlord/dashboard")}>
                    My Listings
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setLocation("/profile")}>
                  Profile
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setLocation("/search")}>
                Browse Houses
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Find Your Perfect Boarding House in Harare
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Discover quality accommodation near universities and colleges. Connect with verified landlords and find your ideal student home.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <Input
                placeholder="Search by location, price, or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="lg" className="gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Choose House-by-us?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Prime Locations</h3>
              </div>
              <p className="text-muted-foreground">
                Browse boarding houses near all major universities and colleges in Harare with interactive maps.
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
                All listings are reviewed and approved by our admin team after physical inspection and payment verification.
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
                Connect directly with landlords, view detailed photos and videos, and make informed decisions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
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
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="h-64 bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredListings?.map((listing) => (
                <Card
                  key={listing.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => setLocation(`/listing/${listing.id}`)}
                >
                  <div className="h-48 bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <HomeIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{listing.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{listing.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ${listing.pricePerMonth}/month
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {listing.numberOfRooms} rooms
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to List Your Property?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Landlords can easily upload their boarding houses and reach hundreds of students looking for quality accommodation.
            </p>
            <Button size="lg" onClick={() => setLocation("/landlord/register")} className="gap-2">
              Become a Landlord <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HomeIcon className="w-5 h-5 text-primary" />
                <span className="font-bold">House-by-us</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting students with quality boarding accommodation in Harare.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setLocation("/search")} className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0">Browse Listings</button></li>
                <li><button onClick={() => setLocation("/landlord/register")} className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0">For Landlords</button></li>
                <li><button onClick={() => setLocation("/about")} className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0">About Us</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setLocation("/contact")} className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0">Help Center</button></li>
                <li><button onClick={() => setLocation("/contact")} className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0">Contact Us</button></li>
                <li><button onClick={() => setLocation("/privacy")} className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0">Privacy Policy</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Admin Contact</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Makhosi Mathe</strong><br />
                0781482977
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Vimbai Tipedze</strong><br />
                0774497837
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 House-by-us. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
