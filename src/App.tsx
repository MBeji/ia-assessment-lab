import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // landing kept eager for faster FCP
import { Suspense, lazy } from "react";
// Lazy-loaded pages (code splitting)
const Questionnaire = lazy(()=> import('./pages/Questionnaire'));
const Results = lazy(()=> import('./pages/Results'));
const Plan = lazy(()=> import('./pages/Plan'));
const Admin = lazy(()=> import('./pages/Admin'));
const Aide = lazy(()=> import('./pages/Aide'));
const Referentiel = lazy(()=> import('./pages/Referentiel'));
const Missions = lazy(()=> import('./pages/Missions'));
const NotFound = lazy(()=> import('./pages/NotFound'));
import { AssessmentProvider } from "./context/AssessmentContext";

const queryClient = new QueryClient();

class RouteErrorBoundary extends React.Component<{children: React.ReactNode}, {error?: any}> {
  constructor(props: any){ super(props); this.state = {}; }
  static getDerivedStateFromError(error: any){ return { error }; }
  componentDidCatch(err: any){ console.error('Route rendering error', err); }
  render(){ if(this.state.error) return <div className="p-8 text-sm text-destructive">Erreur d’affichage. <button className="underline" onClick={()=> { this.setState({error:undefined}); window.location.href='/'; }}>Retour accueil</button></div>; return this.props.children; }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AssessmentProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Chargement...</div>}>
            <RouteErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/questionnaire" element={<Questionnaire />} />
              <Route path="/resultats" element={<Results />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/aide" element={<Aide />} />
              <Route path="/referentiel" element={<Referentiel />} />
              <Route path="/missions" element={<Missions />} />
              <Route path="/archives" element={<Missions />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </RouteErrorBoundary>
          </Suspense>
        </BrowserRouter>
      </AssessmentProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
