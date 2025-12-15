import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

const AdminEvents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date_time", { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
  });

  const activeEvents = events?.filter((e) => !e.archived) || [];
  const archivedEvents = events?.filter((e) => e.archived) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-heading text-foreground">Events</h1>
        <Button onClick={() => setShowNew(true)} disabled={showNew} size="sm">
          New Event
        </Button>
      </div>

      {showNew && (
        <EventForm
          onClose={() => setShowNew(false)}
          onSuccess={() => {
            setShowNew(false);
            queryClient.invalidateQueries({ queryKey: ["admin-events"] });
          }}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <section>
            <h2 className="text-body font-medium text-foreground mb-3">Active</h2>
            {activeEvents.length === 0 ? (
              <p className="text-caption text-muted-foreground">No active events</p>
            ) : (
              <div className="space-y-2">
                {activeEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isEditing={editingId === event.id}
                    onEdit={() => setEditingId(event.id)}
                    onClose={() => setEditingId(null)}
                  />
                ))}
              </div>
            )}
          </section>

          {archivedEvents.length > 0 && (
            <section>
              <h2 className="text-body font-medium text-muted-foreground mb-3">Archived</h2>
              <div className="space-y-2">
                {archivedEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isEditing={editingId === event.id}
                    onEdit={() => setEditingId(event.id)}
                    onClose={() => setEditingId(null)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

function EventRow({
  event,
  isEditing,
  onEdit,
  onClose,
}: {
  event: Event;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  if (isEditing) {
    return (
      <EventForm
        event={event}
        onClose={onClose}
        onSuccess={() => {
          onClose();
          queryClient.invalidateQueries({ queryKey: ["admin-events"] });
        }}
      />
    );
  }

  return (
    <div
      className="p-3 sm:p-4 border border-border rounded bg-card hover:bg-muted/50 transition-subtle cursor-pointer"
      onClick={onEdit}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div className="min-w-0">
          <p className="text-body text-foreground truncate">{event.title}</p>
          <p className="text-caption text-muted-foreground truncate">
            {format(new Date(event.date_time), "MMM d, yyyy · h:mm a")}
          </p>
        </div>
        <span className="text-label text-muted-foreground uppercase shrink-0">{event.format_type}</span>
      </div>
    </div>
  );
}

function EventForm({
  event,
  onClose,
  onSuccess,
}: {
  event?: Event;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const isNew = !event;

  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    date_time: event?.date_time ? format(new Date(event.date_time), "yyyy-MM-dd'T'HH:mm") : "",
    location_text: event?.location_text || "",
    location_map_link: event?.location_map_link || "",
    rsvp_link: event?.rsvp_link || "",
    recording_url: event?.recording_url || "",
    format_type: event?.format_type || "talk",
    audience_level: event?.audience_level || "general",
    archived: event?.archived || false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        date_time: new Date(form.date_time).toISOString(),
        location_map_link: form.location_map_link || null,
        rsvp_link: form.rsvp_link || null,
        recording_url: form.recording_url || null,
      };

      if (isNew) {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").update(payload).eq("id", event.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: isNew ? "Event created" : "Event updated" });
      onSuccess();
    },
    onError: (err) => {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 sm:p-4 border border-border rounded bg-card space-y-3 sm:space-y-4">
      <Input
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <Textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        required
        rows={3}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          type="datetime-local"
          value={form.date_time}
          onChange={(e) => setForm({ ...form, date_time: e.target.value })}
          required
        />
        <Input
          placeholder="Location"
          value={form.location_text}
          onChange={(e) => setForm({ ...form, location_text: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          placeholder="Map link (optional)"
          value={form.location_map_link}
          onChange={(e) => setForm({ ...form, location_map_link: e.target.value })}
        />
        <Input
          placeholder="RSVP link (optional)"
          value={form.rsvp_link}
          onChange={(e) => setForm({ ...form, rsvp_link: e.target.value })}
        />
      </div>
      <Input
        placeholder="Recording URL (optional)"
        value={form.recording_url}
        onChange={(e) => setForm({ ...form, recording_url: e.target.value })}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <select
          className="h-10 px-3 border border-input rounded bg-background text-foreground text-body"
          value={form.format_type}
          onChange={(e) => setForm({ ...form, format_type: e.target.value as Event["format_type"] })}
        >
          <option value="talk">Talk</option>
          <option value="panel">Panel</option>
          <option value="workshop">Workshop</option>
        </select>
        <select
          className="h-10 px-3 border border-input rounded bg-background text-foreground text-body"
          value={form.audience_level}
          onChange={(e) => setForm({ ...form, audience_level: e.target.value as Event["audience_level"] })}
        >
          <option value="general">General</option>
          <option value="technical">Technical</option>
          <option value="research">Research</option>
        </select>
        <label className="flex items-center gap-2 text-body text-foreground col-span-2 sm:col-span-1">
          <input
            type="checkbox"
            checked={form.archived}
            onChange={(e) => setForm({ ...form, archived: e.target.checked })}
          />
          Archived
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={mutation.isPending} size="sm">
          {mutation.isPending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default AdminEvents;
