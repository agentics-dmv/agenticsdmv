import { BookOpen, Users, Lightbulb } from "lucide-react";

const focusAreas = [
  {
    icon: BookOpen,
    title: "Research",
    description: "We study agentic architectures, multi-agent coordination, and the alignment challenges unique to autonomous systems.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Monthly meetups, reading groups, and collaborative projects bring together researchers, engineers, and curious newcomers.",
  },
  {
    icon: Lightbulb,
    title: "Education",
    description: "Workshops and open resources help demystify agentic AI, making cutting-edge concepts accessible to all.",
  },
];

const Focus = () => {
  return (
    <section id="focus" className="py-30 bg-card">
      <div className="container">
        <div className="max-w-xl mb-16">
          <p className="text-label uppercase text-primary mb-4">Focus Areas</p>
          <h2 className="text-heading text-foreground">
            What we're working on
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {focusAreas.map((area, index) => (
            <div key={index} className="group">
              <div className="mb-5 text-primary">
                <area.icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-body font-medium text-foreground mb-3">
                {area.title}
              </h3>
              <p className="text-body text-muted-foreground">
                {area.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Focus;
