const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-divider">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <p className="text-caption font-medium text-foreground mb-2">
              Agentics VA
            </p>
            <p className="text-caption text-muted-foreground">
              A chapter of the Agentics Foundation
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            <a 
              href="https://agentics.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-caption text-muted-foreground hover:text-foreground transition-subtle"
            >
              Agentics Foundation
            </a>
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
