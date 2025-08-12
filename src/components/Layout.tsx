import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/questionnaire", label: "Questionnaire" },
  { to: "/resultats", label: "Résultats" },
  { to: "/plan", label: "Plan d’action" },
  { to: "/admin", label: "Admin" },
  { to: "/aide", label: "Aide" },
];

export const Layout: React.FC<{ children: React.ReactNode }>= ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="font-semibold tracking-tight">Audit de Maturité IA</Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            {navItems.map((n) => (
              <NavLink key={n.to} to={n.to} className={({isActive}) => cn("px-2 py-1 rounded-md hover:bg-accent", isActive && "bg-accent text-accent-foreground")}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/questionnaire">Commencer</Link></Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t py-6 text-sm text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Audit IA. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <a href="/aide" className="hover:underline">Aide</a>
            <a href="/" className="hover:underline">Accueil</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
