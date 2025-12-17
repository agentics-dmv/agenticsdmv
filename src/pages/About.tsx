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
              A local home for agentic AI research
            </h1>

            <div className="space-y-6 text-body text-muted-foreground">
              <p>
                Agentics DMV connects practitioners, researchers, and learners 
                across DC, Maryland, and Virginia who share an interest in 
                autonomous AI systems. We host monthly meetups, reading groups, 
                and collaborative projects.
              </p>

              <p>
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
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
