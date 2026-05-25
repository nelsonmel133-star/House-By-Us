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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
