import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import logoTransparent from "@/assets/logo-transparent.png";
import { blogPosts } from "@/data/blog-posts";

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
              alt="DMV Applied AI logo" 
              className="w-48 md:w-64 h-auto mb-8 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.15s" }}
            />
            <h1
              className="text-display text-foreground mb-8 opacity-0 animate-fade-in text-balance"
              style={{ animationDelay: "0.2s" }}
            >
              DMV Applied AI
            </h1>
            <p 
              className="text-body-lg text-muted-foreground max-w-xl mb-6 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              A senior-level cohort discussing how modern AI systems actually work in practice.
            </p>
            <p 
              className="text-caption text-muted-foreground/70 max-w-xl mb-12 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.35s" }}
            >
              Small. Senior. Thoughtful.
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

      {/* Featured Series */}
      <section className="py-24 border-t border-divider">
        <div className="container max-w-2xl">
          <p className="text-label uppercase tracking-widest text-muted-foreground mb-4">Featured Series</p>
          <h2 className="text-display-sm mb-4">OpenClaw: Personal AI Assistant on AWS</h2>
          <p className="text-body-lg text-muted-foreground mb-12">
            A three-part series on building a 24/7 AI assistant on EC2 with Bedrock — what worked, what failed, and what the system became.
          </p>

          <img
            src="/blog/openclaw-system-architecture.png"
            alt="OpenClaw system architecture"
            className="w-full mb-12 border border-divider"
          />

          <div className="space-y-0">
            {blogPosts.map((post, index) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="block group"
              >
                <article className={`py-10 ${index < blogPosts.length - 1 ? "border-b border-divider" : ""}`}>
                  <p className="text-label uppercase tracking-widest text-muted-foreground mb-3">
                    Phase {post.part}
                  </p>
                  <h3 className="text-heading text-foreground mb-2 group-hover:text-primary transition-subtle">
                    {post.title}
                  </h3>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    {post.subtitle}
                  </p>
                </article>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <Link
              to="/blog"
              className="text-label uppercase tracking-widest text-muted-foreground hover:text-foreground transition-subtle"
            >
              View all writing →
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
