import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import logoTransparent from "@/assets/logo-transparent.png";

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
            <img 
              src={logoTransparent} 
              alt="Agentics DMV logo" 
              className="w-48 md:w-64 h-auto mb-8 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.15s" }}
            />
            <h1
              className="text-display text-foreground mb-8 opacity-0 animate-fade-in text-balance"
              style={{ animationDelay: "0.2s" }}
            >
              Agentics DMV
            </h1>
            <p 
              className="text-body-lg text-muted-foreground max-w-xl mb-6 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              Engineers building autonomous systems in high-compliance environments.
            </p>
            <p 
              className="text-caption text-muted-foreground/70 max-w-xl mb-12 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.35s" }}
            >
              No suits. No sales. Just code.
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
    </PageLayout>
  );
};

export default Index;
