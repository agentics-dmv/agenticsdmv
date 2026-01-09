import PageLayout from "@/components/PageLayout";

const Privacy = () => {
  return (
    <PageLayout>
      <section className="py-22">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-label uppercase text-primary mb-4">Privacy</p>
            <h1 className="text-display-sm text-foreground mb-8">
              How we handle your data
            </h1>

            <div className="space-y-8 text-body text-muted-foreground">
              <div>
                <h2 className="text-body font-medium text-foreground mb-2">
                  What we collect
                </h2>
                <p>
                  If you join our mailing list, we store your email address and 
                  the date you signed up. That is the only personal data we collect.
                </p>
              </div>

              <div>
                <h2 className="text-body font-medium text-foreground mb-2">
                  How we use it
                </h2>
                <p>
                  We use your email to send you updates about DMV Applied AI sessions 
                  and announcements. We do not sell, share, or give your email to 
                  anyone else. We do not use tracking pixels or analytics on our 
                  emails.
                </p>
              </div>

              <div>
                <h2 className="text-body font-medium text-foreground mb-2">
                  How to be removed
                </h2>
                <p>
                  Email{" "}
                  <a
                    href="mailto:hello@dmvappliedai.org?subject=Remove%20me%20from%20mailing%20list"
                    className="text-primary hover:text-primary/80 transition-subtle"
                  >
                    hello@dmvappliedai.org
                  </a>{" "}
                  and ask to be removed. We will delete your email from our list 
                  within a few days.
                </p>
              </div>

              <div>
                <h2 className="text-body font-medium text-foreground mb-2">
                  This website
                </h2>
                <p>
                  This site does not use cookies or tracking scripts. We do not 
                  collect analytics about your visit.
                </p>
              </div>

              <div className="pt-4">
                <p className="text-caption text-text-subtle">
                  Questions? Email{" "}
                  <a
                    href="mailto:hello@dmvappliedai.org"
                    className="text-primary hover:text-primary/80 transition-subtle"
                  >
                    hello@dmvappliedai.org
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Privacy;
