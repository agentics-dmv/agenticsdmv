import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

const About = () => {
  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-label uppercase text-primary mb-4">About</p>
            <h1 className="text-display-sm text-foreground mb-8">
              Why we exist
            </h1>

            <div className="space-y-8 text-body text-muted-foreground">
              <p>
                Agentic AI is developing quickly. Most of what you read online is either 
                breathless hype or dismissive skepticism. Neither is useful if you actually 
                want to understand what these systems can do, what they cannot, and where 
                things are heading.
              </p>
              
              <p>
                Agentics VA is a place for people in the DC-Virginia area who want to 
                think carefully about autonomous AI systems. We read papers, build things, 
                ask hard questions, and share what we learn. No pitches, no thought 
                leadership, no growth metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="max-w-2xl space-y-12">
            
            {/* Scope */}
            <div>
              <h2 className="text-heading text-foreground mb-4">What we focus on</h2>
              <div className="space-y-4 text-body text-muted-foreground">
                <p>
                  Agentic systems: AI that takes actions, uses tools, makes decisions 
                  over multiple steps. This includes research on agent architectures, 
                  practical engineering challenges, and the safety considerations that 
                  come with giving AI more autonomy.
                </p>
                <p>
                  We cover the spectrum from accessible introductions to deep technical 
                  discussions, depending on the event. We note the expected level so you 
                  can choose what fits.
                </p>
              </div>
            </div>

            {/* What we do */}
            <div>
              <h2 className="text-heading text-foreground mb-4">How we meet</h2>
              <ul className="space-y-3 text-body text-muted-foreground">
                <li>
                  <span className="text-foreground">Reading groups</span> — We pick a 
                  paper, everyone reads it beforehand, we discuss.
                </li>
                <li>
                  <span className="text-foreground">Workshops</span> — Hands-on 
                  sessions where we build something together.
                </li>
                <li>
                  <span className="text-foreground">Talks</span> — Someone presents 
                  their work or a topic they know well. Q&A follows.
                </li>
                <li>
                  <span className="text-foreground">Informal meetups</span> — Show 
                  what you are working on, ask questions, connect.
                </li>
              </ul>
              <p className="mt-4 text-body text-muted-foreground">
                Events are free and open. We record most sessions and post them publicly.
              </p>
            </div>

            {/* Expectations */}
            <div>
              <h2 className="text-heading text-foreground mb-4">What we expect</h2>
              <div className="space-y-4 text-body text-muted-foreground">
                <p>
                  Treat others with respect. Disagree with ideas, not people. If you 
                  are new, say so—nobody expects you to know everything. If you are 
                  experienced, remember that you were once new.
                </p>
                <p>
                  Come prepared when preparation is expected. For reading groups, 
                  that means reading the paper. For workshops, that means having 
                  the prerequisites set up.
                </p>
                <p>
                  Say "I don't know" when you don't know. Speculation is fine if 
                  you label it as such. Pretending to expertise you lack wastes 
                  everyone's time.
                </p>
              </div>
            </div>

            {/* What we are not */}
            <div>
              <h2 className="text-heading text-foreground mb-4">What this is not</h2>
              <div className="space-y-4 text-body text-muted-foreground">
                <p>
                  This is not a networking event, a recruiting pipeline, or a place 
                  to promote your startup. It is not a social media community. We 
                  have no engagement metrics because we do not measure engagement.
                </p>
                <p>
                  We are not here to convince anyone that AI is amazing or terrible. 
                  We are here to understand it better.
                </p>
              </div>
            </div>

            {/* Affiliation */}
            <div>
              <h2 className="text-heading text-foreground mb-4">Affiliation</h2>
              <p className="text-body text-muted-foreground">
                Agentics VA is a chapter of the{" "}
                <a
                  href="https://agentics.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-subtle"
                >
                  Agentics Foundation
                </a>
                , a nonprofit focused on agentic AI research and education. We operate 
                locally with our own programming, aligned with the Foundation's values.
              </p>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <p className="text-body text-muted-foreground mb-4">
                If this sounds like your kind of thing:
              </p>
              <Link
                to="/join"
                className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground text-caption font-medium hover:bg-primary/90 transition-subtle"
              >
                Join the mailing list
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
