import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Phone, Mail, Home as HomeIcon, ChevronLeft, ChevronRight, Users, DoorOpen, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user, isAuthenticated } = useAuth();

  const { data: listing, isLoading } = trpc.listings.getById.useQuery(Number(id));
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    senderName: "",
    senderEmail: "",
    message: "",
  });

  /* Pre-fill contact form with authenticated user's details */
  useEffect(() => {
    if (isAuthenticated && user) {
      setContactForm((prev) => ({
        ...prev,
        senderName: prev.senderName || user.name || "",
        senderEmail: prev.senderEmail || user.email || "",
      }));
    }
  }, [isAuthenticated, user]);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState("");

  const contactMutation = trpc.contact.sendMessage.useMutation({
    onSuccess: () => {
      setContactSuccess(true);
      setContactForm({ senderName: "", senderEmail: "", message: "" });
      setTimeout(() => setContactSuccess(false), 3000);
    },
    onError: (err) => {
      setContactError(err.message);
    },
  });

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError("");

    try {
      await contactMutation.mutateAsync({
        listingId: Number(id),
        ...contactForm,
      });
    } catch (err) {
      setContactError("Failed to send message");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <HomeIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Listing not found</h1>
          <p className="text-muted-foreground mb-6">This listing may have been removed or is no longer available.</p>
          <Button onClick={() => window.history.back()}>Back to Search</Button>
        </div>
      </div>
    );
  }

  const images = listing.media?.filter((m) => m.type === "image") || [];
  const videos = listing.media?.filter((m) => m.type === "video") || [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (images.length || 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + (images.length || 1)) % (images.length || 1));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">{listing.title}</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Gallery */}
            <Card className="overflow-hidden mb-8">
              {images.length > 0 ? (
                <div className="relative bg-muted aspect-video flex items-center justify-center group">
                  <img
                    src={images[currentImageIndex]?.url || ""}
                    alt={`Gallery ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-muted aspect-video flex items-center justify-center">
                  <HomeIcon className="w-16 h-16 text-muted-foreground opacity-50" />
                </div>
              )}

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="flex gap-2 p-4 bg-card border-t border-border overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded border-2 transition-colors ${
                        idx === currentImageIndex ? "border-primary" : "border-border"
                      }`}
                    >
                      <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover rounded" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Description */}
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">About This Property</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
            </Card>

            {/* Services */}
            {listing.services && listing.services.length > 0 && (
              <Card className="p-6 mb-8">
                <h2 className="text-2xl font-bold mb-4">Services & Amenities</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {listing.services.map((service, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-primary/5 rounded">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Rules */}
            {listing.rules && (
              <Card className="p-6 mb-8">
                <h2 className="text-2xl font-bold mb-4">House Rules</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{listing.rules}</p>
              </Card>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Video Tour</h2>
                <div className="grid gap-4">
                  {videos.map((video, idx) => (
                    <div key={idx} className="aspect-video bg-muted rounded overflow-hidden">
                      <video
                        src={video.url}
                        controls
                        className="w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price Card */}
            <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
              <div className="text-4xl font-bold text-primary mb-2">
                ${listing.pricePerMonth}
              </div>
              <p className="text-muted-foreground mb-6">per month</p>

              <div className="space-y-3 mb-6">
                {listing.numberOfRooms && (
                  <div className="flex items-center gap-3">
                    <DoorOpen className="w-5 h-5 text-muted-foreground" />
                    <span>{listing.numberOfRooms} rooms available</span>
                  </div>
                )}
                {listing.occupancyPerRoom && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span>{listing.occupancyPerRoom} person{listing.occupancyPerRoom > 1 ? "s" : ""} per room</span>
                  </div>
                )}
              </div>

              <Button className="w-full mb-3" onClick={() => setShowContactForm(!showContactForm)}>
                Send Message
              </Button>
              <Button variant="outline" className="w-full">
                Save Listing
              </Button>
            </Card>

            {/* Location Card with Map */}
            {listing.latitude && listing.longitude && (
              <Card className="p-6 mb-6 overflow-hidden">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location
                </h3>
                <p className="text-muted-foreground mb-4">{listing.address}</p>
                <MapView
                  initialCenter={{
                    lat: parseFloat(listing.latitude.toString()),
                    lng: parseFloat(listing.longitude.toString()),
                  }}
                  initialZoom={15}
                  className="w-full h-48 rounded"
                  onMapReady={(map) => {
                    new google.maps.Marker({
                      position: {
                        lat: parseFloat(listing.latitude.toString()),
                        lng: parseFloat(listing.longitude.toString()),
                      },
                      map: map,
                      title: listing.title,
                    });
                  }}
                />
              </Card>
            )}
            {!listing.latitude && !listing.longitude && (
              <Card className="p-6 mb-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location
                </h3>
                <p className="text-muted-foreground">{listing.address}</p>
              </Card>
            )}

            {/* Contact Card */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Contact Landlord</h3>
              
              {listing.contactPhone && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Phone</span>
                  </div>
                  <a
                    href={`tel:${listing.contactPhone}`}
                    className="text-primary font-semibold hover:underline"
                  >
                    {listing.contactPhone}
                  </a>
                </div>
              )}

              {listing.contactEmail && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Email</span>
                  </div>
                  <a
                    href={`mailto:${listing.contactEmail}`}
                    className="text-primary font-semibold hover:underline break-all"
                  >
                    {listing.contactEmail}
                  </a>
                </div>
              )}

              <div className="mt-6 p-4 bg-muted rounded text-sm text-muted-foreground">
                <p>
                  <strong>Tip:</strong> Always verify the property in person and confirm all details with the landlord before making any payments.
                </p>
              </div>
            </Card>

            {/* Contact Form */}
            {showContactForm && (
              <Card className="p-6 mt-6">
                <h3 className="font-semibold mb-4">Send a Message</h3>

                {contactSuccess && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded flex gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-800">Message sent successfully!</p>
                  </div>
                )}

                {contactError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{contactError}</p>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Your Name</label>
                    <Input
                      name="senderName"
                      placeholder="John Doe"
                      value={contactForm.senderName}
                      onChange={handleContactChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Your Email</label>
                    <Input
                      name="senderEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={contactForm.senderEmail}
                      onChange={handleContactChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <textarea
                      name="message"
                      placeholder="I'm interested in this property..."
                      value={contactForm.message}
                      onChange={handleContactChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={3}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={contactMutation.isPending}>
                    {contactMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
