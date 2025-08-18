import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Referentiel = () => {
  return (
    <Layout>
      <SEO
        title="SynapFlow – Référentiel consultants"
        description="Processus, MODOP, livrables et liens utiles pour conduire un audit IA pas à pas."
        canonical={window.location.origin + "/referentiel"}
      />

      <header className="mb-6">
        <h1 className="text-3xl font-semibold">(Archive) Référentiel consultants – Audit de Maturité IA</h1>
        <p className="text-muted-foreground mt-2">
          Cette page est conservée pour compatibilité. Le contenu est désormais intégré et enrichi dans la page <a href="/reference" className="underline">Références & Guides</a> (modèles + mission + ressources).
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 order-last lg:order-first">
          <nav aria-label="Sommaire" className="text-sm">
            <ul className="space-y-2">
              <li><a className="hover:underline" href="#processus">Processus pas à pas</a></li>
              <li><a className="hover:underline" href="#modop">MODOP rapides</a></li>
              <li><a className="hover:underline" href="#livrables">Livrables types</a></li>
              <li><a className="hover:underline" href="#ressources">Ressources externes</a></li>
            </ul>
          </nav>
        </aside>

        <main className="lg:col-span-3 space-y-10">
          <section id="processus" aria-labelledby="processus-title">
            <h2 id="processus-title" className="text-2xl font-semibold mb-2">Processus pas à pas</h2>
            <p className="text-muted-foreground mb-4">Les étapes recommandées pour conduire l'audit du cadrage à la restitution.</p>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="etape-1">
                <AccordionTrigger>Étape 1 — Préparation & cadrage</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Définir le périmètre, les départements et les objectifs business de l'audit.</li>
                    <li>Identifier les parties prenantes et le sponsor; caler le planning et les jalons.</li>
                    <li>Valider la confidentialité et le traitement des données (RGPD).</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">Livrables: note de cadrage, RACI, planning.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="etape-2">
                <AccordionTrigger>Étape 2 — Collecte d'informations</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Entretiens ciblés (DG, métiers, IT, data) et revue documentaire (politiques, cas d'usage).</li>
                    <li>Cartographier les cas d'usage IA existants et en pipeline.</li>
                    <li>Préparer les données de référence (catégories, règles, pondérations).</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">Livrables: guide d'entretien, synthèse d'entretiens, cartographie des cas d'usage.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="etape-3">
                <AccordionTrigger>Étape 3 — Administration du questionnaire</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Filtrer par départements sélectionnés; expliquer l'échelle Likert 0–5 + N/A.</li>
                    <li>Collecter commentaires et preuves si score ≥ seuil de preuve.</li>
                    <li>Assurer un taux de complétion ≥ 80% (hors N/A).</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">Livrables: réponses brutes, journal des preuves.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="etape-4">
                <AccordionTrigger>Étape 4 — Consolidation & scoring</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Exclure les N/A des moyennes; appliquer les poids par question/catégorie.</li>
                    <li>Calculer scores par catégorie, par département, IA Core et global.</li>
                    <li>Identifier top forces/faiblesses et questions critiques (≤2).</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">Livrables: scorecard (CSV/JSON), annexes de calcul.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="etape-5">
                <AccordionTrigger>Étape 5 — Plan d'action priorisé</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Générer le plan via règles: catégories faibles (≤2) et questions critiques.</li>
                    <li>Ordonner par impact décroissant puis effort croissant; isoler les quick wins.</li>
                    <li>Valider la faisabilité avec les équipes et affecter des responsables.</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">Livrables: plan 0–90j, 3–6m, 6–12m; feuille de route.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="etape-6">
                <AccordionTrigger>Étape 6 — Restitution & décision</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Restituer les scores (gauge, radar, barres) et insights clés.</li>
                    <li>Partager recommandations, risques et hypothèses; cadrer les next steps.</li>
                    <li>Obtenir l'alignement du sponsor et des départements.</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">Livrables: deck de synthèse, annexe détaillée, export PDF/CSV.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="etape-7">
                <AccordionTrigger>Étape 7 — Suivi & itérations</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Mettre en place un suivi mensuel des actions et des KPI d'impact.</li>
                    <li>Réaliser un ré-audit ciblé après 3–6 mois pour mesurer les progrès.</li>
                    <li>Capitaliser: mettre à jour les règles et les questions si besoin.</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">Livrables: journal d'avancement, rapport d'impact, backlog d'amélioration.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section id="modop" aria-labelledby="modop-title">
            <h2 id="modop-title" className="text-2xl font-semibold mb-2">MODOP rapides (checklists)</h2>
            <div className="prose max-w-none">
              <ul>
                <li><strong>Avant lancement:</strong> Périmètre validé, sponsor nommé, planning partagé, risques RGPD couverts.</li>
                <li><strong>Pendant collecte:</strong> Sessions planifiées, explication de l'échelle, preuves encouragées, sauvegarde auto activée.</li>
                <li><strong>Qualité des données:</strong> ≥80% réponses non N/A, commentaires saisis pour scores 0–1.</li>
                <li><strong>Scoring:</strong> Vérifier pondérations, exclure N/A, contrôler extrêmes et cohérence inter-départements.</li>
                <li><strong>Plan:</strong> Quick wins identifiés, responsables/échéances, dépendances et risques notés.</li>
              </ul>
            </div>
          </section>

          <section id="livrables" aria-labelledby="livrables-title">
            <h2 id="livrables-title" className="text-2xl font-semibold mb-2">Livrables types</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Note de cadrage (objectifs, périmètre, jalons, RACI).</li>
              <li>Scorecard détaillée (CSV/JSON) et synthèse exécutive.</li>
              <li>Plan d'action priorisé (0–90j, 3–6m, 6–12m) avec responsables.</li>
              <li>Annexes: preuves clés, hypothèses, risques et mitigations.</li>
            </ul>
          </section>

          <section id="ressources" aria-labelledby="ressources-title">
            <h2 id="ressources-title" className="text-2xl font-semibold mb-2">Ressources externes</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><a className="underline" href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noreferrer noopener">NIST AI Risk Management Framework</a></li>
              <li><a className="underline" href="https://www.iso.org/standard/83908.html" target="_blank" rel="noreferrer noopener">ISO/IEC 42001 — Système de management de l'IA</a></li>
              <li><a className="underline" href="https://www.iso.org/standard/77223.html" target="_blank" rel="noreferrer noopener">ISO/IEC 23894 — Gestion des risques IA</a></li>
              <li><a className="underline" href="https://artificial-intelligence-act.eu/" target="_blank" rel="noreferrer noopener">EU AI Act — Portail d'information</a></li>
              <li><a className="underline" href="https://arxiv.org/abs/1810.03993" target="_blank" rel="noreferrer noopener">Model Cards</a> &nbsp;|&nbsp; <a className="underline" href="https://arxiv.org/abs/1803.09010" target="_blank" rel="noreferrer noopener">Datasheets for Datasets</a></li>
              <li><a className="underline" href="https://en.wikipedia.org/wiki/Cross-industry_standard_process_for_data_mining" target="_blank" rel="noreferrer noopener">CRISP‑DM</a> &nbsp;|&nbsp; <a className="underline" href="https://ml-ops.org/" target="_blank" rel="noreferrer noopener">MLOps Community</a></li>
            </ul>
          </section>
        </main>
      </div>
    </Layout>
  );
};

export default Referentiel;
