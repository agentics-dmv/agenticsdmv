import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, ExternalLink, X } from "lucide-react";
import { format } from "date-fns";
import PageLayout from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { getYouTubeEmbedUrl, getYouTubeThumbnail, extractYouTubeId } from "@/lib/youtube";
import type { Tables } from "@/integrations/supabase/types";

type Recording = Tables<"recordings"> & {
  events?: Tables<"events"> | null;
};

const RecordingCard = ({ 
  recording, 
  onPlay 
}: { 
  recording: Recording; 
  onPlay: (recording: Recording) => void;
}) => {
  const thumbnail = getYouTubeThumbnail(recording.youtube_url);
  const videoId = extractYouTubeId(recording.youtube_url);

  return (
    <article className="group">
      <button
        onClick={() => onPlay(recording)}
        className="block w-full text-left"
      >
        <div className="aspect-video bg-muted mb-4 relative overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={recording.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-subtle"
              onError={(e) => {
                // Fallback to lower quality thumbnail
                const target = e.target as HTMLImageElement;
                if (target.src.includes('maxresdefault')) {
                  target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Play size={32} className="text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center group-hover:bg-primary transition-subtle">
              <Play size={20} className="text-foreground group-hover:text-primary-foreground ml-0.5" />
            </div>
          </div>
        </div>
        <h3 className="text-body font-medium text-foreground mb-2 group-hover:text-primary transition-subtle">
          {recording.title}
        </h3>
        <p className="text-caption text-muted-foreground mb-2">
          {format(new Date(recording.published_at), "MMMM yyyy")}
          {recording.speaker_names && recording.speaker_names.length > 0 && (
            <> · {recording.speaker_names.join(", ")}</>
          )}
        </p>
        {recording.summary && (
          <p className="text-caption text-muted-foreground line-clamp-2">
            {recording.summary}
          </p>
        )}
        {recording.events && (
          <p className="text-caption text-primary mt-2">
            From: {recording.events.title}
          </p>
        )}
      </button>
    </article>
  );
};

const VideoModal = ({ 
  recording, 
  onClose 
}: { 
  recording: Recording; 
  onClose: () => void;
}) => {
  const embedUrl = getYouTubeEmbedUrl(recording.youtube_url);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-muted-foreground hover:text-foreground transition-subtle"
          aria-label="Close video"
        >
          <X size={24} />
        </button>
        <div className="aspect-video bg-black rounded overflow-hidden">
          {embedUrl ? (
            <iframe
              src={`${embedUrl}?autoplay=1`}
              title={recording.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Invalid video URL
            </div>
          )}
        </div>
        <div className="mt-4">
          <h2 className="text-body-lg font-medium text-foreground mb-2">
            {recording.title}
          </h2>
          {recording.summary && (
            <p className="text-body text-muted-foreground">
              {recording.summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Recordings = () => {
  const [activeRecording, setActiveRecording] = useState<Recording | null>(null);

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ["recordings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recordings")
        .select("*, events(*)")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Recording[];
    },
  });

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
          {isLoading ? (
            <p className="text-body text-muted-foreground">Loading recordings...</p>
          ) : recordings.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {recordings.map((recording) => (
                <RecordingCard
                  key={recording.id}
                  recording={recording}
                  onPlay={setActiveRecording}
                />
              ))}
            </div>
          ) : (
            <p className="text-body text-muted-foreground">
              No recordings available yet. Check back after our next event!
            </p>
          )}
        </div>
      </section>

      {activeRecording && (
        <VideoModal
          recording={activeRecording}
          onClose={() => setActiveRecording(null)}
        />
      )}
    </PageLayout>
  );
};

export default Recordings;
