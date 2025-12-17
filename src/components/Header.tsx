import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Home, Calendar, HelpCircle } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/events", label: "Events", Icon: Calendar },
  { href: "/about", label: "About", Icon: HelpCircle },
];

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* Mobile menu button */}
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
