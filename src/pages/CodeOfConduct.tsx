import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

const CodeOfConduct = () => {
  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-label uppercase text-primary mb-4">Community</p>
            <h1 className="text-display-sm text-foreground mb-6">
              Code of Conduct
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Agentics VA is committed to providing a welcoming, inclusive, and 
              harassment-free experience for everyone. This code of conduct applies 
              to all community spaces.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="max-w-3xl space-y-12">
            {/* Summary */}
            <div className="p-6 bg-card border border-divider">
              <h2 className="text-body font-medium text-foreground mb-3">
                The short version
              </h2>
              <p className="text-body text-muted-foreground">
                Be kind, be professional, and assume good intent. If something feels 
                wrong, speak up. We're here to learn together.
              </p>
            </div>

            {/* Expected behavior */}
            <div>
              <h2 className="text-heading text-foreground mb-6">Expected behavior</h2>
              <ul className="space-y-4 text-body text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary">—</span>
                  <span>
                    <strong className="text-foreground">Be respectful.</strong> Treat 
                    everyone with dignity, regardless of their background, experience 
                    level, or opinions.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">—</span>
                  <span>
                    <strong className="text-foreground">Be constructive.</strong> When 
                    you disagree, do so thoughtfully. Focus on ideas, not people.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">—</span>
                  <span>
                    <strong className="text-foreground">Be inclusive.</strong> Make 
                    space for others to participate. Avoid jargon when simpler language 
                    works.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">—</span>
                  <span>
                    <strong className="text-foreground">Be curious.</strong> Ask 
                    questions. Admit when you don't know something. Learning is why 
                    we're here.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">—</span>
                  <span>
                    <strong className="text-foreground">Be honest.</strong> Share 
                    your genuine views. Acknowledge uncertainty. Avoid hype and 
                    exaggeration.
                  </span>
                </li>
              </ul>
            </div>

            {/* Unacceptable behavior */}
            <div>
              <h2 className="text-heading text-foreground mb-6">Unacceptable behavior</h2>
              <ul className="space-y-4 text-body text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary">—</span>
                  <span>
                    Harassment, intimidation, or discrimination of any kind
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">—</span>
                  <span>
                    Personal attacks, insults, or derogatory comments
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">—</span>
                  <span>
                    Unwelcome sexual attention or advances
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">—</span>
                  <span>
                    Publishing others' private information without consent
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">—</span>
                  <span>
                    Sustained disruption of talks, discussions, or other events
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">—</span>
                  <span>
                    Advocating for or encouraging any of the above behaviors
                  </span>
                </li>
              </ul>
            </div>

            {/* Reporting */}
            <div>
              <h2 className="text-heading text-foreground mb-6">Reporting issues</h2>
              <div className="space-y-4 text-body text-muted-foreground">
                <p>
                  If you experience or witness unacceptable behavior, please report it 
                  as soon as possible. You can:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>
                    Email us at{" "}
                    <a 
                      href="mailto:conduct@agenticsva.org"
                      className="text-primary hover:text-primary/80 transition-subtle"
                    >
                      conduct@agenticsva.org
                    </a>
                  </li>
                  <li>
                    Speak directly to an event organizer
                  </li>
                </ul>
                <p>
                  All reports will be handled with discretion and confidentiality. We 
                  take every report seriously and will respond promptly.
                </p>
              </div>
            </div>

            {/* Enforcement */}
            <div>
              <h2 className="text-heading text-foreground mb-6">Enforcement</h2>
              <div className="space-y-4 text-body text-muted-foreground">
                <p>
                  Community organizers are responsible for clarifying and enforcing 
                  standards of acceptable behavior. They may take any action they deem 
                  appropriate, including:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>A private warning to the individual involved</li>
                  <li>Requiring an apology or other corrective action</li>
                  <li>Temporary or permanent exclusion from community spaces</li>
                </ul>
                <p>
                  Decisions will be made thoughtfully and proportionally to the 
                  severity and frequency of the behavior.
                </p>
              </div>
            </div>

            {/* Attribution */}
            <div className="pt-8 border-t border-divider">
              <p className="text-caption text-muted-foreground">
                This code of conduct is adapted from the{" "}
                <a 
                  href="https://www.contributor-covenant.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-subtle"
                >
                  Contributor Covenant
                </a>
                , version 2.1.
              </p>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <p className="text-body text-muted-foreground mb-4">
                Questions about this code of conduct?
              </p>
              <a 
                href="mailto:conduct@agenticsva.org"
                className="inline-flex items-center px-5 py-2.5 border border-border text-foreground text-caption font-medium hover:bg-secondary transition-subtle"
              >
                Contact us
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default CodeOfConduct;
