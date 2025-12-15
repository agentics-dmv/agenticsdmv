import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Recording = Tables<"recordings">;

const AdminRecordings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const { data: recordings, isLoading } = useQuery({
    queryKey: ["admin-recordings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as Recording[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-heading text-foreground">Recordings</h1>
        <Button onClick={() => setShowNew(true)} disabled={showNew} size="sm">
          New Recording
        </Button>
      </div>

      {showNew && (
        <RecordingForm
          onClose={() => setShowNew(false)}
          onSuccess={() => {
            setShowNew(false);
            queryClient.invalidateQueries({ queryKey: ["admin-recordings"] });
          }}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : recordings?.length === 0 ? (
        <p className="text-caption text-muted-foreground">No recordings</p>
      ) : (
        <div className="space-y-2">
          {recordings?.map((recording) => (
            <RecordingRow
              key={recording.id}
              recording={recording}
              isEditing={editingId === recording.id}
              onEdit={() => setEditingId(recording.id)}
              onClose={() => setEditingId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function RecordingRow({
  recording,
  isEditing,
  onEdit,
  onClose,
}: {
  recording: Recording;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  if (isEditing) {
    return (
      <RecordingForm
        recording={recording}
        onClose={onClose}
        onSuccess={() => {
          onClose();
          queryClient.invalidateQueries({ queryKey: ["admin-recordings"] });
        }}
      />
    );
  }

  return (
    <div
      className="p-3 sm:p-4 border border-border rounded bg-card hover:bg-muted/50 transition-subtle cursor-pointer"
      onClick={onEdit}
    >
      <p className="text-body text-foreground truncate">{recording.title}</p>
      <p className="text-caption text-muted-foreground truncate">
        {format(new Date(recording.published_at), "MMM d, yyyy")}
        {recording.speaker_names?.length ? ` · ${recording.speaker_names.join(", ")}` : ""}
      </p>
    </div>
  );
}

function RecordingForm({
  recording,
  onClose,
  onSuccess,
}: {
  recording?: Recording;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const isNew = !recording;

  const [form, setForm] = useState({
    title: recording?.title || "",
    youtube_url: recording?.youtube_url || "",
    summary: recording?.summary || "",
    speaker_names: recording?.speaker_names?.join(", ") || "",
    published_at: recording?.published_at
      ? format(new Date(recording.published_at), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        youtube_url: form.youtube_url,
        summary: form.summary || null,
        speaker_names: form.speaker_names
          ? form.speaker_names.split(",").map((s) => s.trim())
          : null,
        published_at: new Date(form.published_at).toISOString(),
      };

      if (isNew) {
        const { error } = await supabase.from("recordings").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("recordings").update(payload).eq("id", recording.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: isNew ? "Recording added" : "Recording updated" });
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
      <Input
        placeholder="YouTube URL"
        value={form.youtube_url}
        onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
        required
      />
      <Textarea
        placeholder="Summary (optional)"
        value={form.summary}
        onChange={(e) => setForm({ ...form, summary: e.target.value })}
        rows={3}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          placeholder="Speakers (comma separated)"
          value={form.speaker_names}
          onChange={(e) => setForm({ ...form, speaker_names: e.target.value })}
        />
        <Input
          type="date"
          value={form.published_at}
          onChange={(e) => setForm({ ...form, published_at: e.target.value })}
        />
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

export default AdminRecordings;
