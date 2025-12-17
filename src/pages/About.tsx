import PageLayout from "@/components/PageLayout";

const About = () => {
  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-label uppercase text-primary mb-4">About</p>
            <h1 className="text-display-sm text-foreground mb-8">
              About Agentics DMV
            </h1>

            <div className="space-y-6 text-body text-muted-foreground">
              <p>
                A community for people in DC, Maryland, and Virginia who want to 
                think carefully about agentic AI systems. We host talks, workshops, 
                and reading groups.
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

            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
