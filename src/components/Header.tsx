import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, HelpCircle, FolderGit2 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/events", label: "Events", Icon: Calendar },
  { href: "/resources", label: "Resources", Icon: FolderGit2 },
  { href: "/about", label: "About", Icon: HelpCircle },
];

const Header = () => {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-divider">
      <div className="container flex items-center justify-between h-14">
        <div className="w-8" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`transition-subtle ${
                location.pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={link.label}
            >
              <link.Icon size={18} />
            </Link>
          ))}
          <Link 
            to="/" 
            className="text-muted-foreground hover:text-foreground transition-subtle"
            aria-label="Home"
          >
            <Home size={18} />
          </Link>
          <ThemeToggle />
        </nav>

        {/* Mobile nav */}
        <div className="flex items-center gap-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`transition-subtle ${
                location.pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={link.label}
            >
              <link.Icon size={18} />
            </Link>
          ))}
          <Link 
            to="/" 
            className="text-muted-foreground hover:text-foreground transition-subtle"
            aria-label="Home"
          >
            <Home size={18} />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
