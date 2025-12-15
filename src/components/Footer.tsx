import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-divider">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <Link to="/" className="text-caption font-medium text-foreground mb-2 block">
              Agentics VA
            </Link>
            <p className="text-caption text-muted-foreground">
              A chapter of the Agentics Foundation
            </p>
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
            <a 
              href="https://github.com/agentics" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-caption text-muted-foreground hover:text-foreground transition-subtle"
            >
              GitHub
            </a>
            <a 
              href="mailto:hello@agenticsva.org"
              className="text-caption text-muted-foreground hover:text-foreground transition-subtle"
            >
              Contact
            </a>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-divider">
          <p className="text-caption text-muted-foreground">
            © {currentYear} Agentics VA. Open source, open minds.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
