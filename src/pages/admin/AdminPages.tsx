import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type StaticPage = Tables<"static_pages">;

const AdminPages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("static_pages")
        .select("*")
        .order("slug", { ascending: true });
      if (error) throw error;
      return data as StaticPage[];
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-heading text-foreground">Static Pages</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : pages?.length === 0 ? (
        <p className="text-caption text-muted-foreground">No static pages</p>
      ) : (
        <div className="space-y-2">
          {pages?.map((page) => (
            <PageRow
              key={page.id}
              page={page}
              isEditing={editingId === page.id}
              onEdit={() => setEditingId(page.id)}
              onClose={() => setEditingId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function PageRow({
  page,
  isEditing,
  onEdit,
  onClose,
}: {
  page: StaticPage;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  if (isEditing) {
    return (
      <PageForm
        page={page}
        onClose={onClose}
        onSuccess={() => {
          onClose();
          queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
        }}
      />
    );
  }

  return (
    <div
      className="p-4 border border-border rounded bg-card hover:bg-muted/50 transition-subtle cursor-pointer"
      onClick={onEdit}
    >
      <p className="text-body text-foreground">{page.title}</p>
      <p className="text-caption text-muted-foreground">/{page.slug}</p>
    </div>
  );
}

function PageForm({
  page,
  onClose,
  onSuccess,
}: {
  page: StaticPage;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: page.title,
    body_text: page.body_text,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("static_pages")
        .update({
          title: form.title,
          body_text: form.body_text,
        })
        .eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Page updated" });
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
    <form onSubmit={handleSubmit} className="p-4 border border-border rounded bg-card space-y-4">
      <p className="text-caption text-muted-foreground">/{page.slug}</p>
      <Input
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <Textarea
        placeholder="Body text"
        value={form.body_text}
        onChange={(e) => setForm({ ...form, body_text: e.target.value })}
        rows={10}
        required
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default AdminPages;
