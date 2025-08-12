import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";

const Aide = () => {
  return (
    <Layout>
      <SEO title="Audit IA – Aide" description="Méthodologie, échelle et calculs de l'audit IA." canonical={window.location.origin + "/aide"} />
      <h1 className="text-3xl font-semibold mb-4">Aide & Méthodologie</h1>
      <div className="prose max-w-none">
        <h2>Échelle de maturité</h2>
        <p>Likert 0–5 + N/A: 0 Inexistant, 1 Ad hoc, 2 Basique, 3 Standardisé, 4 Intégré/Mesuré, 5 Optimisé/Automatisé.</p>
        <h2>Calcul des scores</h2>
        <ul>
          <li>Par question: 0–5, N/A exclu, poids appliqué.</li>
          <li>Par catégorie: moyenne pondérée des questions pertinentes, puis pourcentage (x/5*100).</li>
          <li>Par département: moyenne des catégories.</li>
          <li>Global: moyenne pondérée des départements (poids réglables dans Admin).</li>
          <li>Niveaux: 0–20 Initial, 21–40 Émergent, 41–60 Développé, 61–80 Avancé, 81–100 Leader.</li>
        </ul>
        <h2>Plan d’action</h2>
        <p>Un moteur de règles génère des actions par horizon (0–90j, 3–6m, 6–12m) quand une catégorie ≤ 2 ou une question critique ≤ 2.</p>
        <h2>Personnalisation</h2>
        <p>Ajoutez/éditez questions, catégories et règles depuis Admin. Export/Import JSON/CSV disponibles.</p>
      </div>
    </Layout>
  );
};

export default Aide;
