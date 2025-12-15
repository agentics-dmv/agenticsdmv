// Extract YouTube video ID from various URL formats
export const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
};

// Generate YouTube embed URL
export const getYouTubeEmbedUrl = (url: string): string | null => {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
};

// Generate YouTube thumbnail URL
export const getYouTubeThumbnail = (url: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'maxres'): string | null => {
  const id = extractYouTubeId(url);
  if (!id) return null;
  
  const qualityMap = {
    default: 'default',
    hq: 'hqdefault',
    mq: 'mqdefault',
    sd: 'sddefault',
    maxres: 'maxresdefault',
  };
  
  return `https://img.youtube.com/vi/${id}/${qualityMap[quality]}.jpg`;
};
