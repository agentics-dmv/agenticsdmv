const Hero = () => {
  return (
    <section className="min-h-screen flex items-center pt-14">
      <div className="container">
        <div className="max-w-3xl">
          <p 
            className="text-label uppercase text-primary mb-6 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Virginia Chapter
          </p>
          <h1 
            className="text-display text-foreground mb-8 opacity-0 animate-fade-in text-balance"
            style={{ animationDelay: "0.2s" }}
          >
            Building thoughtful AI, together.
          </h1>
          <p 
            className="text-body-lg text-muted-foreground max-w-xl mb-12 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            We're a community of researchers, builders, and curious minds exploring 
            agentic systems with care, rigor, and a commitment to beneficial outcomes.
          </p>
          <div 
            className="flex gap-4 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <a 
              href="#community" 
              className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground text-caption font-medium hover:bg-primary/90 transition-subtle"
            >
              Join the conversation
            </a>
            <a 
              href="#about" 
              className="inline-flex items-center px-5 py-2.5 border border-border text-foreground text-caption font-medium hover:bg-secondary transition-subtle"
            >
              Learn more
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
