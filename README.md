# SynapFlow – Audit de Maturité IA

Application web pour évaluer la maturité IA par département et générer un plan d’action priorisé.

## Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query

## Démarrer

```sh
git clone <YOUR_GIT_URL>
cd ia-assessment-lab
npm install
npm run dev
```

## Scripts

- npm run dev: serveur de dev
- npm run build: build de production
- npm run preview: prévisualisation du build
- npm run lint: lint
- npm test: tests unitaires (Vitest)

## Déploiement

Vous pouvez déployer sur Vercel, Netlify ou GitHub Pages. Un workflow CI est fourni (.github/workflows/ci.yml).

### Vercel + Supabase

1. Créez un projet Supabase et récupérez:
	- Project URL (ex: https://xyzcompany.supabase.co )
	- Public anon key
2. Ajoutez dans Vercel Project Settings > Environment Variables:
	- VITE_SUPABASE_URL = (URL du projet)
	- VITE_SUPABASE_ANON_KEY = (anon key)
	- (optionnel) API_KEY = clé pour protéger les endpoints internes
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Install Command: `npm install`
6. Framework preset: Vite (ou laisser auto)

Variables locales: copiez `.env.example` vers `.env.local` et remplissez.

Note: Les variables commençant par `VITE_` sont exposées au client. Ne placez jamais de clé `service_role` ou secrète ici.
