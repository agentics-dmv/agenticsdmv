import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageLayout from "@/components/PageLayout";

const Index = () => {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="min-h-[calc(100vh-3.5rem)] flex items-center">
        <div className="container">
          <div className="max-w-3xl">
            <p 
              className="text-label uppercase text-primary mb-6 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              DC · Maryland · Virginia
            </p>
            <h1 
              className="text-display text-foreground mb-8 opacity-0 animate-fade-in text-balance"
              style={{ animationDelay: "0.2s" }}
            >
              Agentics DMV
            </h1>
            <p 
              className="text-body-lg text-muted-foreground max-w-xl mb-12 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              We're a community of researchers, builders, and curious minds exploring 
              agentic systems with care, rigor, and a commitment to beneficial outcomes.
            </p>
            <div 
              className="flex flex-wrap gap-4 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <Link 
                to="/events" 
                className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground text-caption font-medium hover:bg-primary/90 transition-subtle"
              >
                View events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brief intro */}
      <section className="py-30 border-t border-divider">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24">
            <div>
              <p className="text-label uppercase text-primary mb-4">What we do</p>
              <h2 className="text-heading text-foreground">
                A local home for agentic AI research
              </h2>
            </div>
            <div className="space-y-6">
              <p className="text-body text-muted-foreground">
                Agentics DMV connects practitioners, researchers, and learners 
                across DC, Maryland, and Virginia who share an interest in 
                autonomous AI systems. We host monthly meetups, reading groups, 
                and collaborative projects.
              </p>
              <Link 
                to="/about" 
                className="inline-flex items-center gap-2 text-caption text-primary hover:text-primary/80 transition-subtle"
              >
                Read our charter
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default Index;
