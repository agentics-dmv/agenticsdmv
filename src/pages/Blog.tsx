import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { blogPosts } from "@/data/blog-posts";

const Blog = () => {
  return (
    <PageLayout>
      <section className="py-22">
        <div className="container max-w-2xl">
          <p className="text-label uppercase tracking-widest text-muted-foreground mb-4">Writing</p>
          <h1 className="text-display-sm mb-4">Building a Personal AI Assistant on AWS</h1>
          <p className="text-body-lg text-muted-foreground mb-6">
            A three-part series on running OpenClaw on EC2 with Bedrock — what worked, what failed, and what the system became.
          </p>
          <p className="text-label uppercase tracking-widest text-muted-foreground mb-16">
            <a
              href="/presentation/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-subtle"
            >
              AWS Meetup Slides →
            </a>
          </p>

          <div className="space-y-0">
            {blogPosts.map((post, index) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="block group"
              >
                <article className={`py-10 ${index < blogPosts.length - 1 ? "border-b border-divider" : ""}`}>
                  <p className="text-label uppercase tracking-widest text-muted-foreground mb-3">
                    Part {post.part}
                  </p>
                  <h2 className="text-heading text-foreground mb-2 group-hover:text-primary transition-subtle">
                    {post.title}
                  </h2>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    {post.subtitle}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Blog;
