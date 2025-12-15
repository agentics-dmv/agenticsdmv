import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/PageLayout";

const Join = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setLoading(false);
    toast({
      title: "You're on the list",
      description: "We'll be in touch soon with updates.",
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
              We send occasional updates about events, reading groups, and 
              interesting developments in agentic AI. No spam, no algorithms—just 
              thoughtful content when we have something worth sharing.
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
                    htmlFor="name" 
                    className="block text-caption text-muted-foreground mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-background border border-border text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-subtle"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-caption text-muted-foreground mb-2"
                  >
                    Email
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

            <div className="mt-16 pt-16 border-t border-divider">
              <h2 className="text-body font-medium text-foreground mb-4">
                Other ways to connect
              </h2>
              <ul className="space-y-3 text-body text-muted-foreground">
                <li>
                  <a 
                    href="mailto:hello@agenticsva.org"
                    className="hover:text-foreground transition-subtle"
                  >
                    Email us directly at hello@agenticsva.org
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/agentics"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-subtle"
                  >
                    Contribute on GitHub
                  </a>
                </li>
                <li>
                  <span>Drop by one of our events—no signup required</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Join;
