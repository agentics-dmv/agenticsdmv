const About = () => {
  return (
    <section id="about" className="py-30 border-t border-divider">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          <div>
            <p className="text-label uppercase text-primary mb-4">About</p>
            <h2 className="text-heading text-foreground mb-6">
              A regional home for agentic AI research
            </h2>
          </div>
          <div className="space-y-6">
            <p className="text-body text-muted-foreground">
              Agentics VA is the Virginia chapter of the Agentics Foundation—a 
              nonprofit dedicated to advancing the science and practice of agentic 
              artificial intelligence.
            </p>
            <p className="text-body text-muted-foreground">
              We believe that autonomous AI systems will reshape how we work, learn, 
              and solve problems. Our role is to ensure that transformation happens 
              thoughtfully, inclusively, and with lasting benefit to our communities.
            </p>
            <p className="text-body text-muted-foreground">
              Based in Virginia, we connect local practitioners with the broader 
              research community while fostering grassroots experimentation and 
              knowledge sharing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
