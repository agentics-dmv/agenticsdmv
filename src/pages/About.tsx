import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

const About = () => {
  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-label uppercase text-primary mb-4">About</p>
            <h1 className="text-display-sm text-foreground mb-6">
              Our charter
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Agentics VA exists to support a local, thoughtful technical community. 
              Here's what we believe and how we operate.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="max-w-3xl space-y-16">
            {/* Mission */}
            <div>
              <h2 className="text-heading text-foreground mb-6">Mission</h2>
              <div className="space-y-4 text-body text-muted-foreground">
                <p>
                  We are the Virginia chapter of the Agentics Foundation, a nonprofit 
                  dedicated to advancing the science and practice of agentic artificial 
                  intelligence.
                </p>
                <p>
                  Our mission is to foster a community of researchers, engineers, and 
                  learners who explore autonomous AI systems with care, rigor, and a 
                  commitment to beneficial outcomes.
                </p>
              </div>
            </div>

            {/* Values */}
            <div>
              <h2 className="text-heading text-foreground mb-6">Values</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-body font-medium text-foreground mb-2">
                    Intellectual honesty
                  </h3>
                  <p className="text-body text-muted-foreground">
                    We say what we believe and update our views when presented with 
                    better evidence. We acknowledge uncertainty and avoid hype.
                  </p>
                </div>
                <div>
                  <h3 className="text-body font-medium text-foreground mb-2">
                    Openness
                  </h3>
                  <p className="text-body text-muted-foreground">
                    Our events are free. Our discussions are accessible to newcomers. 
                    We share what we learn openly with the broader community.
                  </p>
                </div>
                <div>
                  <h3 className="text-body font-medium text-foreground mb-2">
                    Long-term thinking
                  </h3>
                  <p className="text-body text-muted-foreground">
                    We're building something that lasts. We prioritize depth over 
                    engagement metrics and relationships over transactions.
                  </p>
                </div>
                <div>
                  <h3 className="text-body font-medium text-foreground mb-2">
                    Respect
                  </h3>
                  <p className="text-body text-muted-foreground">
                    We treat everyone with dignity, regardless of their background or 
                    expertise level. Disagreement is welcome; disrespect is not.
                  </p>
                </div>
              </div>
            </div>

            {/* What we do */}
            <div>
              <h2 className="text-heading text-foreground mb-6">What we do</h2>
              <div className="space-y-4 text-body text-muted-foreground">
                <p>
                  <strong className="text-foreground">Monthly meetups</strong> — 
                  Informal gatherings where members share what they're working on, 
                  ask questions, and connect with others in the community.
                </p>
                <p>
                  <strong className="text-foreground">Reading groups</strong> — 
                  Deep dives into important papers and concepts, with structured 
                  discussion and shared notes.
                </p>
                <p>
                  <strong className="text-foreground">Workshops</strong> — 
                  Hands-on sessions where participants learn practical skills, from 
                  prompt engineering to building multi-agent systems.
                </p>
                <p>
                  <strong className="text-foreground">Talks</strong> — 
                  Presentations from local researchers, engineers, and visiting 
                  experts on topics relevant to agentic AI.
                </p>
              </div>
            </div>

            {/* What we're not */}
            <div>
              <h2 className="text-heading text-foreground mb-6">What we're not</h2>
              <div className="space-y-4 text-body text-muted-foreground">
                <p>
                  We are not a social network, a content feed, or a platform. We 
                  don't optimize for engagement or growth.
                </p>
                <p>
                  We are not a recruiting pipeline for any company or organization. 
                  Members are welcome to discuss job opportunities, but that's not 
                  our purpose.
                </p>
                <p>
                  We are not a hype machine. We try to maintain realistic expectations 
                  about both the capabilities and limitations of current AI systems.
                </p>
              </div>
            </div>

            {/* Affiliation */}
            <div>
              <h2 className="text-heading text-foreground mb-6">Affiliation</h2>
              <div className="space-y-4 text-body text-muted-foreground">
                <p>
                  Agentics VA is an official chapter of the{" "}
                  <a 
                    href="https://agentics.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-subtle"
                  >
                    Agentics Foundation
                  </a>
                  , a 501(c)(3) nonprofit organization dedicated to advancing agentic 
                  AI research and education.
                </p>
                <p>
                  We operate with significant local autonomy while aligning with the 
                  Foundation's broader mission and values.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-8">
              <p className="text-body text-muted-foreground mb-4">
                Questions about our chapter? Want to get involved?
              </p>
              <Link 
                to="/join" 
                className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground text-caption font-medium hover:bg-primary/90 transition-subtle"
              >
                Join the community
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
