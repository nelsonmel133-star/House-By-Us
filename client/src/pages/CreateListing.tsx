import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, Upload, X, Info } from "lucide-react";
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

export default function CreateListing() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    pricePerMonth: "",
    numberOfRooms: "",
    occupancyPerRoom: "",
    services: [] as string[],
    rules: "",
    contactPhone: "",
    contactEmail: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const createMutation = trpc.listings.create.useMutation({
    onSuccess: () => {
      setLocation("/landlord/dashboard");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createMutation.mutateAsync({
        ...formData,
        pricePerMonth: parseFloat(formData.pricePerMonth),
        numberOfRooms: formData.numberOfRooms ? parseInt(formData.numberOfRooms) : undefined,
        occupancyPerRoom: formData.occupancyPerRoom ? parseInt(formData.occupancyPerRoom) : undefined,
        services: selectedServices,
      });
    } catch (err) {
      setError("Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== "landlord") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You must be logged in as a landlord to create listings.
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
      <div className="container max-w-3xl">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-2">Create New Listing</h1>
          <p className="text-muted-foreground mb-8">
            Add a new boarding house listing to our platform.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  name="title"
                  placeholder="Cozy 3-Bedroom Boarding House"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  name="description"
                  placeholder="Describe your boarding house, amenities, and what makes it special..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={5}
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Address *</label>
                <Input
                  name="address"
                  placeholder="123 Main Street, Harare"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Pricing & Details */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Pricing & Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price Per Month ($) *</label>
                  <Input
                    name="pricePerMonth"
                    type="number"
                    placeholder="300"
                    value={formData.pricePerMonth}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Number of Rooms</label>
                  <Input
                    name="numberOfRooms"
                    type="number"
                    placeholder="3"
                    value={formData.numberOfRooms}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Occupancy Per Room</label>
                  <Input
                    name="occupancyPerRoom"
                    type="number"
                    placeholder="2"
                    value={formData.occupancyPerRoom}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Available Services</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AVAILABLE_SERVICES.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleServiceToggle(service)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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

            {/* Rules */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">House Rules</h2>
              <textarea
                name="rules"
                placeholder="List any house rules or restrictions..."
                value={formData.rules}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                rows={4}
              />
            </div>

            {/* Contact Information */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <Input
                    name="contactPhone"
                    type="tel"
                    placeholder="+263781234567"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <Input
                    name="contactEmail"
                    type="email"
                    placeholder="contact@example.com"
                    value={formData.contactEmail}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Media Upload */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Media (Images & Videos)</h2>

              <div className="flex items-start gap-3 p-4 bg-muted/60 border border-border rounded-lg mb-4 text-sm text-muted-foreground">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <p>
                  Photo and video uploads are coming soon. For now, create your listing and our
                  team will contact you to collect media directly.
                </p>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center opacity-50 pointer-events-none select-none" aria-disabled="true">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  File upload not yet available
                </p>
                <Button type="button" variant="outline" size="sm" disabled>
                  Choose Files
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/landlord/dashboard")}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create Listing"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
