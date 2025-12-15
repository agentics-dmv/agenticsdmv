import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255),
});

const Join = () => {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate email
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      setLoading(false);
      return;
    }

    // Check consent
    if (!consent) {
      setError("Please confirm you want to receive updates.");
      setLoading(false);
      return;
    }

    // Insert into members table
    const { error: insertError } = await supabase
      .from("members")
      .insert({
        email: validation.data.email,
        consent: true,
      });

    if (insertError) {
      // Handle duplicate email
      if (insertError.code === "23505") {
        setError("This email is already on our list.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
    toast({
      title: "You're on the list",
      description: "We'll be in touch when we have something worth sharing.",
    });
  };

  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-xl mx-auto">
            <p className="text-label uppercase text-primary mb-4">Join</p>
            <h1 className="text-display-sm text-foreground mb-6">
              Stay in the loop
            </h1>
            <p className="text-body-lg text-muted-foreground mb-12">
              We'll only email you if absolutely necessary.
            </p>

            {submitted ? (
              <div className="p-8 bg-card border border-divider">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check size={16} className="text-primary" />
                  </div>
                  <h2 className="text-body font-medium text-foreground">
                    You're signed up
                  </h2>
                </div>
                <p className="text-body text-muted-foreground">
                  Thanks for joining. We'll be in touch when we have something
                  worth sharing—expect to hear from us before the next event.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-caption text-muted-foreground mb-2"
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-background border border-border text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-subtle"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 border-border text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="consent"
                    className="text-caption text-muted-foreground cursor-pointer"
                  >
                    I want to receive email updates about Agentics DMV events and
                    announcements. You can unsubscribe at any time.
                  </label>
                </div>

                {error && (
                  <p className="text-caption text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-caption font-medium hover:bg-primary/90 disabled:opacity-50 transition-subtle"
                >
                  {loading ? "Joining..." : "Join the mailing list"}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Join;
