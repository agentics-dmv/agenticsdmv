import { useQuery } from "@tanstack/react-query";
import { FolderGit2, ExternalLink, FileText, Wrench } from "lucide-react";
import { format } from "date-fns";
import PageLayout from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

const Resources = () => {
  const { data: eventsWithArtifacts = [], isLoading } = useQuery({
    queryKey: ["events-with-artifacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .not("artifact_url", "is", null)
        .order("date_time", { ascending: false });
      
      if (error) throw error;
      return data as Event[];
    },
  });

  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-label uppercase text-primary mb-4">Resources</p>
            <h1 className="text-display-sm text-foreground mb-6">
              Artifacts & Learnings
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Every meetup produces an artifact—GitHub repos, architecture decision 
              records, and recorded solutions. The knowledge doesn't disappear 
              when the pizza runs out.
            </p>
          </div>
        </div>
      </section>

      {/* Event Artifacts */}
      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <FolderGit2 size={18} className="text-primary" />
            <h2 className="text-heading text-foreground">Event Artifacts</h2>
          </div>
          
          {isLoading ? (
            <p className="text-body text-muted-foreground">Loading artifacts...</p>
          ) : eventsWithArtifacts.length > 0 ? (
            <div className="max-w-3xl space-y-4">
              {eventsWithArtifacts.map((event) => (
                <a
                  key={event.id}
                  href={event.artifact_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border border-border rounded bg-card hover:bg-muted/50 transition-subtle group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-body font-medium text-foreground group-hover:text-primary transition-subtle">
                        {event.title}
                      </p>
                      <p className="text-caption text-muted-foreground mt-1">
                        {format(new Date(event.date_time), "MMMM d, yyyy")} · {event.format_type}
                      </p>
                    </div>
                    <ExternalLink size={16} className="text-muted-foreground shrink-0 mt-1" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-body text-muted-foreground">
              No artifacts yet. Check back after our next event.
            </p>
          )}
        </div>
      </section>

      {/* Useful Links */}
      <section className="py-16 border-t border-divider bg-card">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <Wrench size={18} className="text-muted-foreground" />
            <h2 className="text-heading text-foreground">Local AI Resources</h2>
          </div>
          
          <div className="max-w-3xl grid gap-4 sm:grid-cols-2">
            <ResourceLink
              href="https://ollama.ai"
              title="Ollama"
              description="Run LLMs locally on your machine"
            />
            <ResourceLink
              href="https://github.com/ggerganov/llama.cpp"
              title="llama.cpp"
              description="Optimized inference for Llama models"
            />
            <ResourceLink
              href="https://lmstudio.ai"
              title="LM Studio"
              description="Desktop app for local LLM deployment"
            />
            <ResourceLink
              href="https://github.com/langchain-ai/langgraph"
              title="LangGraph"
              description="Build agentic workflows with graphs"
            />
          </div>
        </div>
      </section>

      {/* Architecture Decision Records */}
      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <FileText size={18} className="text-muted-foreground" />
            <h2 className="text-heading text-foreground">Architecture Decision Records</h2>
          </div>
          
          <p className="text-body text-muted-foreground max-w-2xl">
            ADRs from our Agent Clinics will be published here as we 
            document solutions to real compliance and deployment challenges.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

function ResourceLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 border border-border rounded bg-background hover:bg-muted/50 transition-subtle group"
    >
      <p className="text-body font-medium text-foreground group-hover:text-primary transition-subtle">
        {title}
      </p>
      <p className="text-caption text-muted-foreground mt-1">
        {description}
      </p>
    </a>
  );
}

export default Resources;
