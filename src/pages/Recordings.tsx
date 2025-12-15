import { Play, ExternalLink } from "lucide-react";
import PageLayout from "@/components/PageLayout";

interface Recording {
  id: string;
  title: string;
  date: string;
  duration: string;
  description: string;
  youtubeId: string;
  speaker?: string;
}

const recordings: Recording[] = [
  {
    id: "1",
    title: "Introduction to Agentic Architectures",
    date: "November 2024",
    duration: "47 min",
    description: "An overview of common patterns in agentic system design, from simple ReAct loops to complex multi-agent orchestration.",
    youtubeId: "dQw4w9WgXcQ",
    speaker: "Dr. Sarah Chen",
  },
  {
    id: "2",
    title: "Tool Use and Function Calling",
    date: "October 2024",
    duration: "38 min",
    description: "Deep dive into how modern LLMs can reliably use external tools, with practical examples and failure modes.",
    youtubeId: "dQw4w9WgXcQ",
    speaker: "Marcus Thompson",
  },
  {
    id: "3",
    title: "Reading Group: Chain-of-Thought Prompting",
    date: "October 2024",
    duration: "62 min",
    description: "Group discussion of the original CoT paper and its implications for agent reasoning.",
    youtubeId: "dQw4w9WgXcQ",
  },
  {
    id: "4",
    title: "Memory Systems for Long-Running Agents",
    date: "September 2024",
    duration: "51 min",
    description: "Exploring different approaches to agent memory: episodic, semantic, and procedural memory architectures.",
    youtubeId: "dQw4w9WgXcQ",
    speaker: "Dr. James Liu",
  },
  {
    id: "5",
    title: "Safety Considerations for Autonomous Systems",
    date: "September 2024",
    duration: "44 min",
    description: "A practical framework for thinking about safety in agentic AI, with case studies from industry.",
    youtubeId: "dQw4w9WgXcQ",
    speaker: "Aisha Patel",
  },
  {
    id: "6",
    title: "Panel: The State of Agent Frameworks",
    date: "August 2024",
    duration: "72 min",
    description: "Three practitioners compare LangChain, AutoGPT, CrewAI, and custom solutions for building agents.",
    youtubeId: "dQw4w9WgXcQ",
  },
];

const RecordingCard = ({ recording }: { recording: Recording }) => (
  <article className="group">
    <a 
      href={`https://youtube.com/watch?v=${recording.youtubeId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <div className="aspect-video bg-muted mb-4 relative overflow-hidden">
        <img 
          src={`https://img.youtube.com/vi/${recording.youtubeId}/maxresdefault.jpg`}
          alt={recording.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-subtle"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center group-hover:bg-primary transition-subtle">
            <Play size={20} className="text-foreground group-hover:text-primary-foreground ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/90 text-caption text-foreground">
          {recording.duration}
        </div>
      </div>
      <h3 className="text-body font-medium text-foreground mb-2 group-hover:text-primary transition-subtle">
        {recording.title}
      </h3>
      <p className="text-caption text-muted-foreground mb-2">
        {recording.date}
        {recording.speaker && ` · ${recording.speaker}`}
      </p>
      <p className="text-caption text-muted-foreground line-clamp-2">
        {recording.description}
      </p>
    </a>
  </article>
);

const Recordings = () => {
  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-label uppercase text-primary mb-4">Recordings</p>
            <h1 className="text-display-sm text-foreground mb-6">
              Learn at your own pace
            </h1>
            <p className="text-body-lg text-muted-foreground mb-8">
              Recordings from our talks, workshops, and reading groups. All content 
              is freely available on YouTube.
            </p>
            <a 
              href="https://youtube.com/@agenticsva"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-caption text-primary hover:text-primary/80 transition-subtle"
            >
              Subscribe on YouTube
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-divider">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {recordings.map(recording => (
              <RecordingCard key={recording.id} recording={recording} />
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Recordings;
