import { useParams, Link, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PageLayout from "@/components/PageLayout";
import { blogPosts } from "@/data/blog-posts";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const postIndex = blogPosts.findIndex((p) => p.slug === slug);
  const post = blogPosts[postIndex];

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const prevPost = postIndex > 0 ? blogPosts[postIndex - 1] : null;
  const nextPost = postIndex < blogPosts.length - 1 ? blogPosts[postIndex + 1] : null;

  return (
    <PageLayout>
      <article className="py-16">
        <div className="container max-w-2xl">
          {/* Back link */}
          <Link
            to="/blog"
            className="text-label uppercase tracking-widest text-muted-foreground hover:text-foreground transition-subtle mb-10 inline-block"
          >
            ← Writing
          </Link>

          {/* Part label */}
          <p className="text-label uppercase tracking-widest text-muted-foreground mb-4 mt-6">
            Part {post.part} of {blogPosts.length}
          </p>

          {/* Prose content */}
          <div
            className="
              prose dark:prose-invert max-w-none
              prose-headings:font-mono prose-headings:tracking-tight
              prose-h1:text-display-sm prose-h1:font-light prose-h1:leading-tight prose-h1:mb-2
              prose-h2:text-heading prose-h2:mt-12 prose-h2:mb-4
              prose-p:text-body prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-card prose-pre:border prose-pre:border-divider prose-pre:rounded prose-pre:text-sm
              prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic
              prose-img:rounded prose-img:mx-auto prose-img:w-full
              prose-em:text-muted-foreground
              prose-table:text-body prose-th:font-mono prose-th:text-label prose-th:uppercase prose-th:tracking-widest
              prose-hr:border-divider
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

export default BlogPost;
