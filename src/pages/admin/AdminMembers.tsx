import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Member = Tables<"members">;

const AdminMembers = () => {
  const { toast } = useToast();

  const { data: members, isLoading } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return data as Member[];
    },
  });

  const exportEmails = () => {
    if (!members?.length) {
      toast({ title: "No members to export" });
      return;
    }

    const csv = [
      "email,joined_at",
      ...members.map((m) => `${m.email},${m.joined_at}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: `Exported ${members.length} emails` });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-heading text-foreground">Members</h1>
        <Button onClick={exportEmails} disabled={!members?.length}>
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : members?.length === 0 ? (
        <p className="text-caption text-muted-foreground">No members</p>
      ) : (
        <div className="space-y-1">
          <p className="text-caption text-muted-foreground mb-4">
            {members?.length} member{members?.length === 1 ? "" : "s"}
          </p>
          {members?.map((member) => (
            <div
              key={member.id}
              className="p-3 border border-border rounded bg-card flex items-center justify-between"
            >
              <span className="text-body text-foreground font-mono">{member.email}</span>
              <span className="text-caption text-muted-foreground">
                {format(new Date(member.joined_at), "MMM d, yyyy")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMembers;
