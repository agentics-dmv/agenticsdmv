import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import AdminLogin from "./AdminLogin";
import { Menu, X } from "lucide-react";

const navItems = [
  { path: "/admin", label: "Events" },
  { path: "/admin/recordings", label: "Recordings" },
  { path: "/admin/pages", label: "Pages" },
  { path: "/admin/members", label: "Members" },
];

const AdminLayout = () => {
  const { isAuthenticated, logout } = useAdminAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background z-50">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-caption text-muted-foreground hover:text-foreground transition-subtle">
              ← Site
            </Link>
            
            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-caption transition-subtle ${
                    location.pathname === item.path
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:flex">
              Logout
            </Button>
            
            {/* Mobile menu toggle */}
            <button
              className="sm:hidden p-2 text-muted-foreground hover:text-foreground transition-subtle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        
        {/* Mobile nav */}
        {menuOpen && (
          <nav className="sm:hidden border-t border-border bg-background">
            <div className="container py-2 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`py-2 text-body transition-subtle ${
                    location.pathname === item.path
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="py-2 text-body text-muted-foreground text-left"
              >
                Logout
              </button>
            </div>
          </nav>
        )}
      </header>
      
      <main className="container py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
