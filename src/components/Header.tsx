import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-divider">
      <div className="container flex items-center justify-between h-14">
        <a href="/" className="text-caption uppercase tracking-widest font-medium text-foreground">
          Agentics VA
        </a>
        <nav className="flex items-center gap-8">
          <a href="#about" className="text-caption text-muted-foreground hover:text-foreground transition-subtle link-underline">
            About
          </a>
          <a href="#focus" className="text-caption text-muted-foreground hover:text-foreground transition-subtle link-underline">
            Focus
          </a>
          <a href="#community" className="text-caption text-muted-foreground hover:text-foreground transition-subtle link-underline">
            Community
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};

export default Header;
