import { Link, NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from 'react';
import { Menu, X, Home, ClipboardList, BarChart2, ListChecks } from 'lucide-react';

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/questionnaire", label: "Questionnaire" },
  { to: "/resultats", label: "Résultats" },
  { to: "/plan", label: "Plan d’action" },
  { to: "/admin", label: "Admin" },
  { to: "/reference", label: "Références" },
  { to: "/missions", label: "Missions" },
  { to: "/aide", label: "Aide" },
];

export const Layout: React.FC<{ children: React.ReactNode }>= ({ children }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  // Close drawer on route change
  useEffect(()=> { setOpen(false); }, [location.pathname]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <a href="#main" className="skip-link">Aller au contenu</a>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button aria-label={open? 'Fermer le menu' : 'Ouvrir le menu'} className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent" onClick={()=> setOpen(o=> !o)}>
              {open? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="font-semibold tracking-tight">SynapFlow</Link>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            {navItems.map((n) => (
              <NavLink key={n.to} to={n.to} className={({isActive}) => cn("px-2 py-1 rounded-md hover:bg-accent", isActive && "bg-accent text-accent-foreground")}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="hidden sm:inline-flex" onClick={()=> alert('Authentification à implémenter')}>Login</Button>
          </div>
        </div>
        {/* Mobile slide-over menu */}
        {open && (
          <div className="md:hidden absolute inset-x-0 top-14 z-30 border-b bg-background/95 backdrop-blur shadow-sm animate-in slide-in-from-top">
            <div className="px-4 py-4 flex flex-col gap-1">
              {navItems.map(n => (
                <NavLink key={n.to} to={n.to} className={({isActive}) => cn("px-3 py-2 rounded-md text-sm flex items-center justify-between hover:bg-accent", isActive && "bg-accent text-accent-foreground")}>{n.label}</NavLink>
              ))}
              <Button size="sm" variant="secondary" className="mt-2" onClick={()=> alert('Authentification à implémenter')}>Login</Button>
            </div>
          </div>
        )}
      </header>
  <main id="main" className="container mx-auto px-4 pt-6 pb-28 md:pb-10 flex-1 w-full" role="main">
        {children}
      </main>
  <footer className="border-t py-6 text-sm text-muted-foreground hidden md:block" role="contentinfo">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} SynapFlow. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <a href="/aide" className="hover:underline">Aide</a>
            <a href="/reference" className="hover:underline">Références</a>
            <a href="/" className="hover:underline">Accueil</a>
          </div>
        </div>
      </footer>
      {/* Bottom mobile nav */}
  <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 pb-[env(safe-area-inset-bottom)]" aria-label="Navigation principale mobile">
        <ul className="flex items-stretch justify-around text-[11px]">
          <MobileLink to="/" icon={<Home className="h-4 w-4" />} label="Accueil" />
          <MobileLink to="/questionnaire" icon={<ClipboardList className="h-4 w-4" />} label="Quest." />
          <MobileLink to="/resultats" icon={<BarChart2 className="h-4 w-4" />} label="Résult." />
          <MobileLink to="/plan" icon={<ListChecks className="h-4 w-4" />} label="Plan" />
          <MobileLink to="/missions" icon={<ClipboardList className="h-4 w-4" />} label="Missions" />
        </ul>
      </nav>
  <div aria-live="polite" aria-atomic="true" className="sr-only" id="a11y-live-region"></div>
    </div>
  );
};

const MobileLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  return (
    <li className="flex-1">
      <NavLink
        to={to}
        className={({isActive}) => cn(
          "flex flex-col items-center justify-center gap-0.5 py-2 h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {icon}
        <span>{label}</span>
      </NavLink>
    </li>
  );
};
