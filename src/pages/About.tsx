import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageLayout from "@/components/PageLayout";

const About = () => {
  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-label uppercase text-primary mb-4">What we do</p>
            <h1 className="text-display-sm text-foreground mb-8">
              The Applied Agentic Guild
            </h1>

            <div className="space-y-6 text-body text-muted-foreground">
              <p>
                Agentics DMV connects engineers across DC, Maryland, and Virginia 
                who build autonomous AI systems—specifically within high-compliance 
                and regulated environments.
              </p>

              <p>
                We're the "anti-conference"—no suits, no sales decks, just builders 
                sharing code and solving real problems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Focus Areas */}
      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="text-heading text-foreground mb-8">Focus Areas</h2>
            <div className="space-y-6 text-body text-muted-foreground">
              <div>
                <h3 className="text-body font-medium text-foreground mb-2">Local & Private AI</h3>
                <p>Air-gapped deployment, local LLMs, avoiding API calls due to data leakage concerns.</p>
              </div>
              <div>
                <h3 className="text-body font-medium text-foreground mb-2">Compliance-First Agents</h3>
                <p>Agent workflows in regulated environments—government, healthcare, finance.</p>
              </div>
              <div>
                <h3 className="text-body font-medium text-foreground mb-2">Model Governance</h3>
                <p>Securing agentic workflows, audit trails, and responsible deployment patterns.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Don't Do */}
      <section className="py-16 border-t border-divider bg-card">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="text-heading text-foreground mb-6">What We Don't Do</h2>
            <ul className="space-y-3 text-body text-muted-foreground">
              <li>• Sales pitches or vendor demos</li>
              <li>• Generic "AI policy" panels</li>
              <li>• Consultant networking events</li>
              <li>• Hype without code</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Charter Link */}
      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-body text-muted-foreground mb-4">
              Agentics DMV is a chapter of the{" "}
              <a
                href="https://agentics.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-subtle"
              >
                Agentics Foundation
              </a>
              .
            </p>
            <Link 
              to="/code-of-conduct" 
              className="inline-flex items-center gap-2 text-caption text-primary hover:text-primary/80 transition-subtle"
            >
              Read our charter
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
