import { ExternalLink } from "lucide-react";
import PageLayout from "@/components/PageLayout";

const CodeOfConduct = () => {
  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-label uppercase text-primary mb-4">Community</p>
            <h1 className="text-display-sm text-foreground mb-6">
              Code of Conduct
            </h1>
            <p className="text-body-lg text-muted-foreground">
              These are the norms we follow. They are simple because we trust 
              each other to act in good faith.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="max-w-2xl space-y-10">
            
            {/* Expectations */}
            <div className="space-y-6">
              <div>
                <h2 className="text-body font-medium text-foreground mb-2">
                  Respect everyone
                </h2>
                <p className="text-body text-muted-foreground">
                  Treat people with dignity regardless of who they are, what they 
                  know, or what they believe. Disagreement is fine. Dismissiveness 
                  is not.
                </p>
              </div>

              <div>
                <h2 className="text-body font-medium text-foreground mb-2">
                  Assume good faith
                </h2>
                <p className="text-body text-muted-foreground">
                  When someone says something you disagree with, start by trying 
                  to understand their perspective. Most misunderstandings come from 
                  different contexts, not bad intentions.
                </p>
              </div>

              <div>
                <h2 className="text-body font-medium text-foreground mb-2">
                  Make room for others
                </h2>
                <p className="text-body text-muted-foreground">
                  Not everyone speaks up easily. If you tend to talk a lot, leave 
                  space. If you tend to stay quiet, know that your perspective is 
                  welcome.
                </p>
              </div>

              <div>
                <h2 className="text-body font-medium text-foreground mb-2">
                  Keep it honest
                </h2>
                <p className="text-body text-muted-foreground">
                  Say what you actually think. Label speculation as speculation. 
                  Admit when you are unsure. This is how we learn from each other.
                </p>
              </div>

              <div>
                <h2 className="text-body font-medium text-foreground mb-2">
                  No harassment
                </h2>
                <p className="text-body text-muted-foreground">
                  This should go without saying. Personal attacks, unwanted 
                  attention, and discriminatory behavior have no place here.
                </p>
              </div>
            </div>

            {/* Note */}
            <div className="pt-6 border-t border-divider">
              <p className="text-body text-muted-foreground">
                If something feels off, say something. Talk to an organizer or 
                email{" "}
                <a
                  href="mailto:conduct@dmvappliedai.org"
                  className="text-primary hover:text-primary/80 transition-subtle"
                >
                  conduct@dmvappliedai.org
                </a>
                . We will listen.
              </p>
            </div>

            {/* AI Ready RVA link */}
            <div className="pt-2">
              <a
                href="https://aireadyrva.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground transition-subtle"
              >
                AI Ready RVA
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default CodeOfConduct;
