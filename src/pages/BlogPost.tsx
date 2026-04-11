import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PageLayout from "@/components/PageLayout";
import { blogPosts } from "@/data/blog-posts";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useAsciiHero } from "@/hooks/useAsciiHero";

/** Parse footnotes: text like [^1: some note] becomes a FootnoteTooltip */
function parseFootnotes(text: string) {
  const regex = /\[\^(\d+):\s*([^\]]+)\]/g;
  const parts: (string | { index: number; note: string })[] = [];
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push({ index: parseInt(match[1]), note: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const postIndex = blogPosts.findIndex((p) => p.slug === slug);
  const post = blogPosts[postIndex];
  const progress = useReadingProgress();
  const revealRef = useScrollReveal();
  const asciiArt = useAsciiHero(slug ?? "");

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const prevPost = postIndex > 0 ? blogPosts[postIndex - 1] : null;
  const nextPost = postIndex < blogPosts.length - 1 ? blogPosts[postIndex + 1] : null;

  return (
    <PageLayout>
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 h-0.5 bg-primary z-50 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />

      <article className="py-16">
        <div className="container max-w-2xl">
          {/* Back link */}
          <Link
            to="/blog"
            className="text-label uppercase tracking-widest text-muted-foreground hover:text-foreground transition-subtle mb-10 inline-block"
          >
            ← Writing
          </Link>

          {/* Generative ASCII hero */}
          <div className="my-8 overflow-hidden rounded border border-divider bg-card p-4">
            <pre className="text-[10px] leading-[1.4] font-mono text-primary/60 select-none whitespace-pre text-center">
              {asciiArt}
            </pre>
          </div>

          {/* Part label */}
          <p className="text-label uppercase tracking-widest text-muted-foreground mb-4 mt-6">
            Part {post.part} of {blogPosts.length}
          </p>

          {/* Prose content with scroll reveal */}
          <div
            ref={revealRef}
            className="
              prose dark:prose-invert max-w-none
              prose-headings:font-mono prose-headings:tracking-tight
              prose-h1:text-display-sm prose-h1:font-light prose-h1:leading-tight prose-h1:mb-2
              prose-h2:text-heading prose-h2:mt-12 prose-h2:mb-4
              prose-p:text-body prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-card prose-pre:border prose-pre:border-divider prose-pre:rounded prose-pre:text-sm
              prose-img:rounded prose-img:mx-auto prose-img:w-full
              prose-em:text-muted-foreground
              prose-table:text-body prose-th:font-mono prose-th:text-label prose-th:uppercase prose-th:tracking-widest
              prose-hr:border-divider
              [&_blockquote]:border-l-0 [&_blockquote]:pl-6 [&_blockquote]:relative
              [&_blockquote]:before:content-[''] [&_blockquote]:before:absolute [&_blockquote]:before:left-0 [&_blockquote]:before:top-0
              [&_blockquote]:before:w-[2px] [&_blockquote]:before:bg-primary
              [&_blockquote]:before:h-0 [&_blockquote]:before:transition-[height] [&_blockquote]:before:duration-700 [&_blockquote]:before:ease-out
              [&_blockquote.revealed]:before:h-full
            "
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ src, alt }) => (
                  <figure className="my-8">
                    <img src={src} alt={alt} className="w-full rounded" />
                    {alt && (
                      <figcaption className="text-caption text-muted-foreground text-center mt-3">
                        {alt}
                      </figcaption>
                    )}
                  </figure>
                ),
                blockquote: ({ children, ...props }) => (
                  <BlockquoteReveal {...props}>{children}</BlockquoteReveal>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Prev / Next navigation */}
          <nav className="mt-16 pt-8 border-t border-divider flex justify-between gap-4">
            {prevPost ? (
              <Link
                to={`/blog/${prevPost.slug}`}
                className="group flex-1 text-left"
              >
                <p className="text-label uppercase tracking-widest text-muted-foreground mb-1">← Part {prevPost.part}</p>
                <p className="text-body text-foreground group-hover:text-primary transition-subtle line-clamp-2">
                  {prevPost.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            {nextPost ? (
              <Link
                to={`/blog/${nextPost.slug}`}
                className="group flex-1 text-right"
              >
                <p className="text-label uppercase tracking-widest text-muted-foreground mb-1">Part {nextPost.part} →</p>
                <p className="text-body text-foreground group-hover:text-primary transition-subtle line-clamp-2">
                  {nextPost.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </nav>
        </div>
      </article>
    </PageLayout>
  );
};

/** Blockquote with animated border draw on scroll */
function BlockquoteReveal({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement> & { children?: React.ReactNode }) {
  const ref = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <blockquote ref={ref} {...props}>
      {children}
    </blockquote>
  );
}

export default BlogPost;
