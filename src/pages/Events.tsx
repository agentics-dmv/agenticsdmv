import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Clock, ExternalLink, CalendarPlus, Archive, FolderGit2 } from "lucide-react";
import { format } from "date-fns";
import PageLayout from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { downloadICS } from "@/lib/ics";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

const formatLabels: Record<string, string> = {
  talk: "Talk",
  panel: "Panel",
  workshop: "Workshop",
  clinic: "Agent Clinic",
  "reverse-pitch": "Reverse Pitch",
};

const EventCard = ({ event, isUpcoming }: { event: Event; isUpcoming: boolean }) => {
  const eventDate = new Date(event.date_time);
  const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hour duration

  const handleAddToCalendar = () => {
    downloadICS({
      title: event.title,
      description: event.description,
      location: event.location_text,
      startDate: eventDate,
      endDate: endDate,
    });
  };

  return (
    <article className="py-8 border-b border-divider last:border-b-0">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="md:w-48 flex-shrink-0">
          <p className="text-caption text-muted-foreground">
            {format(eventDate, "MMMM d, yyyy")}
          </p>
          <span className="inline-block mt-2 px-2 py-0.5 text-xs uppercase tracking-wide bg-accent text-accent-foreground rounded">
            {formatLabels[event.format_type] || event.format_type}
          </span>
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
              {format(eventDate, "h:mm a")}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {event.location_map_link ? (
                <a
                  href={event.location_map_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-subtle"
                >
                  {event.location_text}
                </a>
              ) : (
                event.location_text
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {isUpcoming && (
              <>
                {event.rsvp_link && (
                  <a
                    href={event.rsvp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-caption text-primary hover:text-primary/80 transition-subtle"
                  >
                    RSVP
                    <ExternalLink size={12} />
                  </a>
                )}
                <button
                  onClick={handleAddToCalendar}
                  className="inline-flex items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground transition-subtle"
                >
                  <CalendarPlus size={14} />
                  Add to Calendar
                </button>
              </>
            )}
            {!isUpcoming && event.recording_url && (
              <a
                href={event.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-caption text-primary hover:text-primary/80 transition-subtle"
              >
                Watch Recording
                <ExternalLink size={12} />
              </a>
            )}
            {event.artifact_url && (
              <a
                href={event.artifact_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-caption text-primary hover:text-primary/80 transition-subtle"
              >
                <FolderGit2 size={14} />
                View Artifact
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

const Events = () => {
  const [showArchived, setShowArchived] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date_time", { ascending: true });
      
      if (error) throw error;
      return data as Event[];
    },
  });

  const now = new Date();
  
  // Upcoming events: not archived AND date is in the future
  const upcoming = events.filter(
    (e) => !e.archived && new Date(e.date_time) >= now
  );
  
  // Past events: archived OR date is in the past
  const archived = events.filter(
    (e) => e.archived || new Date(e.date_time) < now
  );

  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-label uppercase text-primary mb-4">Events</p>
            <h1 className="text-display-sm text-foreground mb-6">
              Agentics DMV Events
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Agent Clinics, Reverse Pitches, and hands-on workshops. 
              All events are free and open to builders.
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
          {isLoading ? (
            <p className="text-body text-muted-foreground">Loading events...</p>
          ) : upcoming.length > 0 ? (
            <div className="max-w-3xl">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} isUpcoming={true} />
              ))}
            </div>
          ) : (
            <p className="text-body text-muted-foreground">
              No upcoming events scheduled. Check back soon.
            </p>
          )}
        </div>
      </section>

      {/* Archived Toggle */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Archive size={18} className="text-muted-foreground" />
              <h2 className="text-heading text-foreground">Past Events</h2>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived" className="text-caption text-muted-foreground cursor-pointer">
                Show past events
              </Label>
            </div>
          </div>
          {showArchived && (
            <div className="max-w-3xl">
              {isLoading ? (
                <p className="text-body text-muted-foreground">Loading events...</p>
              ) : archived.length > 0 ? (
                archived.map((event) => (
                  <EventCard key={event.id} event={event} isUpcoming={false} />
                ))
              ) : (
                <p className="text-body text-muted-foreground">
                  No past events yet.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Events;
