import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-divider">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-4">
            <div>
              <Link to="/" className="text-caption font-medium text-foreground mb-1 block">
                Agentics DMV
              </Link>
              <p className="text-caption text-muted-foreground">
                The DC, Maryland, Virginia chapter of the{" "}
                <a
                  href="https://agentics.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-subtle"
                >
                  Agentics Foundation
                </a>
                , a nonprofit advancing agentic AI research and education.
              </p>
            </div>
            <a
              href="mailto:hello@agenticsva.org"
              className="inline-flex items-center gap-2 text-caption text-foreground hover:text-primary transition-subtle"
            >
              <Mail size={14} />
              hello@agenticsva.org
            </a>
          </div>
          <div className="flex flex-wrap gap-6">
            <Link
              to="/about"
              className="text-caption text-muted-foreground hover:text-foreground transition-subtle"
            >
              About
            </Link>
            <Link
              to="/code-of-conduct"
              className="text-caption text-muted-foreground hover:text-foreground transition-subtle"
            >
              Code of Conduct
            </Link>
            <Link
              to="/privacy"
              className="text-caption text-muted-foreground hover:text-foreground transition-subtle"
            >
              Privacy
            </Link>
            <a
              href="https://github.com/agentics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption text-muted-foreground hover:text-foreground transition-subtle"
            >
              GitHub
            </a>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-divider flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-caption text-muted-foreground">
            © {currentYear} Agentics DMV.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
