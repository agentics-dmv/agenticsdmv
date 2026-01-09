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
              Applied AI Systems Cohort
            </h1>

            <div className="space-y-6 text-body text-muted-foreground">
              <p>
                DMV Applied AI is a small, senior-level group under AI Ready RVA 
                focused on how modern AI systems actually work in practice—technically, 
                organizationally, and operationally.
              </p>

              <p>
                Each quarter, we gather experienced practitioners for structured 
                discussion. No slides. No sales. Just candid conversation among peers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Sessions Work */}
      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="text-heading text-foreground mb-8">How Sessions Work</h2>
            <div className="space-y-6 text-body text-muted-foreground">
              <p>
                Each session is led by a <strong className="text-foreground">Paper Sponsor</strong>—someone 
                who picks a public paper or white paper they find interesting or important.
              </p>
              <div className="space-y-4 pl-4 border-l-2 border-divider">
                <p>
                  <span className="text-foreground font-medium">10–15 minutes:</span> The sponsor 
                  frames why the paper matters
                </p>
                <p>
                  <span className="text-foreground font-medium">Remainder:</span> Structured 
                  discussion with the group
                </p>
              </div>
              <p>
                No slides required. No employer approval needed. You're not representing 
                an organization—just your own thinking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We're Looking For */}
      <section className="py-16 border-t border-divider bg-card">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="text-heading text-foreground mb-6">The Audience</h2>
            <ul className="space-y-3 text-body text-muted-foreground">
              <li>• Small—typically 10–15 people per session</li>
              <li>• Senior—experienced practitioners only</li>
              <li>• Thoughtful—here for depth, not networking</li>
              <li>• Candid—real discussion, not polish</li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI Ready RVA Link */}
      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-body text-muted-foreground mb-4">
              DMV Applied AI is a program of{" "}
              <a
                href="https://aireadyrva.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-subtle"
              >
                AI Ready RVA
              </a>
              .
            </p>
            <Link 
              to="/code-of-conduct" 
              className="inline-flex items-center gap-2 text-caption text-primary hover:text-primary/80 transition-subtle"
            >
              Read our code of conduct
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
