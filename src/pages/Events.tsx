import { Calendar, MapPin, Clock, ExternalLink } from "lucide-react";
import PageLayout from "@/components/PageLayout";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  link?: string;
  isUpcoming: boolean;
}

const events: Event[] = [
  {
    id: "1",
    title: "Reading Group: Multi-Agent Coordination",
    date: "January 18, 2025",
    time: "2:00 PM EST",
    location: "Arlington Public Library, Virginia Room",
    description: "We'll discuss recent papers on emergent coordination in multi-agent systems, with a focus on practical implications for agent design.",
    link: "#",
    isUpcoming: true,
  },
  {
    id: "2",
    title: "Monthly Meetup: Show & Tell",
    date: "February 1, 2025",
    time: "6:00 PM EST",
    location: "Capital One Café, Tysons",
    description: "Informal session where members share what they've been building or learning. All skill levels welcome.",
    link: "#",
    isUpcoming: true,
  },
  {
    id: "3",
    title: "Workshop: Building Your First Agent",
    date: "February 15, 2025",
    time: "10:00 AM EST",
    location: "George Mason University, Research Hall",
    description: "Hands-on workshop for beginners. We'll build a simple task-completion agent from scratch.",
    link: "#",
    isUpcoming: true,
  },
  {
    id: "4",
    title: "Reading Group: Constitutional AI",
    date: "December 14, 2024",
    time: "2:00 PM EST",
    location: "Arlington Public Library",
    description: "Discussed Anthropic's constitutional AI paper and its implications for agent alignment.",
    isUpcoming: false,
  },
  {
    id: "5",
    title: "Monthly Meetup: Year in Review",
    date: "December 7, 2024",
    time: "6:00 PM EST",
    location: "Capital One Café, Tysons",
    description: "Reflected on the year's progress in agentic AI and set goals for 2025.",
    isUpcoming: false,
  },
  {
    id: "6",
    title: "Panel: AI Safety in Practice",
    date: "November 16, 2024",
    time: "3:00 PM EST",
    location: "Virginia Tech Research Center",
    description: "Three local researchers shared their perspectives on practical AI safety considerations.",
    isUpcoming: false,
  },
];

const EventCard = ({ event }: { event: Event }) => (
  <article className="py-8 border-b border-divider last:border-b-0">
    <div className="flex flex-col md:flex-row md:items-start gap-6">
      <div className="md:w-48 flex-shrink-0">
        <p className="text-caption text-muted-foreground">{event.date}</p>
      </div>
      <div className="flex-1">
        <h3 className="text-body font-medium text-foreground mb-3">
          {event.title}
        </h3>
        <p className="text-body text-muted-foreground mb-4">
          {event.description}
        </p>
        <div className="flex flex-wrap gap-4 text-caption text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {event.time}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} />
            {event.location}
          </span>
        </div>
        {event.link && event.isUpcoming && (
          <a 
            href={event.link}
            className="inline-flex items-center gap-1.5 mt-4 text-caption text-primary hover:text-primary/80 transition-subtle"
          >
            RSVP
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  </article>
);

const Events = () => {
  const upcoming = events.filter(e => e.isUpcoming);
  const archived = events.filter(e => !e.isUpcoming);

  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-label uppercase text-primary mb-4">Events</p>
            <h1 className="text-display-sm text-foreground mb-6">
              Gatherings for curious minds
            </h1>
            <p className="text-body-lg text-muted-foreground">
              We meet regularly to discuss papers, share projects, and learn from 
              each other. All events are free and open to the community.
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming */}
      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <Calendar size={18} className="text-primary" />
            <h2 className="text-heading text-foreground">Upcoming</h2>
          </div>
          {upcoming.length > 0 ? (
            <div className="max-w-3xl">
              {upcoming.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-body text-muted-foreground">
              No upcoming events scheduled. Check back soon or join our mailing list.
            </p>
          )}
        </div>
      </section>

      {/* Archived */}
      <section className="py-16 bg-card">
        <div className="container">
          <h2 className="text-heading text-foreground mb-8">Past Events</h2>
          <div className="max-w-3xl">
            {archived.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Events;
