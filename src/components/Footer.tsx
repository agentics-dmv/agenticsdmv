import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-divider">
      <div className="container">
        <div className="flex flex-wrap gap-6 mb-12">
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
        </div>
        <div className="pt-6 border-t border-divider">
          <p className="text-caption text-muted-foreground">
            © {currentYear} DMV Applied AI · A program of AI Ready RVA
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
