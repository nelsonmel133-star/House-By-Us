import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

/* ── Per-field validation ── */
function validateForm(data: {
  phoneNumber: string;
  bankAccountNumber: string;
}) {
  const errors: Record<string, string> = {};

  if (!data.phoneNumber.trim()) {
    errors.phoneNumber = "Phone number is required.";
  } else if (!/^\+?[0-9\s\-]{7,15}$/.test(data.phoneNumber.trim())) {
    errors.phoneNumber = "Enter a valid phone number (e.g. +263781234567).";
  }

  if (
    data.bankAccountNumber.trim() &&
    !/^[0-9]{6,20}$/.test(data.bankAccountNumber.trim())
  ) {
    errors.bankAccountNumber = "Account number must be 6–20 digits.";
  }

  return errors;
}

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    /* Clear the per-field error as the user corrects their input */
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await registerMutation.mutateAsync(formData);
    } catch (err) {
      setError("Registration failed. Please try again.");
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
      <div className="container max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Become a Landlord</h1>
          <p className="text-muted-foreground">
            Register your boarding house and start reaching students across Harare.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Contact Details card ── */}
          <Card className="p-6 space-y-5">
            <h2 className="text-lg font-semibold">Contact Details</h2>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Company Name <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                name="companyName"
                placeholder="My Boarding Houses"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <Input
                name="phoneNumber"
                type="tel"
                placeholder="+263781234567"
                value={formData.phoneNumber}
                onChange={handleChange}
                aria-invalid={!!fieldErrors.phoneNumber}
                className={fieldErrors.phoneNumber ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {fieldErrors.phoneNumber && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.phoneNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Alternate Phone <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                name="alternatePhone"
                type="tel"
                placeholder="+263774567890"
                value={formData.alternatePhone}
                onChange={handleChange}
              />
            </div>
          </Card>

          {/* ── Bank Details card ── */}
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold mb-1">Bank Account Details</h2>
              <p className="text-sm text-muted-foreground">
                Optional — you can add these later from your dashboard. If provided, we'll use them to transfer your earnings.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Account Holder Name <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                name="bankAccountName"
                placeholder="John Doe"
                value={formData.bankAccountName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Account Number <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                name="bankAccountNumber"
                placeholder="1234567890"
                value={formData.bankAccountNumber}
                onChange={handleChange}
                aria-invalid={!!fieldErrors.bankAccountNumber}
                className={fieldErrors.bankAccountNumber ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {fieldErrors.bankAccountNumber ? (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.bankAccountNumber}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">Digits only, no spaces or dashes.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Bank Name <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                name="bankName"
                placeholder="ZB Bank"
                value={formData.bankName}
                onChange={handleChange}
              />
            </div>
          </Card>

          {/* ── Next steps note ── */}
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p>
              <strong className="text-foreground">Next steps:</strong> After registration you'll be able to create and submit listings for admin review.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/")}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Registering..." : "Register as Landlord"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
