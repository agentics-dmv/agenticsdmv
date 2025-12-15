import { ArrowRight } from "lucide-react";

const Community = () => {
  return (
    <section id="community" className="py-30 border-t border-divider">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-label uppercase text-primary mb-4">Community</p>
          <h2 className="text-display-sm text-foreground mb-6">
            Curious? Come say hello.
          </h2>
          <p className="text-body-lg text-muted-foreground mb-10">
            Whether you're a seasoned researcher or just starting to explore 
            AI, there's a place for you here. We value questions as much as answers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:hello@agenticsva.org" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-caption font-medium hover:bg-primary/90 transition-subtle"
            >
              Get in touch
              <ArrowRight size={16} />
            </a>
            <a 
              href="https://discord.gg/agentics" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground text-caption font-medium hover:bg-secondary transition-subtle"
            >
              Join Discord
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community;
